from django.db import transaction
from django.utils import timezone

from .models import StockReservation


def release_expired_reservations(now=None):
    now = now or timezone.now()
    released = 0
    with transaction.atomic():
        reservations = (
            StockReservation.objects.select_for_update()
            .select_related("variant")
            .filter(status=StockReservation.Status.ACTIVE, expires_at__lte=now)
        )
        for reservation in reservations:
            variant = reservation.variant
            variant.stock_quantity += reservation.quantity
            variant.save(update_fields=("stock_quantity", "updated_at"))
            reservation.status = StockReservation.Status.RELEASED
            reservation.save(update_fields=("status",))
            released += 1
    return released
