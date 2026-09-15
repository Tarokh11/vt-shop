# Release Checklist

## Local demo

- PostgreSQL is running and `.env` is loaded in the backend shell.
- Migrations are applied with `python backend/manage.py migrate`.
- An admin exists with `python backend/manage.py createsuperuser`.
- Repeatable demo data is available with `python backend/manage.py seed_demo`.
- Development payment simulation uses `DJANGO_DEBUG=true` and
  `ZARINPAL_MOCK=true` only.
- Frontend and backend are started separately as described in `README.md`.

## Verification

- Account registration/login/profile/logout works through the same-origin proxy.
- Published catalog items, cart, both shipping regions, and order history work.
- Mock payment returns through the callback and marks the order paid once.
- Staff can create a shipment only for a paid order and customers see its status.
- Run backend tests, Ruff, Django checks, frontend lint/typecheck, and build.
- Run reservation expiry as a scheduled operation.

## Production gate

- Replace the mock with a real Zarinpal merchant ID and verified HTTPS callback URL.
- Confirm Zarinpal amount units against the IRR order total.
- Verify request, callback, server verification, duplicate/delayed callbacks, and
  refund query/event support in the sandbox.
- Set `DJANGO_DEBUG=false`, use a strong secret, HTTPS, HSTS, real email delivery,
  persistent media storage, and `ZARINPAL_MOCK=false`.
- Do not branch a production store until the real payment gate is complete.
