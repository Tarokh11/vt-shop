from django.test import TestCase
from rest_framework.test import APIClient

from accounts.models import User
from catalog.models import Product, ProductVariant

from .models import CartItem


class CartApiTests(TestCase):
    def setUp(self):
        self.customer = User.objects.create_user(
            username="customer@example.com", email="customer@example.com", password="test-password"
        )
        self.other_customer = User.objects.create_user(
            username="other@example.com", email="other@example.com", password="test-password"
        )
        product = Product.objects.create(name="Runner", slug="runner", is_published=True)
        self.variant = ProductVariant.objects.create(
            product=product,
            sku="RUNNER-42",
            price_irr=1_250_000,
            stock_quantity=4,
            is_default=True,
        )
        self.client = APIClient(enforce_csrf_checks=True)
        self.assertTrue(self.client.login(username=self.customer.email, password="test-password"))

    def csrf_token(self):
        response = self.client.get("/api/v1/accounts/csrf/")
        self.assertEqual(response.status_code, 200)
        return response.cookies["csrftoken"].value

    def request(self, method, path, data=None):
        return getattr(self.client, method)(
            path,
            data,
            format="json",
            HTTP_X_CSRFTOKEN=self.csrf_token(),
        )

    def test_anonymous_customer_cannot_access_cart(self):
        anonymous = APIClient()
        self.assertEqual(anonymous.get("/api/v1/cart/").status_code, 403)

    def test_add_cart_item_uses_server_price_and_preserves_customer_cart(self):
        response = self.request(
            "post", "/api/v1/cart/items/", {"variant_id": self.variant.id, "quantity": 2}
        )
        self.assertEqual(response.status_code, 201)
        cart = response.json()
        self.assertEqual(cart["subtotal_irr"], 2_500_000)
        self.assertEqual(cart["items"][0]["price_irr"], 1_250_000)
        self.assertNotIn("stock_quantity", cart["items"][0])

        price_field_is_ignored = self.request(
            "post",
            "/api/v1/cart/items/",
            {"variant_id": self.variant.id, "quantity": 1, "price_irr": 1},
        )
        self.assertEqual(price_field_is_ignored.status_code, 200)
        self.assertEqual(price_field_is_ignored.json()["items"][0]["quantity"], 3)
        self.assertEqual(price_field_is_ignored.json()["subtotal_irr"], 3_750_000)

    def test_cart_rejects_unavailable_or_excessive_quantity_without_reserving_stock(self):
        response = self.request(
            "post", "/api/v1/cart/items/", {"variant_id": self.variant.id, "quantity": 5}
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("quantity", response.json())
        self.variant.refresh_from_db()
        self.assertEqual(self.variant.stock_quantity, 4)

        self.variant.is_active = False
        self.variant.is_default = False
        self.variant.save(update_fields=("is_active", "is_default"))
        inactive = self.request(
            "post", "/api/v1/cart/items/", {"variant_id": self.variant.id, "quantity": 1}
        )
        self.assertEqual(inactive.status_code, 400)
        self.assertIn("variant_id", inactive.json())

    def test_cart_item_quantity_update_and_removal(self):
        created = self.request(
            "post", "/api/v1/cart/items/", {"variant_id": self.variant.id, "quantity": 1}
        )
        item_id = created.json()["items"][0]["id"]
        updated = self.request("patch", f"/api/v1/cart/items/{item_id}/", {"quantity": 4})
        self.assertEqual(updated.status_code, 200)
        self.assertEqual(updated.json()["subtotal_irr"], 5_000_000)

        removed = self.request("delete", f"/api/v1/cart/items/{item_id}/")
        self.assertEqual(removed.status_code, 200)
        self.assertEqual(removed.json()["items"], [])

    def test_customer_cannot_access_or_modify_another_customers_item(self):
        created = self.request(
            "post", "/api/v1/cart/items/", {"variant_id": self.variant.id, "quantity": 1}
        )
        item_id = created.json()["items"][0]["id"]
        self.client.logout()
        self.assertTrue(
            self.client.login(username=self.other_customer.email, password="test-password")
        )
        self.assertEqual(self.client.get("/api/v1/cart/").json()["items"], [])
        response = self.request("patch", f"/api/v1/cart/items/{item_id}/", {"quantity": 2})
        self.assertEqual(response.status_code, 404)
        self.assertEqual(CartItem.objects.get(pk=item_id).quantity, 1)

    def test_mutations_require_csrf(self):
        response = self.client.post(
            "/api/v1/cart/items/", {"variant_id": self.variant.id, "quantity": 1}, format="json"
        )
        self.assertEqual(response.status_code, 403)
