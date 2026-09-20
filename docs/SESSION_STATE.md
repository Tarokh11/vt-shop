# Session State

- Current phase: Stationery catalog Phase 7 store-specific configuration preparation on the Phase 8 local
  core; real Zarinpal remains deferred.
- Completed: logged-in navigation hides auth prompts and shows the customer name;
  login/register route to products; account profile stores optional phone/address;
  checkout starts payment directly; order history lists paid orders; local dev
  redirects now consistently use `127.0.0.1`; all frontend pages and shared
  components are responsive across mobile, tablet, and desktop widths; the
  storefront now has a cohesive RTL ecommerce visual system and editorial home;
  catalog migration `0003` adds generic hierarchy, brand, attributes, normalized
  options, and collections without changing existing variant identities; migration
  `0004` copies legacy variant JSON options into normalized records; public
  catalog search/filter APIs, filter metadata, URL-backed catalogue controls, and
  normalized option selection are available.
- Decisions: order history is paid-order-only; pending-payment orders are created
  during checkout and immediately handed to the payment start flow; use
  `http://127.0.0.1:3000` locally to keep session cookies across payment redirects.
- Blockers: Zarinpal merchant ID and sandbox/test access. Production media also
  needs persistent storage. Stationery data configuration remains pending; the
  temporary browser smoke script is unavailable, so catalogue interaction smoke
  should be rerun before release.
- Relevant files: `backend/catalog/models.py`, `backend/catalog/admin.py`,
  `backend/catalog/migrations/0003_attributedefinition_brand_collection_category_parent_and_more.py`,
  `backend/catalog/migrations/0004_migrate_legacy_variant_options.py`,
  `backend/catalog/views.py`, `backend/catalog/serializers.py`,
  `frontend/app/products/page.tsx`, `frontend/app/products/[slug]/page.tsx`,
  and `docs/STATIONERY_CATALOG_PLAN.md`.
- Checks: catalog/cart/order tests (30), backend Ruff, migration drift, Django
  system check, frontend lint/typecheck/build pass. Existing local data remains
  at 1 category, 5 products, and 5 variants; 10 legacy JSON option pairs have
  normalized assignments.
- Next task: add stationery categories, brands, attribute configuration,
  collections, and product data in a store-specific commit.
