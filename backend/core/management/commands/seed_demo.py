from django.core.management.base import BaseCommand
from django.db import transaction

from accounts.models import User
from catalog.models import Category, InventoryAdjustment, Product, ProductVariant
from orders.models import ShippingRate


class Command(BaseCommand):
    help = "Create repeatable local catalog and shipping demo data."

    def handle(self, *args, **options):
        staff = User.objects.filter(is_staff=True).first()
        if staff is None:
            self.stderr.write(self.style.ERROR("Create a staff user before seeding demo data."))
            return
        products = (
            ("تی‌شرت ساده", "basic-tshirt", "TSHIRT-WHT-M", 2_490_000, 18),
            ("پیراهن کتان", "linen-shirt", "SHIRT-BLU-L", 4_850_000, 12),
            ("هودی روزمره", "everyday-hoodie", "HOODIE-GRY-L", 6_900_000, 9),
            ("شلوار جین راسته", "straight-jeans", "JEANS-IND-32", 7_400_000, 14),
        )
        with transaction.atomic():
            category, _ = Category.objects.get_or_create(
                slug="clothing", defaults={"name": "پوشاک", "is_active": True}
            )
            for name, slug, sku, price, stock in products:
                product, _ = Product.objects.get_or_create(
                    slug=slug, defaults={"name": name, "is_published": True}
                )
                product.categories.add(category)
                variant, _ = ProductVariant.objects.get_or_create(
                    sku=sku,
                    defaults={
                        "product": product, "name": name, "price_irr": price,
                        "stock_quantity": 0, "is_default": True,
                    },
                )
                if not InventoryAdjustment.objects.filter(
                    variant=variant, reason="Demo catalog seed"
                ).exists():
                    InventoryAdjustment.objects.create(
                        variant=variant, quantity_delta=stock,
                        reason="Demo catalog seed", created_by=staff,
                    )
                if not product.is_published:
                    product.is_published = True
                    product.save(update_fields=("is_published",))
            ShippingRate.objects.update_or_create(
                region=ShippingRate.Region.TEHRAN,
                defaults={"amount_irr": 100_000, "is_active": True},
            )
            ShippingRate.objects.update_or_create(
                region=ShippingRate.Region.OUTSIDE_TEHRAN,
                defaults={"amount_irr": 150_000, "is_active": True},
            )
        self.stdout.write(self.style.SUCCESS("Demo catalog and shipping data is ready."))
