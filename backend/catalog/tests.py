from django.contrib import admin
from django.core.exceptions import ValidationError
from django.core.management import call_command
from django.db import IntegrityError, transaction
from django.test import TestCase
from rest_framework.test import APIClient

from accounts.models import User

from .admin import ProductVariantAdmin
from .models import (
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
    ProductOptionDefinition,
    ProductVariant,
    VariantOptionValue,
)


class CatalogApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.category = Category.objects.create(name="Shoes", slug="shoes")
        self.product = Product.objects.create(name="Runner", slug="runner", is_published=True)
        self.product.categories.add(self.category)
        self.variant = ProductVariant.objects.create(
            product=self.product,
            sku="RUN-BLK-42",
            name="Black / 42",
            price_irr=12_500_000,
            stock_quantity=3,
            is_default=True,
        )

    def test_public_catalog_returns_integer_irr_and_availability_without_stock_count(self):
        response = self.client.get("/api/v1/catalog/products/")
        self.assertEqual(response.status_code, 200)
        item = response.json()["results"][0]
        self.assertEqual(item["name"], "Runner")
        self.assertEqual(item["variants"][0]["price_irr"], 12_500_000)
        self.assertIsInstance(item["variants"][0]["price_irr"], int)
        self.assertTrue(item["variants"][0]["available"])
        self.assertNotIn("stock_quantity", item["variants"][0])

    def test_unpublished_products_and_inactive_variants_are_not_public(self):
        self.product.is_published = False
        self.product.save(update_fields=("is_published",))
        self.assertEqual(self.client.get("/api/v1/catalog/products/").json()["count"], 0)

        self.product.is_published = True
        self.product.save(update_fields=("is_published",))
        self.variant.is_active = False
        self.variant.is_default = False
        self.variant.save(update_fields=("is_active", "is_default"))
        self.assertEqual(self.client.get("/api/v1/catalog/products/").json()["count"], 0)

    def test_published_product_requires_active_default_variant(self):
        draft = Product.objects.create(name="Draft", slug="draft")
        ProductVariant.objects.create(product=draft, sku="DRAFT-1", price_irr=100)
        draft.is_published = True
        with self.assertRaises(ValidationError):
            draft.full_clean()
        self.assertEqual(self.client.get("/api/v1/catalog/products/draft/").status_code, 404)

    def test_detail_excludes_inactive_categories_and_variants(self):
        hidden_category = Category.objects.create(name="Hidden", slug="hidden", is_active=False)
        self.product.categories.add(hidden_category)
        ProductVariant.objects.create(
            product=self.product, sku="HIDDEN", price_irr=100, stock_quantity=1, is_active=False
        )
        response = self.client.get("/api/v1/catalog/products/runner/")
        self.assertEqual(response.status_code, 200)
        category_slugs = [category["slug"] for category in response.json()["categories"]]
        variant_skus = [variant["sku"] for variant in response.json()["variants"]]
        self.assertEqual(category_slugs, ["shoes"])
        self.assertEqual(variant_skus, ["RUN-BLK-42"])

    def test_category_filter_and_category_endpoint(self):
        other = Product.objects.create(name="Hat", slug="hat", is_published=True)
        ProductVariant.objects.create(
            product=other, sku="HAT-DEFAULT", price_irr=1_000_000, stock_quantity=2, is_default=True
        )
        filtered = self.client.get("/api/v1/catalog/products/?category=shoes")
        self.assertEqual(filtered.json()["count"], 1)
        self.assertEqual(filtered.json()["results"][0]["slug"], "runner")
        self.assertEqual(self.client.get("/api/v1/catalog/categories/").json()[0]["slug"], "shoes")

    def test_product_detail_includes_four_related_names_without_prices(self):
        for position in range(5):
            related = Product.objects.create(
                name=f"Related {position}", slug=f"related-{position}", is_published=True
            )
            related.categories.add(self.category)
            ProductVariant.objects.create(
                product=related,
                sku=f"RELATED-{position}",
                price_irr=100_000 + position,
                is_default=True,
            )

        related = self.client.get("/api/v1/catalog/products/runner/").json()["related_products"]
        self.assertEqual(len(related), 4)
        self.assertTrue(all(set(item) == {"id", "name", "slug", "images"} for item in related))
        self.assertNotIn("price_irr", related[0])


class InventoryTests(TestCase):
    def setUp(self):
        self.staff = User.objects.create_user(
            username="staff@example.com", email="staff@example.com", password="test", is_staff=True
        )
        self.product = Product.objects.create(name="Product", slug="product")
        self.variant = ProductVariant.objects.create(
            product=self.product, sku="SKU-1", price_irr=500_000, stock_quantity=2, is_default=True
        )

    def test_adjustment_updates_stock_and_records_result(self):
        adjustment = InventoryAdjustment.objects.create(
            variant=self.variant, quantity_delta=5, reason="Initial stock", created_by=self.staff
        )
        self.variant.refresh_from_db()
        self.assertEqual(self.variant.stock_quantity, 7)
        self.assertEqual(adjustment.resulting_quantity, 7)

    def test_adjustment_cannot_make_stock_negative(self):
        with self.assertRaises(ValidationError), transaction.atomic():
            InventoryAdjustment.objects.create(
                variant=self.variant, quantity_delta=-3, reason="Damage", created_by=self.staff
            )
        self.variant.refresh_from_db()
        self.assertEqual(self.variant.stock_quantity, 2)
        self.assertFalse(InventoryAdjustment.objects.exists())

    def test_adjustments_cannot_be_changed_or_deleted(self):
        adjustment = InventoryAdjustment.objects.create(
            variant=self.variant, quantity_delta=1, reason="Correction", created_by=self.staff
        )
        adjustment.reason = "Rewritten"
        with self.assertRaises(ValidationError):
            adjustment.save()
        with self.assertRaises(ValidationError):
            adjustment.delete()

    def test_product_has_at_most_one_default_variant(self):
        with self.assertRaises(IntegrityError), transaction.atomic():
            ProductVariant.objects.create(
                product=self.product, sku="SKU-2", price_irr=500_000, is_default=True
            )

    def test_admin_prevents_direct_stock_editing(self):
        model_admin = ProductVariantAdmin(ProductVariant, admin.site)
        self.assertIn("stock_quantity", model_admin.get_readonly_fields(request=None))


class CatalogStructureTests(TestCase):
    def setUp(self):
        self.category = Category.objects.create(name="Pens", slug="pens")
        self.product = Product.objects.create(name="Pen", slug="pen")
        self.product.categories.add(self.category)
        self.variant = ProductVariant.objects.create(
            product=self.product, sku="PEN-BLK", price_irr=100_000, is_default=True
        )
        self.color = AttributeDefinition.objects.create(
            name="Color", slug="color", is_filterable=True
        )
        self.black = AttributeValue.objects.create(
            definition=self.color, label="Black", slug="black"
        )
        CategoryAttributeDefinition.objects.create(category=self.category, definition=self.color)

    def test_category_cannot_be_its_own_descendant(self):
        child = Category.objects.create(name="Gel pens", slug="gel-pens", parent=self.category)
        self.category.parent = child
        with self.assertRaises(ValidationError):
            self.category.full_clean()

    def test_brand_and_collection_are_additive_product_relations(self):
        brand = Brand.objects.create(name="Acme", slug="acme")
        collection = Collection.objects.create(name="New", slug="new")
        self.product.brand = brand
        self.product.save(update_fields=("brand",))
        CollectionProduct.objects.create(collection=collection, product=self.product, position=1)
        self.product.refresh_from_db()
        self.assertEqual(self.product.brand, brand)
        self.assertEqual(list(collection.products.all()), [self.product])

    def test_product_attribute_requires_an_applicable_definition(self):
        assignment = ProductAttributeValue(product=self.product, value=self.black)
        assignment.full_clean()

        material = AttributeDefinition.objects.create(name="Material", slug="material")
        plastic = AttributeValue.objects.create(
            definition=material, label="Plastic", slug="plastic"
        )
        with self.assertRaises(ValidationError):
            ProductAttributeValue(product=self.product, value=plastic).full_clean()

    def test_variant_option_requires_product_option_and_matching_value_definition(self):
        option = ProductOptionDefinition(product=self.product, definition=self.color)
        option.full_clean()
        option.save()
        assignment = VariantOptionValue(variant=self.variant, option=option, value=self.black)
        assignment.full_clean()

        tip_size = AttributeDefinition.objects.create(name="Tip size", slug="tip-size")
        fine = AttributeValue.objects.create(definition=tip_size, label="Fine", slug="fine")
        with self.assertRaises(ValidationError):
            VariantOptionValue(variant=self.variant, option=option, value=fine).full_clean()

    def test_product_attribute_and_variant_option_cannot_share_a_definition(self):
        ProductAttributeValue.objects.create(product=self.product, value=self.black)
        with self.assertRaises(ValidationError):
            ProductOptionDefinition(product=self.product, definition=self.color).full_clean()


class CatalogFilteringTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.writing = Category.objects.create(name="Writing", slug="writing")
        self.pens = Category.objects.create(name="Pens", slug="pens", parent=self.writing)
        self.notebooks = Category.objects.create(
            name="Notebooks", slug="notebooks", parent=self.writing
        )
        self.acme = Brand.objects.create(name="Acme", slug="acme")
        self.other = Brand.objects.create(name="Other", slug="other")
        self.color = AttributeDefinition.objects.create(
            name="Color", slug="color", is_filterable=True, is_searchable=True
        )
        self.blue = AttributeValue.objects.create(definition=self.color, label="Blue", slug="blue")
        self.black = AttributeValue.objects.create(
            definition=self.color, label="Black", slug="black", position=1
        )
        for category in (self.pens, self.notebooks):
            CategoryAttributeDefinition.objects.create(category=category, definition=self.color)
        self.paper_size = AttributeDefinition.objects.create(
            name="Paper size", slug="paper-size", is_filterable=True
        )
        self.a5 = AttributeValue.objects.create(
            definition=self.paper_size, label="A5", slug="a5"
        )
        CategoryAttributeDefinition.objects.create(
            category=self.notebooks, definition=self.paper_size
        )

        self.pen, self.pen_variant = self.create_product(
            name="Blue pen",
            slug="blue-pen",
            sku="PEN-BLUE",
            category=self.pens,
            brand=self.acme,
            stock=3,
        )
        pen_option = ProductOptionDefinition.objects.create(product=self.pen, definition=self.color)
        VariantOptionValue.objects.create(
            variant=self.pen_variant, option=pen_option, value=self.blue
        )

        self.notebook, self.notebook_variant = self.create_product(
            name="Black notebook",
            slug="black-notebook",
            sku="NOTEBOOK-BLACK",
            category=self.notebooks,
            brand=self.other,
            stock=0,
        )
        ProductAttributeValue.objects.create(product=self.notebook, value=self.black)
        self.collection = Collection.objects.create(name="Featured", slug="featured")
        CollectionProduct.objects.create(collection=self.collection, product=self.pen)

    def create_product(self, name, slug, sku, category, brand, stock):
        product = Product.objects.create(name=name, slug=slug, brand=brand, is_published=True)
        product.categories.add(category)
        variant = ProductVariant.objects.create(
            product=product,
            sku=sku,
            price_irr=100_000,
            stock_quantity=stock,
            is_default=True,
        )
        return product, variant

    def test_category_brand_collection_attribute_and_stock_filters(self):
        response = self.client.get("/api/v1/catalog/products/?category=writing")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 2)
        self.assertEqual(
            len(self.client.get("/api/v1/catalog/products/?page_size=1").json()["results"]), 1
        )

        self.assertEqual(
            self.client.get("/api/v1/catalog/products/?brand=acme").json()["count"], 1
        )
        self.assertEqual(
            self.client.get("/api/v1/catalog/products/?collection=featured").json()["count"], 1
        )
        self.assertEqual(
            self.client.get(
                "/api/v1/catalog/products/?category=pens&attribute=color:blue"
            ).json()["count"],
            1,
        )
        self.assertEqual(
            self.client.get(
                "/api/v1/catalog/products/?category=notebooks&attribute=color:black"
            ).json()["count"],
            1,
        )
        self.assertEqual(
            self.client.get("/api/v1/catalog/products/?in_stock=true").json()["count"], 1
        )
        self.assertEqual(
            self.client.get("/api/v1/catalog/products/?in_stock=false").json()["count"], 1
        )

    def test_search_and_invalid_filters_are_validated(self):
        self.assertEqual(self.client.get("/api/v1/catalog/products/?q=blue").json()["count"], 1)
        self.assertEqual(
            self.client.get("/api/v1/catalog/products/?q=NOTEBOOK-BLACK").json()["count"], 1
        )
        self.assertEqual(
            self.client.get("/api/v1/catalog/products/?attribute=color:blue").status_code, 400
        )
        self.assertEqual(
            self.client.get("/api/v1/catalog/products/?attribute=color").status_code, 400
        )
        self.assertEqual(
            self.client.get(
                "/api/v1/catalog/products/?category=pens&attribute=paper-size:a5"
            ).status_code,
            400,
        )
        self.assertEqual(
            self.client.get("/api/v1/catalog/products/?in_stock=yes").status_code, 400
        )
        self.assertEqual(self.client.get("/api/v1/catalog/products/?unknown=x").status_code, 400)

    def test_filter_metadata_and_normalized_option_output(self):
        self.assertEqual(self.client.get("/api/v1/catalog/filters/").json()["attributes"], [])
        filters = self.client.get("/api/v1/catalog/filters/?category=pens")
        self.assertEqual(filters.status_code, 200)
        self.assertEqual(filters.json()["attributes"][0]["slug"], "color")
        self.assertEqual(
            [value["slug"] for value in filters.json()["attributes"][0]["values"]],
            ["blue", "black"],
        )
        self.assertEqual(
            [item["slug"] for item in filters.json()["attributes"]], ["color"]
        )

        product = self.client.get("/api/v1/catalog/products/blue-pen/").json()
        self.assertEqual(product["brand"]["slug"], "acme")
        self.assertEqual(product["option_definitions"][0]["definition"]["slug"], "color")
        self.assertEqual(product["variants"][0]["option_values"][0]["value"]["slug"], "blue")


class StationerySampleCommandTests(TestCase):
    def setUp(self):
        User.objects.create_user(
            username="staff@example.com", email="staff@example.com", password="test", is_staff=True
        )

    def test_sample_command_creates_public_filterable_data_without_duplicate_stock(self):
        call_command("seed_stationery")
        adjustment_count = InventoryAdjustment.objects.count()
        call_command("seed_stationery")

        self.assertEqual(Brand.objects.filter(is_active=True).count(), 3)
        self.assertEqual(Category.objects.filter(slug="stationery", is_active=True).count(), 1)
        self.assertEqual(AttributeDefinition.objects.filter(is_filterable=True).count(), 7)
        self.assertEqual(Collection.objects.filter(is_active=True).count(), 2)
        self.assertEqual(Product.objects.filter(slug__startswith="gel-pen").count(), 1)
        self.assertEqual(InventoryAdjustment.objects.count(), adjustment_count)

        client = APIClient()
        self.assertEqual(
            client.get("/api/v1/catalog/products/?category=stationery").json()["count"], 5
        )
        self.assertEqual(client.get("/api/v1/catalog/products/?brand=rooyesh").json()["count"], 2)
        self.assertEqual(
            client.get(
                "/api/v1/catalog/products/?category=notebooks-paper&attribute=paper-size:a5"
            ).json()["count"],
            1,
        )
