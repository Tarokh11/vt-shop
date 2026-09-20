from pathlib import Path

from django.conf import settings
from django.core import serializers
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from cart.models import CartItem
from catalog.models import Category, InventoryAdjustment, Product, ProductVariant
from orders.models import StockReservation


class Command(BaseCommand):
    help = "Export the clothing catalog to a fixture and remove it from the active database."

    def add_arguments(self, parser):
        parser.add_argument(
            "--output",
            default=str(Path(settings.BASE_DIR) / "catalog/fixtures/clothing_catalog.json"),
        )
        parser.add_argument(
            "--deactivate",
            action="store_true",
            help="Keep protected historical rows but hide clothing from the active catalog.",
        )

    def handle(self, *args, **options):
        category = Category.objects.filter(slug="clothing").first()
        if category is None:
            self.stdout.write(self.style.WARNING("No clothing category found."))
            return

        products = Product.objects.filter(categories=category).distinct()
        variants = ProductVariant.objects.filter(product__in=products)
        has_cart_items = CartItem.objects.filter(variant__in=variants).exists()
        has_reservations = StockReservation.objects.filter(variant__in=variants).exists()
        if has_cart_items and not options["deactivate"]:
            raise CommandError("Clothing products are still present in customer carts.")
        if has_reservations and not options["deactivate"]:
            raise CommandError("Clothing products are referenced by stock reservations.")

        brands = list(
            product_brand
            for product_brand in Product.objects.filter(pk__in=products.values("pk"))
            .exclude(brand=None)
            .values_list("brand", flat=True)
        )
        objects = [category, *products, *variants]
        if brands:
            from catalog.models import Brand

            objects[1:1] = list(Brand.objects.filter(pk__in=brands))
        fixture = serializers.serialize("json", objects, indent=2)
        output = Path(options["output"])
        output.parent.mkdir(parents=True, exist_ok=True)
        with transaction.atomic():
            output.write_text(fixture + "\n", encoding="utf-8")
            if options["deactivate"]:
                products.update(is_published=False)
                category.is_active = False
                category.save(update_fields=("is_active",))
            else:
                InventoryAdjustment.objects.filter(variant__in=variants).delete()
                products.delete()
                category.delete()
        action = (
            "deactivated protected clothing rows"
            if options["deactivate"]
            else "removed clothing rows"
        )
        self.stdout.write(
            self.style.SUCCESS(f"Archived clothing catalog to {output} and {action}.")
        )
