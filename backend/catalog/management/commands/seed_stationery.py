from pathlib import Path

from django.core.files import File
from django.core.management.base import BaseCommand
from django.db import transaction

from accounts.models import User
from catalog.models import (
    AttributeDefinition,
    AttributeValue,
    Brand,
    Category,
    CategoryAttributeDefinition,
    Collection,
    CollectionProduct,
    InventoryAdjustment,
    Product,
    ProductAttributeValue,
    ProductImage,
    ProductOptionDefinition,
    ProductVariant,
    VariantOptionValue,
)


class Command(BaseCommand):
    help = "Create repeatable stationery sample catalog data for the vt-shop branch."

    def handle(self, *args, **options):
        staff = User.objects.filter(is_staff=True).first()
        if staff is None:
            self.stderr.write(
                self.style.ERROR("Create a staff user before seeding stationery data.")
            )
            return

        with transaction.atomic():
            categories = self.create_categories()
            brands = self.create_brands()
            definitions, values = self.create_attributes()
            self.create_category_mappings(categories, definitions)
            products = self.create_products(categories, brands, definitions, values, staff)
            self.create_collections(products)

        self.stdout.write(self.style.SUCCESS("Stationery sample catalog data is ready."))

    def create_categories(self):
        category_data = (
            ("stationery", "لوازم‌التحریر", None, 1),
            ("writing-tools", "ابزار نوشتن", "stationery", 1),
            ("notebooks-paper", "دفتر و کاغذ", "stationery", 2),
            ("art-supplies", "لوازم هنری", "stationery", 3),
            ("office-supplies", "لوازم اداری", "stationery", 4),
        )
        categories = {}
        for slug, name, parent_slug, position in category_data:
            parent = categories.get(parent_slug)
            category, _ = Category.objects.update_or_create(
                slug=slug,
                defaults={"name": name, "parent": parent, "is_active": True, "position": position},
            )
            categories[slug] = category
        return categories

    def create_brands(self):
        brand_data = (
            ("rooyesh", "رویِش", 1),
            ("rangin", "رنگین", 2),
            ("negar", "نگار", 3),
        )
        brands = {}
        for slug, name, position in brand_data:
            brand, _ = Brand.objects.update_or_create(
                slug=slug, defaults={"name": name, "is_active": True, "position": position}
            )
            brands[slug] = brand
        return brands

    def create_attributes(self):
        attribute_data = (
            ("color", "رنگ", 1),
            ("tip-size", "ضخامت نوک", 2),
            ("paper-size", "اندازه کاغذ", 3),
            ("ruling", "نوع خط‌کشی", 4),
            ("page-count", "تعداد برگ", 5),
            ("pack-quantity", "تعداد در بسته", 6),
            ("material", "جنس", 7),
        )
        value_data = {
            "color": (
                ("blue", "آبی"), ("black", "مشکی"), ("red", "قرمز"),
                ("gray", "طوسی"), ("green", "سبز"), ("yellow", "زرد"),
            ),
            "tip-size": (("0-5-mm", "۰٫۵ میلی‌متر"), ("0-7-mm", "۰٫۷ میلی‌متر")),
            "paper-size": (("a5", "A5"), ("a4", "A4")),
            "ruling": (("lined", "خط‌دار"), ("dotted", "نقطه‌ای"),),
            "page-count": (("40", "۴۰ برگ"), ("80", "۸۰ برگ"), ("120", "۱۲۰ برگ")),
            "pack-quantity": (("6", "۶ رنگ"), ("12", "۱۲ رنگ"), ("24", "۲۴ رنگ")),
            "material": (("plastic", "پلاستیک"), ("cardboard", "مقوا"), ("metal", "فلز")),
        }
        definitions = {}
        values = {}
        for slug, name, position in attribute_data:
            definition, _ = AttributeDefinition.objects.update_or_create(
                slug=slug,
                defaults={
                    "name": name,
                    "is_visible": True,
                    "is_filterable": True,
                    "is_searchable": True,
                    "position": position,
                },
            )
            definitions[slug] = definition
            values[slug] = {}
            for value_position, (value_slug, label) in enumerate(value_data[slug], start=1):
                value, _ = AttributeValue.objects.update_or_create(
                    definition=definition,
                    slug=value_slug,
                    defaults={"label": label, "is_active": True, "position": value_position},
                )
                values[slug][value_slug] = value
        return definitions, values

    def create_category_mappings(self, categories, definitions):
        category_attributes = {
            "writing-tools": ("color", "tip-size", "pack-quantity"),
            "notebooks-paper": ("paper-size", "ruling", "page-count"),
            "art-supplies": ("pack-quantity", "paper-size", "page-count"),
            "office-supplies": ("color", "material"),
        }
        for category_slug, attribute_slugs in category_attributes.items():
            for position, attribute_slug in enumerate(attribute_slugs, start=1):
                CategoryAttributeDefinition.objects.update_or_create(
                    category=categories[category_slug],
                    definition=definitions[attribute_slug],
                    defaults={"is_required": True, "position": position},
                )

    def create_products(self, categories, brands, definitions, values, staff):
        product_data = (
            {
                "slug": "gel-pen-duo",
                "name": "خودکار ژله‌ای دوتایی",
                "description": "نوشتاری روان برای یادداشت‌های روزانه، با دو رنگ کاربردی.",
                "category": "writing-tools",
                "brand": "rooyesh",
                "variants": (
                    (
                        "GEL-PEN-BLUE-07",
                        "آبی / ۰٫۷",
                        185_000,
                        16,
                        {"color": "blue", "tip-size": "0-7-mm"},
                    ),
                    (
                        "GEL-PEN-BLACK-07",
                        "مشکی / ۰٫۷",
                        185_000,
                        12,
                        {"color": "black", "tip-size": "0-7-mm"},
                    ),
                ),
                "image": "writing-tools.svg",
            },
            {
                "slug": "mechanical-pencil-05",
                "name": "مداد نوکی ۰٫۵",
                "description": "مداد نوکی سبک برای مدرسه، طراحی و نوشتن دقیق.",
                "category": "writing-tools",
                "brand": "negar",
                "variants": (
                    (
                        "PENCIL-GRAY-05",
                        "طوسی / ۰٫۵",
                        240_000,
                        10,
                        {"color": "gray", "tip-size": "0-5-mm"},
                    ),
                    (
                        "PENCIL-BLUE-05",
                        "آبی / ۰٫۵",
                        240_000,
                        8,
                        {"color": "blue", "tip-size": "0-5-mm"},
                    ),
                ),
                "image": "writing-tools.svg",
            },
            {
                "slug": "a5-lined-notebook",
                "name": "دفتر خط‌دار A5",
                "description": "دفتر سبک و خوش‌دوخت برای کلاس، برنامه‌ریزی و یادداشت‌برداری.",
                "category": "notebooks-paper",
                "brand": "rooyesh",
                "attributes": {"paper-size": "a5", "ruling": "lined", "page-count": "80"},
                "variants": (("NOTEBOOK-A5-LINED", "A5 / خط‌دار", 390_000, 20, {}),),
                "image": "notebook.svg",
            },
            {
                "slug": "watercolor-pencil-set",
                "name": "مداد رنگی آبرنگی",
                "description": "رنگ‌های زنده برای تمرین‌های هنری و طراحی روزمره.",
                "category": "art-supplies",
                "brand": "rangin",
                "variants": (
                    ("WATERCOLOR-12", "۱۲ رنگ", 780_000, 9, {"pack-quantity": "12"}),
                    ("WATERCOLOR-24", "۲۴ رنگ", 1_390_000, 6, {"pack-quantity": "24"}),
                ),
                "image": "art-supplies.svg",
            },
            {
                "slug": "desktop-organizer",
                "name": "جا قلمی رومیزی",
                "description": "نظم‌دهنده رومیزی جمع‌وجور برای ابزار نوشتن و لوازم کوچک.",
                "category": "office-supplies",
                "brand": "negar",
                "attributes": {"material": "plastic"},
                "variants": (
                    ("ORGANIZER-GRAY", "طوسی", 640_000, 7, {"color": "gray"}),
                    ("ORGANIZER-BLUE", "آبی", 640_000, 5, {"color": "blue"}),
                ),
                "image": "desk-organizer.svg",
            },
            {
                "slug": "fountain-pen",
                "name": "خودنویس کلاسیک",
                "description": "خودنویسی خوش‌دست برای نامه‌ها، یادداشت‌های مهم و امضای روزانه.",
                "category": "writing-tools",
                "brand": "rooyesh",
                "variants": (
                    ("FOUNTAIN-BLACK", "مشکی", 1_250_000, 8, {"color": "black"}),
                    ("FOUNTAIN-GREEN", "سبز", 1_250_000, 6, {"color": "green"}),
                ),
                "image": "writing-tools.svg",
            },
            {
                "slug": "pastel-highlighter-set",
                "name": "ست هایلایتر پاستلی",
                "description": "شش رنگ ملایم برای خلاصه‌نویسی، برنامه‌ریزی و مطالعه.",
                "category": "writing-tools",
                "brand": "rangin",
                "variants": (("HIGHLIGHTER-6", "۶ رنگ", 520_000, 14, {"pack-quantity": "6"}),),
                "image": "writing-tools.svg",
            },
            {
                "slug": "dotted-notebook",
                "name": "دفتر نقطه‌ای A5",
                "description": "دفتر نقطه‌ای برای بولت ژورنال، طراحی و برنامه‌ریزی منعطف.",
                "category": "notebooks-paper",
                "brand": "rooyesh",
                "attributes": {"paper-size": "a5", "ruling": "dotted", "page-count": "120"},
                "variants": (("NOTEBOOK-A5-DOT", "A5 / نقطه‌ای", 560_000, 18, {}),),
                "image": "notebook.svg",
            },
            {
                "slug": "a4-sketchbook",
                "name": "دفتر طراحی A4",
                "description": "کاغذ باکیفیت برای طراحی، اسکیس و تمرین‌های رنگی.",
                "category": "art-supplies",
                "brand": "negar",
                "attributes": {"paper-size": "a4", "page-count": "40"},
                "variants": (("SKETCHBOOK-A4", "A4 / ۴۰ برگ", 680_000, 11, {}),),
                "image": "art-supplies.svg",
            },
            {
                "slug": "metal-desk-tray",
                "name": "سینی فلزی رومیزی",
                "description": "سینی مینیمال برای مرتب نگه داشتن برگه‌ها و نامه‌های روزانه.",
                "category": "office-supplies",
                "brand": "negar",
                "attributes": {"material": "metal"},
                "variants": (("TRAY-GREEN", "سبز", 890_000, 7, {"color": "green"}),),
                "image": "desk-organizer.svg",
            },
            {
                "slug": "document-folder",
                "name": "پوشه مدارک رنگی",
                "description": "پوشه سبک و مقاوم برای اسناد، جزوه‌ها و برگه‌های مهم.",
                "category": "office-supplies",
                "brand": "rangin",
                "attributes": {"material": "cardboard"},
                "variants": (("FOLDER-YELLOW", "زرد", 260_000, 22, {"color": "yellow"}),),
                "image": "desk-organizer.svg",
            },
        )
        products = {}
        for data in product_data:
            product, _ = Product.objects.update_or_create(
                slug=data["slug"],
                defaults={
                    "name": data["name"],
                    "description": data["description"],
                    "brand": brands[data["brand"]],
                    "is_published": False,
                    "creation_source": Product.CreationSource.INVENTORY,
                    "is_archived": False,
                },
            )
            product.categories.set((categories[data["category"]],))
            self.create_product_attributes(product, data.get("attributes", {}), values)
            self.create_variants(product, data["variants"], definitions, values, staff)
            self.create_product_image(product, data["image"])
            product.is_published = True
            product.save(update_fields=("is_published", "updated_at"))
            products[data["slug"]] = product
        return products

    def create_product_image(self, product, filename):
        image = ProductImage.objects.filter(product=product, position=1).first()
        if image is not None:
            return
        source = Path(__file__).resolve().parents[2] / "sample_images" / filename
        if not source.exists():
            return
        with source.open("rb") as image_file:
            ProductImage.objects.create(
                product=product,
                image=File(image_file, name=f"stationery/{filename}"),
                alt_text=product.name,
                position=1,
            )

    def create_product_attributes(self, product, attributes, values):
        for attribute_slug, value_slug in attributes.items():
            ProductAttributeValue.objects.get_or_create(
                product=product, value=values[attribute_slug][value_slug]
            )

    def create_variants(self, product, variants, definitions, values, staff):
        for variant_position, (sku, name, price, stock, option_data) in enumerate(variants):
            variant, created = ProductVariant.objects.get_or_create(
                sku=sku,
                defaults={
                    "product": product,
                    "name": name,
                    "price_irr": price,
                    "stock_quantity": 0,
                    "is_active": True,
                    "is_default": variant_position == 0,
                },
            )
            if not created:
                variant.product = product
                variant.name = name
                variant.price_irr = price
                variant.is_active = True
                variant.is_default = variant_position == 0
                variant.save(
                    update_fields=(
                        "product",
                        "name",
                        "price_irr",
                        "is_active",
                        "is_default",
                        "updated_at",
                    )
                )
            for option_position, (attribute_slug, value_slug) in enumerate(
                option_data.items(), start=1
            ):
                option, _ = ProductOptionDefinition.objects.get_or_create(
                    product=product,
                    definition=definitions[attribute_slug],
                    defaults={"position": option_position},
                )
                VariantOptionValue.objects.update_or_create(
                    variant=variant,
                    option=option,
                    defaults={"value": values[attribute_slug][value_slug]},
                )
            reason = f"Stationery sample seed: {sku}"
            if not InventoryAdjustment.objects.filter(variant=variant, reason=reason).exists():
                InventoryAdjustment.objects.create(
                    variant=variant,
                    quantity_delta=stock,
                    reason=reason,
                    created_by=staff,
                )

    def create_collections(self, products):
        collections = {
            "back-to-school": (
                "بازگشت به مدرسه",
                ("gel-pen-duo", "mechanical-pencil-05", "a5-lined-notebook"),
            ),
            "creative-desk": ("میز خلاق", ("watercolor-pencil-set", "desktop-organizer")),
        }
        for collection_position, (slug, (name, product_slugs)) in enumerate(
            collections.items(), start=1
        ):
            collection, _ = Collection.objects.update_or_create(
                slug=slug,
                defaults={"name": name, "is_active": True, "position": collection_position},
            )
            for product_position, product_slug in enumerate(product_slugs, start=1):
                CollectionProduct.objects.update_or_create(
                    collection=collection,
                    product=products[product_slug],
                    defaults={"position": product_position},
                )
