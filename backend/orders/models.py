import uuid

from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models


class ShippingRate(models.Model):
    class Region(models.TextChoices):
        TEHRAN = "TEHRAN", "Tehran"
        OUTSIDE_TEHRAN = "OUTSIDE_TEHRAN", "Outside Tehran"

    region = models.CharField(max_length=20, choices=Region.choices, unique=True)
    amount_irr = models.PositiveBigIntegerField()
    is_active = models.BooleanField(default=True)


class Order(models.Model):
    class Status(models.TextChoices):
        PENDING_PAYMENT = "PENDING_PAYMENT", "Pending payment"
        PAID = "PAID", "Paid"
        CANCELLED = "CANCELLED", "Cancelled"

    number = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL, related_name="orders", on_delete=models.PROTECT
    )
    status = models.CharField(max_length=24, choices=Status.choices, default=Status.PENDING_PAYMENT)
    shipping_region = models.CharField(max_length=20, choices=ShippingRate.Region.choices)
    shipping_amount_irr = models.PositiveBigIntegerField()
    subtotal_irr = models.PositiveBigIntegerField()
    total_irr = models.PositiveBigIntegerField()
    recipient_name = models.CharField(max_length=160)
    recipient_phone = models.CharField(max_length=20)
    address = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-created_at",)


class OrderLine(models.Model):
    order = models.ForeignKey(Order, related_name="lines", on_delete=models.PROTECT)
    sku = models.CharField(max_length=80)
    product_name = models.CharField(max_length=180)
    variant_name = models.CharField(max_length=140, blank=True)
    unit_price_irr = models.PositiveBigIntegerField()
    quantity = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    line_total_irr = models.PositiveBigIntegerField()


class StockReservation(models.Model):
    class Status(models.TextChoices):
        ACTIVE = "ACTIVE", "Active"
        CONSUMED = "CONSUMED", "Consumed"
        RELEASED = "RELEASED", "Released"

    order = models.ForeignKey(Order, related_name="reservations", on_delete=models.PROTECT)
    variant = models.ForeignKey("catalog.ProductVariant", on_delete=models.PROTECT)
    quantity = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    expires_at = models.DateTimeField()
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.ACTIVE)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=("order", "variant"), name="orders_one_reservation_per_variant"
            )
        ]
