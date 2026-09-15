from django.conf import settings
from django.db import transaction
from django.http import HttpResponseRedirect
from django.utils import timezone
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from orders.models import Order, StockReservation

from .models import PaymentAttempt
from .zarinpal import ZarinpalError, request_payment, verify_payment


class StartPaymentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, number):
        order = Order.objects.filter(
            number=number, customer=request.user, status=Order.Status.PENDING_PAYMENT
        ).first()
        if not order:
            raise ValidationError({"detail": "This order cannot be paid."})
        try:
            authority, url = request_payment(order)
        except ZarinpalError as error:
            raise ValidationError({"detail": str(error)}) from error
        PaymentAttempt.objects.create(order=order, authority=authority)
        return Response({"redirect_url": url})


class ZarinpalCallbackView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        authority = request.query_params.get("Authority", "")
        attempt = PaymentAttempt.objects.select_related("order").filter(authority=authority).first()
        if not attempt or request.query_params.get("Status") != "OK":
            return HttpResponseRedirect(f"{settings.FRONTEND_ORIGIN}/orders?payment=failed")
        try:
            reference = verify_payment(attempt.order, authority)
        except ZarinpalError:
            return HttpResponseRedirect(f"{settings.FRONTEND_ORIGIN}/orders?payment=failed")
        with transaction.atomic():
            attempt = (
                PaymentAttempt.objects.select_for_update()
                .select_related("order")
                .get(pk=attempt.pk)
            )
            if attempt.status != PaymentAttempt.Status.SUCCEEDED:
                reservations = attempt.order.reservations.select_for_update().filter(
                    status=StockReservation.Status.ACTIVE
                )
                if (
                    not reservations.exists()
                    or reservations.filter(expires_at__lte=timezone.now()).exists()
                ):
                    return HttpResponseRedirect(f"{settings.FRONTEND_ORIGIN}/orders?payment=review")
                attempt.order.reservations.filter(status=StockReservation.Status.ACTIVE).update(
                    status=StockReservation.Status.CONSUMED
                )
                attempt.status = PaymentAttempt.Status.SUCCEEDED
                attempt.provider_reference = reference
                attempt.save(update_fields=("status", "provider_reference"))
                attempt.order.status = Order.Status.PAID
                attempt.order.save(update_fields=("status",))
        return HttpResponseRedirect(f"{settings.FRONTEND_ORIGIN}/orders?payment=success")


class MockZarinpalGatewayView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request, authority):
        if not settings.DEBUG or not settings.ZARINPAL_MOCK or not authority.startswith("mock-"):
            return Response(status=404)
        return HttpResponseRedirect(
            f"{settings.ZARINPAL_CALLBACK_URL}?Authority={authority}&Status=OK"
        )
