# Session State

- Current phase: Phase 6 Zarinpal scaffold is deferred pending credentials.
- Completed: persistent account carts, server-priced cart API, CSRF-protected item
  mutations, availability validation, product-detail add flow, and cart page.
- Decisions: carts never reserve stock; prices/totals use current integer-IRR
  catalog values; exact stock is private; unavailable items cannot be increased.
- Blockers: Zarinpal merchant ID and sandbox/test access. Production media also
  needs persistent storage.
- Relevant files: `backend/payments/`, `backend/orders/`, and `frontend/app/orders/`.
- Checks: payment scaffold migrations and Ruff pass; existing 30 backend tests and
  frontend lint/typecheck pass. Provider callback tests and sandbox verification remain.
- Next task: resume Phase 6 after Zarinpal credentials are available.
