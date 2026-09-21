# Session State

- Current phase: stationery Admin operations and Excel catalog import verification.
- Completed: logged-in navigation hides auth prompts and shows the customer name;
  login/register route to products; account profile stores optional phone/address;
  checkout starts payment directly; order history lists paid orders; local dev
  redirects now consistently use `127.0.0.1`; all frontend pages and shared
  components are responsive across mobile, tablet, and desktop widths; the
  storefront now has a cohesive RTL ecommerce visual system and editorial home;
  catalog migration `0003` adds generic hierarchy, brand, attributes, normalized
  options, and collections without changing existing variant identities; migration
  `0004` copied legacy variant JSON options and `0005` removed the legacy field;
  Admin workflows cover the normalized catalog models; public
  catalog search/filter APIs, category-aware filter metadata, URL-backed catalogue
  controls, normalized option selection, and four-item related product previews
  are available; the orders page now presents payment, preparation, shipment,
  and delivery progress; the account dashboard supports saved favorites; the
  header includes a live cart count and category menu; eleven sample stationery products make
  every configured category, brand, collection, and attribute filter visible;
  URL filter interaction and grouped variant selection pass in Chrome; all
  storefront routes now share a responsive stationery-led visual system with
  accessible motion, category discovery, product image galleries and specs,
  guided cart/checkout, and aligned account, auth, orders, and About pages;
  Django Admin now has an accessible branded operations UI, richer catalog,
  customer, order, shipment, and inventory views, and atomic `.xlsx` catalog import.
- Decisions: order history is paid-order-only; pending-payment orders are created
  during checkout and immediately handed to the payment start flow; use
  `http://127.0.0.1:3000` locally to keep session cookies across payment redirects.
- Blockers: backend regression tests need a PostgreSQL role permitted to create
  the test database; Zarinpal merchant ID and sandbox/test access; production
  media also needs persistent storage. Replace sample records/assets with
  production catalog data before release.
- Relevant files: `backend/catalog/models.py`, `backend/catalog/admin.py`,
  `backend/catalog/migrations/0003_attributedefinition_brand_collection_category_parent_and_more.py`,
  `backend/catalog/migrations/0004_migrate_legacy_variant_options.py`,
  `backend/catalog/migrations/0005_remove_productvariant_options.py`,
  `backend/catalog/views.py`, `backend/catalog/serializers.py`,
  `backend/catalog/management/commands/seed_stationery.py`,
  `frontend/app/products/page.tsx`, `frontend/app/products/[slug]/page.tsx`,
  and `docs/STATIONERY_CATALOG_PLAN.md`.
- Checks: backend catalog and order tests under SQLite test settings, backend
  Ruff, migration drift, Django system check, frontend lint/typecheck/build,
  responsive Chrome catalogue smoke checks at 375px, 768px, and 1440px, URL
  filter interaction, and grouped option selection pass.
- Next task: smoke the redesigned storefront and Admin in a browser, then run
  backend regressions with a PostgreSQL role permitted to create tests.
