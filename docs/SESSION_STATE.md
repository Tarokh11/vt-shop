# Session State

- Current phase: Phase 5 shipping/checkout/orders completed; Phase 6 Zarinpal is ready.
- Completed: persistent account carts, server-priced cart API, CSRF-protected item
  mutations, availability validation, product-detail add flow, and cart page.
- Decisions: carts never reserve stock; prices/totals use current integer-IRR
  catalog values; exact stock is private; unavailable items cannot be increased.
- Blockers: none. Production product media still requires persistent storage.
- Relevant files: `backend/cart/`, `frontend/app/cart/`, `frontend/lib/cart.ts`,
  and `frontend/app/products/[slug]/page.tsx`.
- Checks: 28 backend tests, Ruff, migration drift, Django checks, PostgreSQL cart
  migration, frontend lint/typecheck/build all pass.
- Next task: implement Zarinpal payment request, callback, and server verification.
