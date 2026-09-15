from datetime import timedelta

from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from accounts.models import User
from cart.models import Cart, CartItem
from catalog.models import Product, ProductVariant

from .models import Order, ShippingRate, StockReservation
from .services import release_expired_reservations


class CheckoutTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="a@b.com", email="a@b.com", password="password-901"
        )
        self.client = APIClient()
        self.client.login(username="a@b.com", password="password-901")
        product = Product.objects.create(name="Test product", slug="test", is_published=True)
        self.variant = ProductVariant.objects.create(
            product=product, sku="TEST-1", price_irr=1000, stock_quantity=3, is_default=True
        )
        cart = Cart.objects.create(customer=self.user)
        CartItem.objects.create(cart=cart, variant=self.variant, quantity=2)
        ShippingRate.objects.create(region="TEHRAN", amount_irr=500)

    def checkout(self):
        return self.client.post(
            "/api/v1/orders/checkout/",
            {
                "shipping_region": "TEHRAN",
                "recipient_name": "Test",
                "recipient_phone": "09120000000",
                "address": "Tehran",
            },
            format="json",
        )

    def test_checkout_snapshots_and_reserves_stock(self):
        response = self.checkout()
        self.assertEqual(response.status_code, 201)
        order = Order.objects.get()
        self.assertEqual(order.total_irr, 2500)
        self.assertEqual(order.lines.get().unit_price_irr, 1000)
        self.assertEqual(order.shipping_region, "TEHRAN")
        self.variant.refresh_from_db()
        self.assertEqual(self.variant.stock_quantity, 1)
        self.assertFalse(CartItem.objects.exists())

    def test_expiry_releases_once(self):
        self.checkout()
        reservation = StockReservation.objects.get()
        reservation.expires_at = timezone.now() - timedelta(seconds=1)
        reservation.save(update_fields=("expires_at",))
        self.assertEqual(release_expired_reservations(), 1)
        self.assertEqual(release_expired_reservations(), 0)
        self.variant.refresh_from_db()
        self.assertEqual(self.variant.stock_quantity, 3)
