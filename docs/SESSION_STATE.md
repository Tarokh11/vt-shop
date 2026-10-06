# Session State

- Current phase: separate staff product panel, ready for user testing.
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
- Next task: user-test the panel, then run backend regressions with a
  PostgreSQL role permitted to create tests.
