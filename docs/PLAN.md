# Implementation Plan — Reusable E-commerce Starter

## Architecture and workflow

Django/DRF, Next.js/TypeScript, PostgreSQL, REST, modular monolith, Django Admin.
`PROJECT_SCOPE.md` is authoritative. Implement one logical phase at a time and
record checks and blockers here. Avoid premature abstractions and dependencies.

## Domain dependencies

| Domain | Responsibility | Depends on |
| --- | --- | --- |
| Accounts | Identity and ownership | Foundation |
| Catalog | Categories, products, variants, images, IRR prices | Foundation |
| Inventory | Stock and reservations | Catalog |
| Cart | Persistent customer selections | Accounts, Catalog |
| Shipping | Iran address validation and two fixed-rate quotes | Foundation |
| Orders/checkout | Totals, purchase snapshots, lifecycle | Accounts, Cart, Catalog, Inventory, Shipping |
| Payments | Zarinpal attempts and verified payment/refund information | Orders |
| Fulfillment | Staff shipment tracking | Orders, confirmed payment |

Application operations coordinate domains without circular imports. The backend
owns totals and stock. Shipping starts as a small quoting operation, not a plugin
system. Add domain modules when implementing them, not empty placeholder apps.

## Phase 0 — Scope and purchase rules

**Status: Completed.** Dependencies: none.

### Decisions and work completed
- Updated scope to physical products only; digital storage/downloads and mixed
  carts are excluded. This is a scope reduction, not an architectural conflict.
- Zarinpal; merchant country Iran; backend currency IRR (whole rials).
- Toman conversion is restricted to presentation/provider adaptation.
- Ship within Iran: configurable fixed rates for Tehran city and elsewhere.
- No initial tax calculation; totals are item subtotal plus shipping.
- Account-required checkout, one inventory location, variants/default SKU.
- Reservation duration: **120 seconds**, independent of provider session lifetime.
- Late successful payments attempt atomic stock reacquisition; insufficient stock
  means paid order in staff review/refund, never automatic fulfillment.
- Dashboard refunds are acceptable; local state requires verified provider data.

### Lifecycle specification
1. Validate account, cart, published SKUs, quantities, Iran address, and current
   prices. Calculate integer IRR totals and snapshot item/address/shipping data.
2. Atomically create one pending order and reserve all required stock with an
   absolute expiry timestamp. Repeated checkout keys return the existing outcome.
3. Create a payment attempt; contact Zarinpal outside the database transaction.
   Preserve recoverable attempts when the network outcome is uncertain.
4. On callback/reconciliation, verify server-to-server against the recorded
   authority, amount, and order. Callback status alone cannot mark payment paid.
5. Under locks, consume an unexpired reservation once. If expired, release its
   allocation and reacquire all stock atomically. Never partially fulfill.
6. Verified payment with stock produces a paid/ready-to-ship order. Without stock,
   payment remains successful while order enters review-required state.
7. A scheduled idempotent expiry operation releases overdue reservations. Every
   stock allocation also respects expiry under locks; correctness cannot depend
   on the scheduler running at exactly two minutes.
8. Staff ship eligible orders. Refunds update payment state only from verified
   provider information; restocking requires a separate explicit staff operation.

Keep reservation states (active/consumed/released/expired), payment states
(pending/succeeded/failed/refunded), order states (pending/paid/review-required/
cancelled/refunded), and shipment states separate. Handle repeated/out-of-order
provider observations without downgrading confirmed success. An abandoned
browser session is not proof of payment failure.

### Completion criteria and checkpoints
- Scope, domain dependencies, branching gate, and lifecycle agree: satisfied.
- Store-specific rate values are configuration inputs, not architectural blockers.
- Before Phase 6, confirm current Zarinpal units, sandbox/credentials, verification
  semantics, and refund query/event support. No assumed generic webhook support.
  Surface unsupported refund synchronization before selecting a fallback.
- Self-service cancellations/returns are deferred; staff workflows remain core.

## Phase 1 — Foundation

**Status: Completed.** Dependencies: Phase 0.

### Work
- Initialize backend/frontend with environment configuration and PostgreSQL setup.
- Add custom customer user model before initial migrations; register Django Admin.
- Choose same-origin session authentication with CSRF protection. Frontend proxies
  `/api/` to Django; avoid JWT/CORS dependencies without a requirement.
- REST uses `/api/v1/`, DRF field validation errors and `detail` general errors,
  page-number pagination, and authenticated-by-default access. Explicit public
  endpoints opt out. Customer ownership remains mandatory in later domains.
- Add liveness/readiness endpoints and a frontend connectivity indicator.
- Establish lint/type/build checks and focused backend tests.
- Document local setup, static/product media boundaries, and deployment assumptions.

### Completion criteria
- Clean setup starts PostgreSQL, Django, and Next.js using documented commands.
- Initial migrations run on empty PostgreSQL and Admin login works.
- Frontend can reach backend; secrets are environment-configured.
- Backend tests/checks and frontend lint/type/build pass.

### Progress and verification
- Added Django/DRF configuration, custom `accounts.User` model, initial migration,
  Admin registration, REST health/readiness endpoints, and foundation tests.
- Added Next.js/TypeScript shell, backend API rewrite, RTL base page, environment
  example, lint/typecheck/build configuration, and setup README.
- Backend `check` passed; five foundation tests passed with dedicated SQLite test
  settings. This does not verify PostgreSQL behavior or reservation concurrency.
- Frontend `lint`, `typecheck`, and production `build` passed.
- Shared PostgreSQL 16 is provisioned. Initial migrations applied successfully;
  the database-backed `/api/v1/ready/` endpoint returned 200 using `localhost`.
  Docker is also installed and accessible through the `docker` group.
- PostgreSQL concurrency tests remain a Phase 5 requirement; the foundation suite
  still uses SQLite intentionally for fast isolated checks.

## Phase 2 — Accounts

**Status: Completed.** Dependencies: Phase 1.

Work: registration, login/logout, password reset, profile, session/CSRF frontend
integration, protected routes, ownership/staff permissions.

Completion: complete account lifecycle works; unrelated customers and anonymous
users cannot access private resources; authentication/permission tests pass.

### Progress and verification
- Added email-based customer registration and login using Django sessions. Email
  is normalized and unique; Django's internal username remains an implementation detail.
- Added CSRF bootstrap plus explicit CSRF protection for anonymous mutations,
  authenticated profile read/update, logout, and JSON CSRF failures.
- Added non-enumerating password-reset request/confirmation with Django's signed,
  single-use tokens. Development delivery uses the console email backend.
- Added responsive RTL registration, login, profile, logout, password-request,
  and password-confirmation screens through the same-origin API proxy.
- Eleven account/foundation tests pass, covering CSRF, credentials, privacy,
  profile fields, Admin access, reset enumeration resistance, and token reuse.
- Ruff, Django production security check, frontend lint/typecheck, and production
  build pass. The account email migration is applied to PostgreSQL.
- Production deployment must configure an email backend; this does not block the
  reusable development core or Phase 3.

## Phase 3 — Catalog and inventory

**Status: Completed.** Dependencies: Phase 1; independent of Phase 2.

Work: categories, products, variants/SKUs, images, publication, integer IRR prices,
stock adjustments, Admin management, storefront listing/detail/variant selection,
and transactional inventory operations.

Completion: staff manage catalog; only published items and valid variants are
public; invalid prices/stock are rejected; availability and inventory tests pass.

### Progress and verification
- Added flat categories, products, ordered images, and SKU variants with JSON
  option labels, whole-IRR prices, publication state, and public availability.
- Published products require an active default variant. Database constraints
  enforce at most one default and prevent an inactive default variant.
- Added append-only staff inventory adjustments. Each adjustment locks its SKU,
  rejects zero/negative-result changes, records resulting stock and actor, and
  cannot be changed/deleted through the model or Admin. Direct stock edits are
  read-only in Admin.
- Added public paginated product list/detail and active category APIs. Drafts,
  inactive variants/categories, exact stock quantities, and invalid products are
  not exposed.
- Added responsive RTL catalog/category filtering, pagination, product images,
  IRR price display, detail pages, availability, and variant selection.
- Added Pillow only because validated catalog image uploads require it; no search,
  option-schema engine, or inventory abstraction was introduced.
- Twenty-two backend tests pass. Ruff, migration drift check, Django system check,
  frontend lint/typecheck, and production build pass. Both catalog migrations
  applied to PostgreSQL and their partial/check constraints were verified there.
- Production catalog media needs persistent storage configuration before launch;
  local filesystem media is sufficient for development and does not block Phase 4.

## Phase 4 — Cart

**Status: Completed.** Dependencies: Phases 2 and 3.

Work: persistent account-owned cart, quantity editing/removal, backend pricing,
availability handling, and cart screens. Cart does not reserve inventory.

Completion: persistence and ownership isolation work; invalid quantities and
unavailable items are handled; client prices are ignored; cart tests pass.

### Progress and verification
- Added one persistent cart per customer and one row per product variant.
- Added authenticated cart read, add, quantity update, and removal REST operations.
  All mutations use the existing session/CSRF protection.
- Catalog prices and line/subtotals are computed from current backend variants;
  submitted price fields are ignored. Public cart data omits exact stock quantities.
- Cart changes lock the target variant and reject drafts, inactive variants, and
  quantities above current stock. Cart changes never decrement or reserve stock.
- Added product-detail add-to-cart flow, account-only cart page, quantity controls,
  removal, current availability warnings, and checkout-disabled total summary.
- Twenty-eight backend tests pass, including CSRF, ownership isolation, current
  price calculation, availability, stock non-reservation, updates, and removal.
  Ruff, migration drift, Django checks, frontend lint/typecheck/build pass; the
  cart migration is applied to PostgreSQL.

## Phase 5 — Shipping, checkout, and orders

**Status: Completed.** Dependencies: Phase 4.

### Progress and verification
- Added configurable Tehran/outside-Tehran rates, customer-selected region input,
  immutable order/line snapshots, and pending-payment order history.
- Checkout locks variants, validates current cart prices/stock, reserves stock for
  120 seconds, clears the cart, and records order totals. Expired reservations are
  released idempotently with `release_expired_reservations`.
- Added checkout and order-history UI. Payment remains intentionally deferred to
  Phase 6; orders created here are pending payment.
- Thirty backend tests, Ruff, Django checks, frontend lint/typecheck/build pass;
  the orders migration is applied to PostgreSQL.

Work: customer-selected Tehran/outside-Tehran region, configurable two-rate
shipping operation, server-validated totals without tax calculation, immutable
purchase snapshots, order history/detail, Admin management, atomic 120-second
reservations, retry-safe checkout, and idempotent expiry/release operation.

Completion: both shipping regions calculate correct IRR totals; order snapshots
retain the customer-selected region and rate; catalog edits do
not affect historical orders; concurrent checkouts cannot reserve the same unit;
expired allocations are reusable; retries cannot duplicate orders; ownership,
totals, lifecycle, and PostgreSQL concurrency tests pass.

## Phase 6 — Zarinpal integration

**Status: Deferred pending Zarinpal credentials.** Dependencies: Phase 5 and provider capability checkpoint.

Work: request/redirect/callback/server verification flow, separate payment attempts,
explicit IRR/provider units, idempotent and out-of-order processing, stock
finalization/reacquisition, review-required outcomes, payment status/retry UI,
verified refund synchronization, and missed-confirmation reconciliation.

Completion: supported test payment works end to end; redirects cannot mark orders
paid; repeated confirmations cannot consume stock twice; amount/order mismatches
are rejected; late success with/without stock is tested; refund synchronization
uses demonstrated provider capabilities; integration checks pass.

### Current implementation and blocker
- Added an uncommitted Zarinpal v4 request/verify scaffold, payment attempts,
  callback handling, pending-payment start/retry UI, and payment lifecycle states.
- Live integration is deferred until a Zarinpal merchant ID and sandbox/test access
  are available. Before committing Phase 6, confirm current provider request/verify
  units, test payment flow, callback URL reachability, duplicate verification, and
  refund query/event capabilities. Do not assume refund webhooks exist.
- Do not start Phase 7 fulfillment: physical shipment must depend on verified paid
  orders, not the current unverified scaffold.
- Development-only local simulation is permitted with `ZARINPAL_MOCK=true` and
  `DJANGO_DEBUG=true`. It uses the same attempt/callback/verify lifecycle but is
  not evidence of Zarinpal compatibility and must never be enabled in production.
- Payment mock request/callback/idempotency tests now cover the local lifecycle;
  real provider behavior is still intentionally unverified.

## Phase 7 — Physical fulfillment

**Status: Completed locally; real payment verification pending.** Dependencies: Phase 6.

### Progress and verification
- Added paid-order-only shipment records with ready, shipped, and delivered states,
  optional tracking codes, Django Admin management, and customer order-history display.
- Shipment validation and customer visibility are covered by the backend suite.
- Phase 7 can be exercised with the development-only local payment simulation.
  Before production use, complete the deferred real Zarinpal sandbox checkpoint.

Work: staff shipment status/optional tracking in Admin, customer shipment view,
and agreed refund/restock operations. No digital product support.

Completion: only paid, stock-backed orders can ship; review-required orders are
blocked from shipment; customer visibility is isolated; repeated payment events
cannot duplicate fulfillment; fulfillment tests pass.

## Phase 8 — Reusable-core release and branching gate

**Status: Completed locally; real Zarinpal gate pending.** Dependencies: Phases 1–7.

Work: verify account-to-purchase-to-shipment flow for both shipping regions,
payment failures/retries, two-minute expiry, late success, refunds, and stock
contention. Document setup, migrations, provider configuration, media, scheduler,
recovery, customization points, and reproducible demo data.

Completion: clean deployment works from docs; backend tests, frontend checks,
production build, and purchase flows pass; Admin supports core operations; no
store-specific branding/data is needed; no blocker remains in the purchase flow.

### Progress and verification
- Added repeatable `seed_demo` management command for the four clothing products,
  inventory, and both demo shipping rates.
- Added `docs/RELEASE_CHECKLIST.md` for local demo, verification, production
  security, media, scheduling, and real Zarinpal requirements.
- Local core is usable end to end with mock payments: account, catalog, cart,
  checkout, reservation expiry, simulated payment, paid order, and shipment status.
- Storefront account flow now hides auth prompts after login, labels the account
  link with the customer name, stores optional profile address details, starts
  payment directly after checkout, and lists paid orders in order history.
- Real Zarinpal sandbox verification, provider unit confirmation, public callback
  reachability, and refund capability remain the production payment gate.

### Branching decision

The reusable core is suitable for local store-specific branches and UI/catalog
customization. Do not treat it as production-ready until the real Zarinpal gate,
HTTPS callback, refund capability, and production media/email configuration are
verified. Keep `ZARINPAL_MOCK=false` in production.

## Minimum core before branching

Phase 8 is the branching milestone: accounts, catalog/variants, stock reservations,
cart, Iran shipping, validated checkout, stable orders, Zarinpal, physical shipment
management, Django Admin, minimal storefront, focused tests, and setup docs.

Defer digital delivery, multi-store/marketplace, multiple currencies/warehouses,
multi-provider frameworks, promotions, loyalty, subscriptions, recommendations,
advanced search, carrier integrations, custom admin, microservices, event buses,
and plugin/workflow engines. Derived stores own branding and specialized rules.

## Verification and next steps

- Phase 0 documented and reviewed against the latest user decisions.
- Foundation implementation and PostgreSQL runtime checks completed.
- Environment verification: Python 3.12, Node 24, PostgreSQL 16, and Docker 29
  are available. Do not treat SQLite checks as concurrency verification.
- Phase 2 account implementation and verification completed.
- Phase 3 catalog/inventory implementation and verification completed.
- Phase 4 cart implementation and verification completed. Next: Phase 5 shipping,
  checkout, and orders.
