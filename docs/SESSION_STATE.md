# Session State

- Current phase: Phase 7 fulfillment completed locally; real Zarinpal remains deferred.
- Completed: persistent account carts, server-priced cart API, CSRF-protected item
  mutations, availability validation, product-detail add flow, and cart page.
- Decisions: carts never reserve stock; prices/totals use current integer-IRR
  catalog values; exact stock is private; unavailable items cannot be increased.
- Blockers: Zarinpal merchant ID and sandbox/test access. Production media also
  needs persistent storage.
- Relevant files: `backend/payments/`, `backend/orders/`, and `frontend/app/orders/`.
- Checks: 31 backend tests, Ruff, shipment migration, frontend lint/typecheck/build pass.
  Provider callback tests and sandbox verification remain.
- Next task: complete Phase 8 local release checks, then resume Phase 6 with credentials.
