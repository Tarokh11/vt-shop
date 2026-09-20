# Session State

- Current phase: Stationery catalog Phase 3 preparation on the Phase 8 local
  core; real Zarinpal remains deferred.
- Completed: logged-in navigation hides auth prompts and shows the customer name;
  login/register route to products; account profile stores optional phone/address;
  checkout starts payment directly; order history lists paid orders; local dev
  redirects now consistently use `127.0.0.1`; all frontend pages and shared
  components are responsive across mobile, tablet, and desktop widths; the
  storefront now has a cohesive RTL ecommerce visual system and editorial home;
  catalog migration `0003` adds generic hierarchy, brand, attributes, normalized
  options, and collections without changing existing variant identities.
- Decisions: order history is paid-order-only; pending-payment orders are created
  during checkout and immediately handed to the payment start flow; use
  `http://127.0.0.1:3000` locally to keep session cookies across payment redirects.
- Blockers: Zarinpal merchant ID and sandbox/test access. Production media also
  needs persistent storage. Catalog API/filter/storefront work and stationery
  data configuration remain pending after the generic schema phase.
- Relevant files: `backend/catalog/models.py`, `backend/catalog/admin.py`,
  `backend/catalog/migrations/0003_attributedefinition_brand_collection_category_parent_and_more.py`,
  and `docs/STATIONERY_CATALOG_PLAN.md`.
- Checks: catalog/cart/order tests (26), catalog Ruff, migration drift, and
  Django system check pass. Existing local data remains at 1 category, 5
  products, and 5 variants after the migration.
- Next task: migrate legacy variant JSON options into normalized data, then add
  public catalog API filtering/search.
