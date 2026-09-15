# E-commerce Starter

Reusable single-store e-commerce foundation for Iran-based stores.

## Local setup

Requirements: Python 3.12+, Node.js 22+, npm, and PostgreSQL 17+ (or Docker).

1. Copy `.env.example` to `.env` and replace the secret and database password.
2. Start PostgreSQL, or run `docker compose up -d db` when Docker is available.
3. Install backend dependencies: `.venv/bin/pip install -r backend/requirements-dev.txt`.
4. Load the backend environment for the current terminal:
   `set -a; . ./.env; set +a`.
5. Apply migrations: `.venv/bin/python backend/manage.py migrate`.
6. Create an administrator: `.venv/bin/python backend/manage.py createsuperuser`.
7. Start Django from `backend/`: `../.venv/bin/python manage.py runserver`.
8. Install frontend dependencies from `frontend/`: `npm install`.
9. Start Next.js from `frontend/`: `npm run dev`.

The storefront is available at `http://localhost:3000`, Admin at
`http://127.0.0.1:8000/admin/`, and health endpoints at
`/api/v1/health/` and `/api/v1/ready/`.

## Checks

```bash
set -a; . ./.env; set +a
.venv/bin/python backend/manage.py check
DJANGO_SETTINGS_MODULE=config.test_settings .venv/bin/python backend/manage.py test accounts core
cd frontend && npm run lint && npm run typecheck && npm run build
```

See `docs/PROJECT_SCOPE.md` and `docs/PLAN.md` for scope, decisions, and phase status.

`.env` is intentionally not loaded by Django. Explicit shell loading keeps runtime
configuration dependency-free and makes deployment environment handling unambiguous.

Development password-reset emails and links are printed in the Django terminal.
Production deployments must configure a real Django email backend and must use a
strong `DJANGO_SECRET_KEY`, `DJANGO_DEBUG=false`, HTTPS redirects, and HSTS.

## Catalog administration

Catalog pages are available at `/products`. Staff manage categories, products,
variants, product images, and inventory in Django Admin.

1. Create a product as a draft.
2. Add at least one active variant and mark exactly one as the default.
3. Add stock through **Inventory adjustments**; variant stock is read-only so
   every manual change has a staff member, reason, delta, and resulting quantity.
4. Add product images and categories, then publish the product.

Prices and inventory are stored as whole IRR amounts and units. Inventory
adjustments cannot be edited or deleted. Product media under `backend/media/` is
local development storage; production deployments must configure persistent
public object/media storage before accepting uploads.

## Cart behavior

Customers must sign in before adding a published product option to their persistent
cart. Current catalog prices and availability are recalculated by the backend on
every cart response. Adding an item does not reserve inventory; checkout will do
that later. Items whose stock or publication state changes are surfaced as
unavailable and cannot be increased until corrected or removed.
