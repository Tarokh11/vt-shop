# Session State

- Current phase: VPS Docker Compose deployment setup for the public `vt-shop` repository.
- Product deletion now tracks inventory provenance; manual products without
  protected history can be removed, while imported/history-bearing products are
  archived to retain stock/order records.
- Completed: normalized catalog, search/filter storefront, stationery sample data,
  and Excel catalog import are implemented. A separate Persian product panel
  supports product/variant/image editing and audited stock, sharing Django
  Admin's database, sessions, and permissions; stale edits are rejected.
  Reusable panel functionality and Nora branding are separate commits.
  Product panel cards and page background now use cream tones with stronger
  borders and text contrast.
- Blockers: backend regression tests need a PostgreSQL role permitted to create
  the test database; real Zarinpal credentials/sandbox and persistent production
  media are still required before production.
- Key references: `docs/PROJECT_SCOPE.md`,
  `docs/STATIONERY_CATALOG_PLAN.md`, `docs/ADMIN_GUIDE.md`,
  `backend/catalog/management_*.py`, and `docs/IMPLEMENTATION_HISTORY.md`.
- Checks: catalog/order tests under SQLite settings, Ruff, migration drift,
  Django system check, frontend lint/typecheck/build, and responsive catalogue
  smoke checks pass. New panel/catalog/cart/order tests (49), Ruff, JS syntax,
  Django/migration checks, and PostgreSQL bidirectional writes/stock smoke with
  rollback pass. PostgreSQL test-database coverage remains outstanding.
- Local preview: panel `/manage/products/` and Django Admin at port 8010;
  storefront at port 3000 with `BACKEND_ORIGIN=http://127.0.0.1:8010`.
  Eleven individual demo product photos are stored as reusable WebP sample
  assets; local records have product-specific images. Browser connection
  unavailable for visual QA.
- Catalog UX: removable filter chips, mobile filter toggle, stable search/filter
  state, canceled stale requests, loading/error/empty guidance, and card specs.
  Current checks: frontend lint/typecheck/build and live catalog/filter/pagination
  and eleven WebP image URLs pass; browser interactions remain unverified.
- Product detail: shared non-sticky gallery with zoom, quantity/model purchase card, explicit
  cart/favorite feedback, mobile purchase navigation, specs and buying guidance.
  Five selection/quantity tests, lint/typecheck/build, eleven detail API/photos,
  and representative routes pass; visual and purchase browser checks pending.
- Deployment: public `Tarokh11/vt-shop` is created and the current branch is
  pushed. Compose defines PostgreSQL, Django/Gunicorn, Next.js, and an internal
  Nginx proxy with persistent static/media volumes. GitHub Actions deploys
  branch `vt-shop` over SSH; VPS configuration and repository secrets remain
  to be set by the owner. Production email and real Zarinpal setup remain
  release prerequisites.
- Deployment checks: account/core regressions (14), targeted Ruff, frontend
  lint/typecheck/build, compiled store CSRF cookie name, Nginx syntax, Compose
  HTTP profile, workflow shell syntax/missing-env preflight, and HTTPS/HTTP
  settings checks pass. Cookie names/security and published port are configurable;
  health probes accept production host/TLS settings. No live deployment yet.
- Next task: configure the VPS `.env`, TLS proxy, and GitHub Actions secrets;
  then verify the first deployment and production payment/email integrations.
