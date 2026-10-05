import tempfile
from io import BytesIO

from django.contrib.auth.models import Permission
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import Client, TestCase, override_settings
from django.urls import reverse
from PIL import Image

from accounts.models import User

from .management_views import product_version
from .models import (
    AttributeDefinition,
    AttributeValue,
    Category,
    CategoryAttributeDefinition,
    InventoryAdjustment,
    Product,
    ProductImage,
    ProductOptionDefinition,
    ProductVariant,
    VariantOptionValue,
)


class ProductManagementTests(TestCase):
    def setUp(self):
        self.media = tempfile.TemporaryDirectory()
        self.addCleanup(self.media.cleanup)
        self.settings_override = override_settings(MEDIA_ROOT=self.media.name)
        self.settings_override.enable()
        self.addCleanup(self.settings_override.disable)
        self.staff = User.objects.create_superuser(
            username="manager", email="manager@example.com", password="test-password"
        )
        self.customer = User.objects.create_user(
            username="customer", email="customer@example.com", password="test-password"
        )
        self.category = Category.objects.create(name="دفتر", slug="notebooks")
        self.product = Product.objects.create(name="دفتر تست", slug="test-notebook")
        self.product.categories.add(self.category)
        self.variant = ProductVariant.objects.create(
            product=self.product,
            sku="NOTE-1",
            price_irr=100_000,
            stock_quantity=7,
            is_default=True,
        )
        self.client.force_login(self.staff)

    def edit_url(self, product=None):
        return reverse("catalog_management:product_edit", args=[(product or self.product).pk])

    def payload(self, product=None):
        product = product or self.product
        product.refresh_from_db()
        variants = list(product.variants.all())
        images = list(product.images.all())
        data = {
            "name": product.name,
            "slug": product.slug,
            "description": product.description,
            "brand": product.brand_id or "",
            "categories": [self.category.pk],
            "version": product_version(product),
            "variants-TOTAL_FORMS": str(len(variants)),
            "variants-INITIAL_FORMS": str(len(variants)),
            "variants-MIN_NUM_FORMS": "0",
            "variants-MAX_NUM_FORMS": "100",
            "images-TOTAL_FORMS": str(len(images)),
            "images-INITIAL_FORMS": str(len(images)),
            "images-MIN_NUM_FORMS": "0",
            "images-MAX_NUM_FORMS": "30",
        }
        if product.is_published:
            data["publish"] = "on"
        for index, variant in enumerate(variants):
            prefix = f"variants-{index}"
            data.update(
                {
                    f"{prefix}-id": variant.pk,
                    f"{prefix}-sku": variant.sku,
                    f"{prefix}-name": variant.name,
                    f"{prefix}-price_irr": variant.price_irr,
                }
            )
            for flag in ("is_active", "is_default"):
                if getattr(variant, flag):
                    data[f"{prefix}-{flag}"] = "on"
            for value in variant.option_values.all():
                data[f"{prefix}-option_{value.option_id}"] = value.value_id
        for index, image in enumerate(images):
            data.update(
                {
                    f"images-{index}-id": image.pk,
                    f"images-{index}-alt_text": image.alt_text,
                    f"images-{index}-position": image.position,
                }
            )
        return data

    def image_file(self):
        content = BytesIO()
        Image.new("RGB", (8, 8), "blue").save(content, format="PNG")
        return SimpleUploadedFile("test.png", content.getvalue(), content_type="image/png")

    def test_list_editor_login_and_django_admin_remain_available(self):
        self.assertContains(self.client.get(reverse("catalog_management:products")), "دفتر تست")
        self.assertContains(self.client.get(self.edit_url()), "تنوع‌ها و قیمت")
        self.assertContains(
            self.client.get(reverse("catalog_management:product_create")), "یک محصول تازه"
        )
        self.assertEqual(self.client.get(reverse("catalog_management:login")).status_code, 200)
        self.assertEqual(self.client.get(reverse("admin:index")).status_code, 200)

    def test_anonymous_customer_and_staff_without_permissions_cannot_access_catalog(self):
        url = reverse("catalog_management:products")
        self.client.logout()
        self.assertRedirects(
            self.client.get(url), reverse("catalog_management:login") + "?next=" + url
        )
        self.client.force_login(self.customer)
        self.assertEqual(self.client.get(url).status_code, 403)
        employee = User.objects.create_user(
            username="employee", email="employee@example.com", is_staff=True
        )
        self.client.force_login(employee)
        self.assertEqual(self.client.get(url).status_code, 403)
        employee.user_permissions.add(Permission.objects.get(codename="view_product"))
        self.assertEqual(self.client.get(url).status_code, 200)
        self.assertEqual(self.client.post(self.edit_url(), self.payload()).status_code, 403)

    def test_nonstaff_login_and_external_redirect_are_rejected(self):
        self.client.logout()
        url = reverse("catalog_management:login")
        response = self.client.post(url, {"username": "customer", "password": "test-password"})
        self.assertContains(response, "فقط برای کارکنان")
        self.assertNotIn("_auth_user_id", self.client.session)
        response = self.client.post(
            url,
            {
                "username": "manager",
                "password": "test-password",
                "next": "https://example.com/",
            },
        )
        self.assertRedirects(response, reverse("catalog_management:products"))

    def test_both_panels_share_edits_and_product_identity(self):
        data = self.payload()
        data.update(name="نام جدید", publish="on", **{"variants-0-price_irr": 250_000})
        self.assertRedirects(self.client.post(self.edit_url(), data), self.edit_url())
        self.product.refresh_from_db()
        self.variant.refresh_from_db()
        self.assertEqual(self.product.name, "نام جدید")
        self.assertEqual(self.variant.price_irr, 250_000)
        self.assertEqual(self.variant.stock_quantity, 7)
        admin_url = reverse("admin:catalog_product_change", args=[self.product.pk])
        self.assertContains(self.client.get(admin_url), "نام جدید")
        admin_page = self.client.get(admin_url)
        admin_data = self.payload()
        admin_data["name"] = "ویرایش از Django"
        admin_data["is_published"] = "on"
        admin_data["variants-0-price_irr"] = 270_000
        for inline in admin_page.context["inline_admin_formsets"]:
            formset = inline.formset
            prefix = formset.prefix
            admin_data.update(
                {
                    f"{prefix}-TOTAL_FORMS": formset.initial_form_count(),
                    f"{prefix}-INITIAL_FORMS": formset.initial_form_count(),
                    f"{prefix}-MIN_NUM_FORMS": 0,
                    f"{prefix}-MAX_NUM_FORMS": formset.max_num,
                }
            )
        response = self.client.post(admin_url, admin_data)
        self.assertEqual(response.status_code, 302)
        self.variant.refresh_from_db()
        self.assertEqual(self.variant.price_irr, 270_000)
        self.assertContains(self.client.get(self.edit_url()), "ویرایش از Django")
        self.assertContains(
            self.client.get(reverse("catalog_management:products")), "ویرایش از Django"
        )

    def test_create_published_product_and_active_default_variant_atomically(self):
        data = self.payload()
        data.update(name="محصول جدید", slug="new-product", version="", publish="on")
        data["variants-INITIAL_FORMS"] = "0"
        data["variants-0-id"] = ""
        data["variants-0-sku"] = "NEW-1"
        response = self.client.post(reverse("catalog_management:product_create"), data)
        created = Product.objects.get(slug="new-product")
        self.assertRedirects(response, self.edit_url(created))
        self.assertTrue(created.is_published)
        variant = created.variants.get()
        self.assertTrue(variant.is_default)
        self.assertEqual(variant.stock_quantity, 0)
        self.assertEqual(created.categories.get(), self.category)

    def test_invalid_publication_and_duplicate_sku_save_nothing(self):
        data = self.payload()
        data.update(name="نباید ذخیره شود", publish="on")
        data.pop("variants-0-is_default")
        response = self.client.post(self.edit_url(), data)
        self.assertContains(response, "برای انتشار محصول")
        self.product.refresh_from_db()
        self.assertEqual(self.product.name, "دفتر تست")
        data = self.payload()
        data.update(slug="other", name="other", **{"variants-INITIAL_FORMS": "0"})
        data["variants-0-id"] = ""
        response = self.client.post(reverse("catalog_management:product_create"), data)
        self.assertEqual(response.status_code, 200)
        self.assertFalse(Product.objects.filter(slug="other").exists())

    def test_can_switch_default_without_changing_existing_variant_ids(self):
        second = ProductVariant.objects.create(
            product=self.product, sku="NOTE-2", price_irr=200_000
        )
        data = self.payload()
        data["publish"] = "on"
        data.pop("variants-0-is_default")
        data["variants-1-is_default"] = "on"
        self.assertRedirects(self.client.post(self.edit_url(), data), self.edit_url())
        self.variant.refresh_from_db()
        second.refresh_from_db()
        self.assertFalse(self.variant.is_default)
        self.assertTrue(second.is_default)
        self.assertEqual(self.product.variants.count(), 2)

    def test_stale_product_or_stock_change_does_not_overwrite_newer_edit(self):
        data = self.payload()
        self.product.name = "تغییر جدید"
        self.product.save()
        response = self.client.post(self.edit_url(), data)
        self.assertEqual(response.status_code, 409)
        self.product.refresh_from_db()
        self.assertEqual(self.product.name, "تغییر جدید")
        data = self.payload()
        InventoryAdjustment.objects.create(
            variant=self.variant,
            quantity_delta=2,
            reason="new delivery",
            created_by=self.staff,
        )
        response = self.client.post(self.edit_url(), data)
        self.assertEqual(response.status_code, 409)
        self.variant.refresh_from_db()
        self.assertEqual(self.variant.stock_quantity, 9)
        data = self.payload()
        # Admin's bulk publication action updates the field without updated_at.
        Product.objects.filter(pk=self.product.pk).update(is_published=True)
        self.assertEqual(self.client.post(self.edit_url(), data).status_code, 409)
        self.product.refresh_from_db()
        self.assertTrue(self.product.is_published)

    def test_cannot_omit_duplicate_or_use_another_products_variant(self):
        other = Product.objects.create(name="Other", slug="other")
        foreign = ProductVariant.objects.create(product=other, sku="FOREIGN", price_irr=10)
        data = self.payload()
        data["variants-0-id"] = foreign.pk
        data["variants-0-sku"] = "CHANGED"
        self.assertEqual(self.client.post(self.edit_url(), data).status_code, 200)
        foreign.refresh_from_db()
        self.assertEqual(foreign.sku, "FOREIGN")
        data = self.payload()
        data.update({"variants-TOTAL_FORMS": "0", "variants-INITIAL_FORMS": "0"})
        self.assertContains(self.client.post(self.edit_url(), data), "نباید حذف یا تکرار")
        self.assertTrue(ProductVariant.objects.filter(pk=self.variant.pk).exists())

    def test_stock_adjustment_is_audited_and_negative_stock_is_rejected(self):
        url = reverse("catalog_management:stock_adjust", args=[self.product.pk, self.variant.pk])
        self.assertRedirects(
            self.client.post(url, {"quantity_delta": 3, "reason": "دریافت بار"}), self.edit_url()
        )
        adjustment = InventoryAdjustment.objects.get()
        self.assertEqual(adjustment.created_by, self.staff)
        self.assertEqual(adjustment.resulting_quantity, 10)
        self.variant.refresh_from_db()
        self.assertEqual(self.variant.stock_quantity, 10)
        self.assertContains(
            self.client.post(url, {"quantity_delta": -11, "reason": "کاهش"}), "منفی"
        )
        self.assertEqual(InventoryAdjustment.objects.count(), 1)
        self.assertContains(
            self.client.post(url, {"quantity_delta": 0, "reason": "هیچ"}), "نباید صفر"
        )
        bad_url = reverse("catalog_management:stock_adjust", args=[9999, self.variant.pk])
        self.assertEqual(
            self.client.post(bad_url, {"quantity_delta": 1, "reason": "x"}).status_code, 404
        )

    def test_related_permissions_are_enforced_and_direct_stock_posts_are_ignored(self):
        employee = User.objects.create_user(
            username="editor", email="editor@example.com", is_staff=True
        )
        employee.user_permissions.add(
            *Permission.objects.filter(
                content_type__app_label="catalog", codename__in=["view_product", "change_product"]
            )
        )
        self.client.force_login(employee)
        data = self.payload()
        data["variants-0-price_irr"] = 999
        self.assertEqual(self.client.post(self.edit_url(), data).status_code, 403)
        data = self.payload()
        data["variants-0-stock_quantity"] = 999
        self.assertRedirects(self.client.post(self.edit_url(), data), self.edit_url())
        self.variant.refresh_from_db()
        self.assertEqual(self.variant.stock_quantity, 7)
        url = reverse("catalog_management:stock_adjust", args=[self.product.pk, self.variant.pk])
        self.assertEqual(
            self.client.post(url, {"quantity_delta": 1, "reason": "x"}).status_code, 403
        )

    def test_image_upload_edit_delete_and_invalid_upload(self):
        data = self.payload()
        data.update(
            {
                "images-TOTAL_FORMS": "1",
                "images-0-image": self.image_file(),
                "images-0-alt_text": "تصویر تست",
                "images-0-position": "0",
            }
        )
        self.assertRedirects(self.client.post(self.edit_url(), data), self.edit_url())
        image = ProductImage.objects.get()
        data = self.payload()
        data["images-0-alt_text"] = "توضیح جدید"
        self.assertRedirects(self.client.post(self.edit_url(), data), self.edit_url())
        image.refresh_from_db()
        self.assertEqual(image.alt_text, "توضیح جدید")
        data = self.payload()
        data["images-0-DELETE"] = "on"
        self.assertRedirects(self.client.post(self.edit_url(), data), self.edit_url())
        self.assertFalse(ProductImage.objects.exists())
        data = self.payload()
        data.update(
            {
                "images-TOTAL_FORMS": "1",
                "images-0-position": "0",
                "images-0-image": SimpleUploadedFile("bad.png", b"not an image"),
            }
        )
        self.assertEqual(self.client.post(self.edit_url(), data).status_code, 200)
        self.assertFalse(ProductImage.objects.exists())

    def test_option_values_are_preserved_and_invalid_combinations_rejected(self):
        definition = AttributeDefinition.objects.create(name="رنگ", slug="color")
        CategoryAttributeDefinition.objects.create(category=self.category, definition=definition)
        blue = AttributeValue.objects.create(definition=definition, label="آبی", slug="blue")
        red = AttributeValue.objects.create(definition=definition, label="قرمز", slug="red")
        option = ProductOptionDefinition.objects.create(product=self.product, definition=definition)
        assignment = VariantOptionValue.objects.create(
            variant=self.variant, option=option, value=blue
        )
        data = self.payload()
        data[f"variants-0-option_{option.pk}"] = red.pk
        self.assertRedirects(self.client.post(self.edit_url(), data), self.edit_url())
        assignment.refresh_from_db()
        self.assertEqual(assignment.value, red)
        data = self.payload()
        data.update(
            {
                "variants-TOTAL_FORMS": "2",
                "variants-1-sku": "NOTE-2",
                "variants-1-price_irr": 200,
                "variants-1-is_active": "on",
                f"variants-1-option_{option.pk}": red.pk,
            }
        )
        self.assertContains(self.client.post(self.edit_url(), data), "ترکیب گزینه‌های یکسان")
        self.assertFalse(ProductVariant.objects.filter(sku="NOTE-2").exists())

    def test_search_counts_all_variants_and_filters_drafts(self):
        ProductVariant.objects.create(
            product=self.product, sku="OTHER", price_irr=500, stock_quantity=3
        )
        response = self.client.get(reverse("catalog_management:products"), {"q": "NOTE-1"})
        row = response.context["page"][0]
        self.assertEqual(row.variant_count, 2)
        self.assertEqual(row.stock_total, 10)
        self.assertEqual(row.starting_price, 500)
        response = self.client.get(reverse("catalog_management:products"), {"status": "published"})
        self.assertEqual(response.context["page"].paginator.count, 0)

    def test_post_requires_csrf_and_get_does_not_log_out(self):
        client = Client(enforce_csrf_checks=True)
        client.force_login(self.staff)
        self.assertEqual(client.post(self.edit_url(), self.payload()).status_code, 403)
        url = reverse("catalog_management:logout")
        self.assertEqual(client.get(url).status_code, 405)
        self.assertIn("_auth_user_id", client.session)
        client.get(self.edit_url())
        response = client.post(
            self.edit_url(), self.payload(), HTTP_X_CSRFTOKEN=client.cookies["csrftoken"].value
        )
        self.assertEqual(response.status_code, 302)
