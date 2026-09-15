# Session State

- Current phase: Phase 8 local release checks completed; real Zarinpal remains deferred.
- Completed: persistent account carts, server-priced cart API, CSRF-protected item
  mutations, availability validation, product-detail add flow, and cart page.
- Decisions: carts never reserve stock; prices/totals use current integer-IRR
  catalog values; exact stock is private; unavailable items cannot be increased.
- Blockers: Zarinpal merchant ID and sandbox/test access. Production media also
  needs persistent storage.
- Relevant files: `backend/payments/`, `backend/orders/`, and `frontend/app/orders/`.
- Checks: 34 backend tests, Ruff, migration drift, Django checks, `seed_demo`,
  frontend lint/typecheck/build all pass.
- Next task: branch for store-specific work, or resume real Zarinpal verification
  when merchant credentials and a domain are available.
