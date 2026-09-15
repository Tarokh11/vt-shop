from django.contrib.auth.tokens import default_token_generator
from django.core import mail
from django.test import TestCase
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from rest_framework.test import APIClient

from .models import User


class AccountApiTests(TestCase):
    def setUp(self):
        self.client = APIClient(enforce_csrf_checks=True)

    def csrf_token(self):
        response = self.client.get("/api/v1/accounts/csrf/")
        self.assertEqual(response.status_code, 200)
        return response.cookies["csrftoken"].value

    def post_with_csrf(self, path, data):
        return self.client.post(
            path, data, format="json", HTTP_X_CSRFTOKEN=self.csrf_token()
        )

    def create_customer(self, email="customer@example.com", password="Valid-pass-901"):
        return User.objects.create_user(
            username=email, email=email, password=password, first_name="Customer"
        )

    def test_registration_requires_csrf_and_creates_authenticated_customer(self):
        data = {"email": "New@Example.com", "password": "Valid-pass-901"}
        rejected = self.client.post("/api/v1/accounts/register/", data, format="json")
        self.assertEqual(rejected.status_code, 403)
        self.assertEqual(rejected.json(), {"detail": "CSRF verification failed."})

        response = self.post_with_csrf("/api/v1/accounts/register/", data)
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["email"], "new@example.com")
        self.assertNotIn("password", response.json())
        self.assertEqual(self.client.get("/api/v1/accounts/me/").status_code, 200)

    def test_duplicate_email_is_rejected_case_insensitively(self):
        self.create_customer()
        response = self.post_with_csrf(
            "/api/v1/accounts/register/",
            {"email": "CUSTOMER@example.com", "password": "Valid-pass-902"},
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("email", response.json())

    def test_login_profile_update_logout_and_anonymous_protection(self):
        self.create_customer()
        self.assertEqual(self.client.get("/api/v1/accounts/me/").status_code, 403)

        response = self.post_with_csrf(
            "/api/v1/accounts/login/",
            {"email": "CUSTOMER@example.com", "password": "Valid-pass-901"},
        )
        self.assertEqual(response.status_code, 200)
        update = self.client.patch(
            "/api/v1/accounts/me/",
            {"first_name": "Updated", "email": "ignored@example.com"},
            format="json",
            HTTP_X_CSRFTOKEN=self.client.cookies["csrftoken"].value,
        )
        self.assertEqual(update.status_code, 200)
        self.assertEqual(update.json()["first_name"], "Updated")
        self.assertEqual(update.json()["email"], "customer@example.com")

        logout_response = self.client.post(
            "/api/v1/accounts/logout/",
            HTTP_X_CSRFTOKEN=self.client.cookies["csrftoken"].value,
        )
        self.assertEqual(logout_response.status_code, 204)
        self.assertEqual(self.client.get("/api/v1/accounts/me/").status_code, 403)

    def test_invalid_login_does_not_reveal_which_credential_failed(self):
        self.create_customer()
        response = self.post_with_csrf(
            "/api/v1/accounts/login/",
            {"email": "customer@example.com", "password": "wrong-password"},
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()["detail"], ["Invalid email or password."])

    def test_password_reset_is_non_enumerating_and_token_is_single_use(self):
        user = self.create_customer()
        unknown = self.post_with_csrf(
            "/api/v1/accounts/password-reset/", {"email": "missing@example.com"}
        )
        known = self.post_with_csrf(
            "/api/v1/accounts/password-reset/", {"email": user.email}
        )
        self.assertEqual(unknown.status_code, 200)
        self.assertEqual(unknown.json(), known.json())
        self.assertEqual(len(mail.outbox), 1)
        self.assertNotIn(user.password, mail.outbox[0].body)

        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)
        payload = {"uid": uid, "token": token, "password": "New-valid-pass-902"}
        confirmed = self.post_with_csrf("/api/v1/accounts/password-reset/confirm/", payload)
        self.assertEqual(confirmed.status_code, 200)

        repeated = self.post_with_csrf("/api/v1/accounts/password-reset/confirm/", payload)
        self.assertEqual(repeated.status_code, 400)
        user.refresh_from_db()
        self.assertTrue(user.check_password("New-valid-pass-902"))

    def test_customer_profile_never_exposes_another_customer(self):
        first = self.create_customer()
        self.create_customer("other@example.com")
        self.client.force_authenticate(first)
        response = self.client.get("/api/v1/accounts/me/")
        self.assertEqual(response.json()["email"], first.email)
        self.assertNotContains(response, "other@example.com")
