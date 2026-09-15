# Session State

- Current phase: Phase 3 catalog/inventory completed; Phase 4 cart is ready.
- Completed: catalog models/API/Admin, controlled inventory adjustments, product
  listing/detail UI, category filtering, pagination, images, and variant selection.
- Decisions: prices are integer IRR; only published products with one active
  default variant are public; public APIs expose availability but not stock counts;
  manual stock changes use immutable, actor-attributed adjustments.
- Blockers: none. Production product media still requires persistent storage.
- Relevant files: `backend/catalog/`, `frontend/app/products/`,
  `frontend/components/product-card.tsx`, and `frontend/lib/catalog.ts`.
- Checks: 22 backend tests, Ruff, migration drift, Django checks, PostgreSQL
  migrations/constraints, frontend lint/typecheck/build all pass.
- Next task: implement the persistent account-owned cart in Phase 4.
