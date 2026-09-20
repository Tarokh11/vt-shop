from datetime import timedelta

from django.conf import settings
from django.db import transaction
from django.utils import timezone
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from cart.models import Cart
from catalog.models import ProductVariant

from .models import Order, OrderLine, ShippingRate, StockReservation
from .serializers import CheckoutSerializer, OrderSerializer


class OrderListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        orders = (
            request.user.orders.filter(status=Order.Status.PAID)
            .prefetch_related("lines")
            .select_related("shipment")
        )
        return Response(OrderSerializer(orders, many=True).data)


class CheckoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = CheckoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        with transaction.atomic():
            try:
                cart = Cart.objects.prefetch_related("items").get(customer=request.user)
            except Cart.DoesNotExist as error:
                raise ValidationError({"detail": "Your cart is empty."}) from error
            if not cart.items.exists():
                raise ValidationError({"detail": "Your cart is empty."})
            rate = (
                ShippingRate.objects.select_for_update()
                .filter(region=serializer.validated_data["shipping_region"], is_active=True)
                .first()
            )
            if rate is None:
                raise ValidationError(
                    {"shipping_region": ["Shipping is unavailable for this region."]}
                )
            variant_ids = [item.variant_id for item in cart.items.all()]
            variants = {
                item.id: item
                for item in ProductVariant.objects.select_for_update()
                .select_related("product")
                .filter(id__in=variant_ids)
            }
            subtotal = 0
            lines = []
            for item in cart.items.all():
                variant = variants.get(item.variant_id)
                if (
                    variant is None
                    or not variant.is_active
                    or not variant.product.is_published
                    or item.quantity > variant.stock_quantity
                ):
                    raise ValidationError({"detail": "Your cart contains an unavailable item."})
                line_total = item.quantity * variant.price_irr
                subtotal += line_total
                lines.append((item, variant, line_total))
            order = Order.objects.create(
                customer=request.user,
                shipping_region=rate.region,
                shipping_amount_irr=rate.amount_irr,
                subtotal_irr=subtotal,
                total_irr=subtotal + rate.amount_irr,
                recipient_name=serializer.validated_data["recipient_name"],
                recipient_phone=serializer.validated_data["recipient_phone"],
                address=serializer.validated_data["address"],
            )
            expiry = timezone.now() + timedelta(seconds=settings.STOCK_RESERVATION_SECONDS)
            for item, variant, line_total in lines:
                OrderLine.objects.create(
                    order=order,
                    sku=variant.sku,
                    product_name=variant.product.name,
                    product_slug=variant.product.slug,
                    variant_name=variant.name,
                    unit_price_irr=variant.price_irr,
                    quantity=item.quantity,
                    line_total_irr=line_total,
                )
                StockReservation.objects.create(
                    order=order, variant=variant, quantity=item.quantity, expires_at=expiry
                )
                variant.stock_quantity -= item.quantity
                variant.save(update_fields=("stock_quantity", "updated_at"))
            cart.items.all().delete()
        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)
