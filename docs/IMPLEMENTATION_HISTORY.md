# Implementation History

### `d5afafe` Expand cream theme and strengthen panel contrast

- Updated product panel and card backgrounds, input surfaces, table separators,
  and border/text contrast for readability.
- Checks: served stylesheet HTTP check and Git whitespace check; no logic or
  schema changes.

### `1fe3410` Add separate staff product management panel

- Added a Persian staff panel alongside Django Admin with shared catalog data,
  sessions and permissions; product search/editing, variant prices/options,
  images, and audited stock adjustments preserve existing row identities.
- Added atomic writes, publication/option validation, CSRF protection, related
  permissions, and stale-edit detection; documented the user-approved scope.
- Checks: catalog/management/cart/order tests (49), Ruff, JS syntax, Django
  system/migration checks, HTTP preview checks, and rolled-back PostgreSQL
  writes through both panels plus inventory adjustment. Browser visual QA is
  pending because no browser is connected; preview runs at port 8010.

### `295e855` Brand the separate product panel for Nora

- Added Nora name, mark, and store copy to the shared panel shell and login
  templates in a separate store-specific commit.
- Checks: HTTP preview login, Django Admin, and storefront catalog return 200;
  backend product-management checks remain unchanged.

This is the concise record of completed implementation commits. Each future
implementation commit must append its commit ID, completed steps, and checks.
Use `SESSION_STATE.md` for current handoff context, not historical detail.

## Current History

### `68fb5d4` Prevent Compose from consuming SSH deployment input

- Closed stdin for migration/static/system checks so Docker cannot consume
  later commands from the SSH heredoc. Added regression tests simulating that
  behavior and missing-environment preflight; explicit subprocess status is checked.
- Checks: both regression tests and targeted Ruff pass. Corrected workflow run
  `37628643534` succeeded; all four deployed services are healthy. Installed
  eleven sample products/photos with an inactive audit actor. Public pages,
  readiness, all photos, Next optimization, and HTTP CSRF checks pass; local
  storefront/API and its original CSRF cookie also pass.

### `038ffb5` Separate local and production deployment configuration

- Restored local DB-only Compose on loopback port 5432; added separate
  `compose.production.yaml` and `.env.production` workflow configuration.
  Generated server-only credentials without altering the local environment.
- Checks: both Compose profiles and workflow Bash syntax pass; local
  storefront, PostgreSQL readiness, catalog (11), API proxy, and default CSRF
  cookie return expected results. First launch exposed SSH stdin consumption
  after migration; follow-up fixes complete the remaining deployment steps.

### `17bee23` Support HTTP deployments and reliable container health checks

- Added configurable cookie security/names and bind ports, compiled frontend
  CSRF-cookie selection, production-compatible readiness checks, Nginx liveness,
  and preserved host ports/forwarded protocol. Ignored supplied credential files.
- Checks: account/core regressions (14), targeted Ruff, frontend lint/typecheck,
  isolated production build with cookie-name assertion, default HTTPS and HTTP
  settings checks, Compose profile validation, and local Nginx syntax check pass.

### `2b65c00` Configure vt-shop workflow for the supplied VPS

- Aligned the workflow with the provided SSH example, environment-scoped
  `PRODUCTION_*` secrets, `/opt/vt-shop`, and Compose project `vtshop`. Added
  an HTTP-by-IP template on free port 8084 and updated the server guide.
- Configured the supplied VPS credentials in GitHub environment `vt-shop`
  after explicit user approval. SSH/Docker/occupied-port checks were read-only.
- Checks: workflow YAML/Bash, Compose profile, missing-env preflight, and staged
  private-key exclusion pass. No VPS application changes or live deployment;
  `/opt/vt-shop/.env` remains the first-launch prerequisite.

### `ca9a434` Add Docker Compose VPS deployment

- Added production containers for Django/Gunicorn and Next.js, a loopback-only
  Nginx proxy, and persistent PostgreSQL, static, and media volumes. Added an
  SSH-based GitHub Actions deployment workflow and VPS setup guide.
- Checks: `docker compose config --quiet` and `git diff --cached --check` pass.
  Application image builds and a live VPS deployment were not run.

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

### `392d9bb` Add stationery sample catalog data

- Added idempotent `seed_stationery` data for hierarchy, brands, filterable
  attributes, collections, five products, nine variants, and audited stock.
- Added command idempotency/public-filter coverage and documented local use.
- Checks: catalog/cart/order tests (31), backend Ruff, Django checks, migration
  drift, frontend lint/typecheck/build, live filter coverage audit, and Chrome
  catalogue smoke checks at 375px, 768px, and 1440px.

### `47d0f5e` Verify stationery catalog interactions

- Verified URL-backed stock filtering and grouped normalized variant selection in
  headless Chrome with the seeded stationery catalog.
- Checks: five stationery cards and 17 filter controls at 375px, 768px, and
  1440px; no horizontal overflow; filter query updates and gel-pen option
  selection complete without errors.
### `077c882` Add provenance-aware product deletion

- Added product-origin tracking and archived-state migration; workbook imports
  mark inventory-origin products.
- Added the staff-panel delete flow: unreferenced manual products are removed;
  inventory-origin products require warehouse confirmation and are archived;
  products with retained history are archived. Unknown legacy origins require
  staff classification.
- Checks: Ruff, Django system check, and migration drift check passed; catalog
  migration `0006` applied. Regression tests were not run.

### `1c032a3` Add product-specific stationery sample photos

- Added eleven representative ImageGen photos as optimized WebP sample assets
  (982 KB total), mapped by product slug. Local product images were installed.
- Seeding installs the photos and repairs missing files without replacing
  accessible uploads. Asset provenance and subjects are documented.
- Checks: focused stationery seed/idempotency regression, targeted Ruff;
  eleven local files and storefront API/media responses verified.

### `3994117` Improve catalog filtering and shopping feedback

- Preserved React page state across URL filters, canceled stale requests, and
  added removable chips, mobile filter controls, loading skeletons, retry/empty
  guidance, accessible result announcements, and purchase/currency notes.
- Cards expose concise specs, price from available variants, responsive image
  sizes, and uncropped product photos. Local records use optimized WebP assets.
- Checks: frontend lint, typecheck, production build; live page/API, eleven
  image URLs, empty search, combined filters, pagination, invalid filter response.
  Visual and browser interaction QA remains pending: browser connection unavailable.

### `056f96f` Redesign product details and purchase interactions

- Redesigned all product detail pages with an uncropped responsive gallery,
  native image dialog, breadcrumbs, purchase card, readable specs, buying
  guidance, related links, and mobile navigation to the purchase controls.
- Added quantity selection/subtotal using existing cart limits, available-model
  defaults and exact option resolution, explicit cart/favorite success/error/login
  feedback, and retry/missing-product states with canceled stale requests.
- Checks: five selection/quantity tests, lint, typecheck, production build;
  eleven live detail APIs/photos, three page routes, folder SKU/attributes,
  and missing-product 404. Browser visual, gallery, and purchase checks remain
  pending because no browser is connected; live carts were not modified.

### `563bee0` Remove sticky positioning from product gallery

- Product photos now remain in normal document flow on desktop and mobile.
- Checks: reviewed gallery CSS and clean diff; browser scrolling QA unavailable.

### `429cc02` Add local development launcher

- Added executable `run-dev.sh` to load the existing local environment and run
  Django debug plus Next.js on configurable ports (8001/3000 by default), with
  matching backend/CSRF/frontend origins and process-group cleanup.
- Checks: Bash syntax and Git whitespace; isolated environment/port forwarding,
  Ctrl+C and child cleanup, server-failure exit propagation, occupied/invalid
  port checks. Live Django system check/startup passed; live Next.js startup
  was blocked by its existing dev server, and the launcher stopped its backend.

### `bf385a8` Align product information with gallery top

- Removed extra top padding from the shared product information column so its
  content starts at the gallery's top edge.
- Checks: live mechanical-pencil product page HTTP 200, updated rule in served
  Next.js CSS, and Git whitespace check. Browser visual QA unavailable.

### `ccabf4d` Add cart product thumbnails and adjust gallery spacing

- Cart rows show linked 72px primary product images, containing the full photo
  and falling back for missing/failed images. Cart serialization adds the
  ordered image URL with prefetching for read and mutation responses.
- Moved the desktop product gallery down 1rem; stacked mobile spacing remains.
- Checks: seven cart tests with ordered-image/null/mutation/prefetch coverage,
  Ruff, frontend lint/typecheck/build, live cart/product routes, Git whitespace.
  Browser visual QA remains unavailable.
