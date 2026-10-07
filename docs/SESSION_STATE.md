# Session State

- Current phase: HTTP VPS preview deployed; local/server configurations separated.
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
  `backend/catalog/management_*.py`, `docs/DEPLOYMENT.md`, and
  `docs/IMPLEMENTATION_HISTORY.md`.
- Checks: catalog/order tests under SQLite settings, Ruff, migration drift,
  Django system check, frontend lint/typecheck/build, and responsive catalogue
  smoke checks pass. New panel/catalog/cart/order tests (49), Ruff, JS syntax,
  Django/migration checks, and PostgreSQL bidirectional writes/stock smoke with
  rollback pass. PostgreSQL test-database coverage remains outstanding.
- Local launcher: `./run-dev.sh` loads `.env`, enables Django debug, and starts
  backend/frontend on 8001/3000 (ports configurable); Ctrl+C stops both.
  Bash syntax, isolated startup/cleanup/port checks, and live Django startup pass;
  live Next.js launch blocked by an existing frontend dev server.
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
  Gallery and adjacent information now start at the same top edge; live page
  and compiled CSS checks pass. Browser visual QA remains unavailable.
  Five selection/quantity tests, lint/typecheck/build, eleven detail API/photos,
  and representative routes pass; visual and purchase browser checks pending.
- Deployment: public `Tarokh11/vt-shop` is created and the current branch is
  pushed. The workflow follows the supplied example and uses environment
  `vt-shop`, configured `PRODUCTION_*` secrets, and exact-commit SSH deployment
  to `root@94.184.45.92:22`, directory `/opt/vt-shop`, Compose project `vtshop`.
  User approved storing the supplied SSH key in that GitHub environment.
  HTTP preview is live at `http://94.184.45.92:8084`; ports 8080–8083 were occupied.
  `compose.production.yaml` and server-only `.env.production` configure the
  stack; the server environment was created with generated secrets/mode 600.
  Local `compose.yaml` is restored to DB-only with loopback port 5432, and local
  `.env` remains separate. The private-key
  source file is ignored by Git and Docker. Production email/Zarinpal remain pending.
- Deployment checks: account/core regressions (14), targeted Ruff, frontend
  lint/typecheck/build, compiled store CSRF cookie name, Nginx syntax, Compose
  HTTP profile, workflow shell syntax/missing-env preflight, and HTTPS/HTTP
  settings checks pass. Cookie names/security and published port are configurable;
  health probes accept production host/TLS settings. Local storefront/readiness/
  catalog return 200 with eleven products; both Compose profiles and workflow
  Bash syntax pass. All four server containers are healthy; public home/catalog/
  detail/Admin/panel/readiness, eleven product photos, Next image optimization,
  and HTTP CSRF validation pass. Server sample catalog was seeded using an
  inactive staff audit account with an unusable password; no admin login created.
  Two deployment regressions verify stdin isolation and all eight Docker steps.
- Next task: configure an administrator account and prepare domain/TLS, merchant
  credentials, SMTP, and production backups before customer production launch.
