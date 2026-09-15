import json
import uuid
from urllib.error import URLError
from urllib.request import Request, urlopen

from django.conf import settings


class ZarinpalError(Exception):
    pass


def _post(path, payload):
    request = Request(
        f"https://payment.zarinpal.com/pg/v4/payment/{path}.json",
        data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urlopen(request, timeout=10) as response:
            return json.loads(response.read())
    except (URLError, TimeoutError, json.JSONDecodeError) as error:
        raise ZarinpalError("Zarinpal is unavailable.") from error


def request_payment(order):
    if settings.ZARINPAL_MOCK and settings.DEBUG:
        authority = f"mock-{uuid.uuid4().hex}"
        return authority, f"/api/v1/payments/zarinpal/mock/{authority}/"
    if not settings.ZARINPAL_MERCHANT_ID:
        raise ZarinpalError("Zarinpal merchant ID is not configured.")
    data = _post(
        "request",
        {
            "merchant_id": settings.ZARINPAL_MERCHANT_ID,
            "amount": order.total_irr,
            "callback_url": settings.ZARINPAL_CALLBACK_URL,
            "description": f"Order {order.number}",
        },
    ).get("data", {})
    if data.get("code") != 100:
        raise ZarinpalError("Zarinpal did not create a payment.")
    authority = data["authority"]
    return authority, f"https://www.zarinpal.com/pg/StartPay/{authority}"


def verify_payment(order, authority):
    if settings.ZARINPAL_MOCK and settings.DEBUG and authority.startswith("mock-"):
        return authority.removeprefix("mock-")
    data = _post(
        "verify",
        {
            "merchant_id": settings.ZARINPAL_MERCHANT_ID,
            "amount": order.total_irr,
            "authority": authority,
        },
    ).get("data", {})
    if data.get("code") not in (100, 101):
        raise ZarinpalError("Payment verification failed.")
    return str(data["ref_id"])
