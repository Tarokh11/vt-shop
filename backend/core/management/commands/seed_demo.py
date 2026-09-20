from django.core.management.base import BaseCommand
from django.db import transaction

from orders.models import ShippingRate


class Command(BaseCommand):
    help = "Create repeatable local catalog and shipping demo data."

    def handle(self, *args, **options):
        with transaction.atomic():
            ShippingRate.objects.update_or_create(
                region=ShippingRate.Region.TEHRAN,
                defaults={"amount_irr": 100_000, "is_active": True},
            )
            ShippingRate.objects.update_or_create(
                region=ShippingRate.Region.OUTSIDE_TEHRAN,
                defaults={"amount_irr": 150_000, "is_active": True},
            )
        self.stdout.write(self.style.SUCCESS("Demo catalog and shipping data is ready."))
