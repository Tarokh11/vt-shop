from datetime import timedelta
from unittest.mock import patch

from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from accounts.models import User
from catalog.models import Product, ProductVariant
from orders.models import Order, StockReservation

from .models import PaymentAttempt


class PaymentMockTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="payment@example.com", email="payment@example.com", password="test-password"
        )
        product = Product.objects.create(
            name="Payment product", slug="payment-product", is_published=True
        )
        self.variant = ProductVariant.objects.create(
            product=product, sku="PAYMENT-1", price_irr=1000, stock_quantity=0, is_default=True
        )
        self.order = Order.objects.create(
            customer=self.user, shipping_region="TEHRAN", shipping_amount_irr=100,
            subtotal_irr=1000, total_irr=1100, recipient_name="Test",
            recipient_phone="0912", address="Tehran",
        )
        StockReservation.objects.create(
            order=self.order, variant=self.variant, quantity=1,
            expires_at=timezone.now() + timedelta(minutes=1),
        )
        self.client = APIClient()

    @patch("payments.views.request_payment", return_value=("authority-1", "/gateway"))
    def test_start_payment_is_customer_owned(self, request_payment):
        self.client.force_authenticate(self.user)
        response = self.client.post(f"/api/v1/payments/orders/{self.order.number}/start/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"redirect_url": "/gateway"})
        request_payment.assert_called_once_with(self.order)

    @patch("payments.views.verify_payment", return_value="ref-1")
    def test_callback_marks_order_paid_and_is_idempotent(self, verify_payment):
        PaymentAttempt.objects.create(order=self.order, authority="authority-1")
        callback = "/api/v1/payments/zarinpal/callback/?Authority=authority-1&Status=OK"
        self.assertEqual(self.client.get(callback).status_code, 302)
        self.order.refresh_from_db()
        self.assertEqual(self.order.status, Order.Status.PAID)
        self.assertEqual(PaymentAttempt.objects.get().status, PaymentAttempt.Status.SUCCEEDED)
        self.assertEqual(StockReservation.objects.get().status, StockReservation.Status.CONSUMED)
        self.assertEqual(self.client.get(callback).status_code, 302)
        verify_payment.assert_called_once()
