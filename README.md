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
