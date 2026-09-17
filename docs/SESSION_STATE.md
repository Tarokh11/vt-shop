# Session State

- Current phase: Storefront account/order polish on the Phase 8 local core; real
  Zarinpal remains deferred.
- Completed: logged-in navigation hides auth prompts and shows the customer name;
  login/register route to products; account profile stores optional phone/address;
  checkout starts payment directly; order history lists paid orders.
- Decisions: order history is paid-order-only; pending-payment orders are created
  during checkout and immediately handed to the payment start flow.
- Blockers: Zarinpal merchant ID and sandbox/test access. Production media also
  needs persistent storage.
- Relevant files: `backend/accounts/`, `backend/orders/`, `frontend/components/site-header.tsx`,
  `frontend/app/account/`, `frontend/app/checkout/`, and `frontend/app/orders/`.
- Checks: 13 targeted backend tests, backend Ruff, migration drift, frontend
  lint/typecheck/build all pass.
- Next task: branch for store-specific work, or resume real Zarinpal verification
  when merchant credentials and a domain are available.
