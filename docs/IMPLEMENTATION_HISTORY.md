# Implementation History

This is the concise record of completed implementation commits. Each future
implementation commit must append its commit ID, completed steps, and checks.
Use `SESSION_STATE.md` for current handoff context, not historical detail.

## Current History

### `1bcd6a4` Build starter foundation and customer accounts

- Created the Django/DRF and Next.js starter, custom customer user, same-origin
  API setup, health endpoints, and account lifecycle.

### `127150c` Fix environment password placeholder

- Corrected the local environment password placeholder used by development setup.

### `b379114` Add catalog and inventory phase

- Added flat categories, products, images, SKU variants, publication rules,
  inventory adjustments, and public catalog APIs.

### `19fc723` Add persistent customer cart

- Added customer-owned carts, variant line items, quantity updates, and backend
  availability/price validation.

### `048c7d7` Streamline agent instructions

- Simplified repository agent instructions for the established development flow.

### `f9cd403` Add checkout and order reservations

- Added server-side checkout, shipping quotes, orders, order lines, stock
  reservations, and reservation expiry handling.

### `a54e294` Add local Zarinpal payment simulator

- Added local mock payment start/callback behavior for end-to-end development.

### `f0b6cbf` Expose order line history

- Added order-line serialization and customer order-history display support.

### `635d9dd` Add physical shipment tracking

- Added staff shipment status and tracking-code management for paid orders.

### `26e297a` Document local fulfillment completion

- Documented the completed local fulfillment workflow and validation steps.

### `18feef4` Fix local account registration proxy

- Fixed the local frontend/backend registration proxy behavior.

### `9c8110c` Document demo shipping rates

- Documented the Tehran and outside-Tehran demo shipping rates.

### `590e89c` Complete local release phase

- Completed local release documentation and verification for the core purchase
  flow.

### `3a7002b` Polish customer account and paid orders

- Added profile address fields, direct checkout payment start, and paid-order
  history improvements.

### `9771f48` Reload storefront after customer auth

- Reloaded storefront state after login or registration so authenticated changes
  appear immediately.

### `044139f` Show customer name after authentication

- Replaced generic account navigation text with the authenticated customer name.

### `c8160a5` Fix header hydration after auth

- Stabilized auth-aware header hydration using local customer state.

### `9dd781b` Use consistent local storefront origin

- Standardized local redirects and API-related storefront origin on `127.0.0.1`.

### `e3bcf3b` Make storefront responsive across viewports

- Added responsive behavior for shared navigation, storefront pages, account
  pages, forms, cart/order cards, and product layouts.

### `fae048a` Polish responsive storefront design

- Introduced the cohesive RTL storefront visual system, branded header,
  editorial home, improved cards/forms, and responsive ecommerce surfaces.

### `d6033b1` Reduce storefront heading sizes

- Reduced global, hero, account, and product-detail heading scales.

### `6738a0d` Fix Unicode product detail slugs

- Fixed double URL encoding so Persian/Unicode product slugs resolve on detail
  pages.
- Checks: frontend lint, typecheck, build, and Persian-slug API verification.

### `6e85d72` Document stationery catalog model plan

- Added the approved stationery catalog architecture plan.
- Required future catalog/product/inventory/search/filter work to read it.

### `cd0b0bf` Add generic stationery catalog schema

- Added category hierarchy, brands, generic attribute definitions/values,
  category applicability, normalized variant options, and ordered collections.
- Added Django Admin management and invariant tests.
- Preserved existing product/variant IDs, SKU, price, stock, cart, reservation,
  payment, and order relationships with additive migration `catalog.0003`.
- Checks: catalog/cart/order tests (26), backend Ruff, Django checks, migration
  drift check, and PostgreSQL migration verification.

### `68555f0` Migrate legacy variant options

- Added idempotent migration `catalog.0004` to copy legacy variant JSON options
  into normalized definitions, values, category mappings, product options, and
  variant assignments.
- Preserved every variant ID, SKU, stock quantity, and legacy JSON payload.
- Checks: catalog/cart/order tests (27), backend Ruff, Django checks, migration
  drift check, no pending migrations, and PostgreSQL record verification.

### `440d566` Add catalog search and filters

- Added public descendant-category, brand, collection, attribute, stock, and
  basic text search filters with validated query parameters and pagination size.
- Added public filter metadata and additive normalized product/option output.
- Checks: catalog/cart/order tests (30), backend Ruff, Django checks, migration
  drift check, and no pending migrations.

### `56c1cef` Add storefront catalog filters

- Added URL-backed search, category, brand, collection, attribute, and in-stock
  controls driven by catalog filter metadata.
- Added responsive filter styles and grouped normalized option selectors with a
  fallback to flat legacy variants.
- Checks: frontend lint, typecheck, production build, and catalog/cart/order
  backend regressions (30).
