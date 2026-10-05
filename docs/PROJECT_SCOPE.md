# Project Scope

## Goal

A reusable single-store e-commerce starter, ready to branch into individual
store projects after the core purchase flow is complete and verified.

## Architecture

- Django + Django REST Framework backend; REST APIs.
- Next.js + TypeScript frontend.
- PostgreSQL database.
- Modular monolith with separated business domains.
- Django Admin for initial administration.

## Approved core

- Categories, products, images, prices, availability, and variants/SKUs.
- Customer accounts, registration, login/logout, and password recovery.
- Persistent customer cart, server-validated checkout, orders, and order history.
- Zarinpal payment integration for an Iranian merchant, with server-verified payment confirmation.
- Stock tracking and concurrency-safe, two-minute checkout reservations.
- Physical products shipped within Iran only.
- Two configurable fixed shipping rates: Tehran and outside Tehran by post.
- No tax calculation in the initial core.
- Staff catalog, order, and fulfillment management through Django Admin.
- A separate staff-only product management panel alongside Django Admin, sharing
  the same catalog records: product list/search, creation/editing, images,
  variant prices, and audited inventory adjustments. Changes appear in either
  panel after reloading; order management remains in Django Admin.
- Functional storefront, focused automated checks, and reproducible setup docs.

## Baseline design assumptions

These decisions include the user's latest scope revision. Digital products were
explicitly removed from the initial core; this narrows scope without changing architecture.

- Account-required checkout; no guest checkout initially.
- IRR is the canonical backend currency; store whole-rial amounts without floating point.
- Toman display/conversion belongs only in presentation or the provider adapter.
- One inventory location per deployment.
- Every purchasable item is a variant/SKU; simple products have a default variant.
- Physical stock is finite. Digital products and download delivery are out of scope.
- Zarinpal is the first and only initial provider.
- Cart changes do not reserve stock; checkout reserves it temporarily.
- The backend owns prices, totals, stock decisions, and order transitions.
- Order lines preserve purchase-time details independently of catalog edits.

## Payment and stock lifecycle

- Checkout reserves stock for exactly 120 seconds; cart changes do not reserve it.
- A browser callback is a trigger to verify with Zarinpal, never proof of payment.
- Successful verification consumes an active reservation exactly once.
- After expiry, attempt to reacquire all order stock atomically. If unavailable,
  retain the successful payment and flag the order for staff review/refund; do not fulfill.
- Refunds may be performed in the provider dashboard. Only verified provider
  information may update local payment/refund state; an unverified callback or
  staff assertion is not sufficient.
- Keep order, payment, reservation, and shipment states distinct.
- No digital storage, download limits, or access revocation is required.

## Implementation checkpoints

- Before payment integration, verify current Zarinpal request/verify units,
  sandbox availability, credentials, and refund event/query capabilities. Do not
  assume generic signed webhooks or refund notifications exist. If the provider
  cannot expose verified refund information, surface that limitation before
  choosing a synchronization fallback.
- Shipping prices are store configuration in IRR, not invented core defaults.
  For the MVP, customers select `TEHRAN` or `OUTSIDE_TEHRAN` during checkout;
  the selected region and quoted rate are snapped on the order. Postal-code rules,
  address APIs, and automatic city verification are deferred. Keep quotation behind
  a small operation so an address-validation provider can replace this input later.
- Keep shipping behind a small quoting operation; do not build a plugin framework.
- Customer self-service cancellations/returns are deferred. Staff refund and
  inventory restock are separate operations; refund alone does not imply a return.

## Deferred from the reusable core

Multi-store tenancy, marketplaces, multiple inventory locations/currencies,
multiple payment-provider frameworks, promotions, loyalty, subscriptions,
recommendations, advanced search, carrier integrations, broader custom admin dashboards,
microservices, event buses, plugin systems, and generic workflow engines.

Store branding, copy, product data, and specialized business workflows belong in
derived store projects. Add dependencies only for concrete requirements.
