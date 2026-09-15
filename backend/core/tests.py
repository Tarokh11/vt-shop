from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.db import OperationalError
from django.test import TestCase
from rest_framework.test import APIClient


class FoundationTests(TestCase):
    def test_liveness_does_not_query_database(self):
        with self.assertNumQueries(0):
            response = APIClient().get("/api/v1/health/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "ok"})

    def test_readiness_checks_database(self):
        self.assertEqual(APIClient().get("/api/v1/ready/").status_code, 200)

    def test_database_failure_returns_sanitized_unavailable_response(self):
        with patch("core.views.connection.cursor", side_effect=OperationalError("secret")):
            response = APIClient().get("/api/v1/ready/")
        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.json(), {"status": "unavailable"})

    def test_custom_superuser_can_login_to_admin(self):
        user = get_user_model().objects.create_superuser(
            username="admin", email="admin@example.com", password="test-password"
        )
        self.assertTrue(user.check_password("test-password"))
        self.assertTrue(self.client.login(username="admin", password="test-password"))
        self.assertEqual(self.client.get("/admin/").status_code, 200)

    def test_customer_cannot_access_admin(self):
        user = get_user_model().objects.create_user(username="customer", password="test-password")
        self.client.force_login(user)
        self.assertEqual(self.client.get("/admin/").status_code, 302)
