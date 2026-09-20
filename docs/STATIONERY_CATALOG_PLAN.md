# Stationery Catalog Model Plan

Status: Generic schema, legacy JSON option migration, public catalog API/filtering,
storefront controls, sample stationery configuration, and local interaction
verification are complete. Final production configuration remains pending.

This document is the working reference for the stationery catalog expansion.
Read it before changing catalog models, catalog APIs, catalog Admin, seed data,
or catalog storefront behavior. Keep reusable Core changes separate from
stationery-specific data/configuration whenever possible.

## Current Phase

- Phase 1 contracts/invariants: complete.
- Phase 2 generic schema: complete in catalog migration `0003`.
- Phase 3 JSON option migration: complete in catalog migration `0004`.
- Phase 4 Admin workflow polish: pending; base Admin management is present.
- Phase 5 public API/filtering: complete.
- Phase 6 storefront controls: complete; browser interaction smoke passes for
  URL filters and grouped variant selection.
- Phase 7 sample stationery data: complete.
- Phase 8 current verification: complete; production configuration remains pending.

## Current Baseline

The current catalog already provides:

- Hierarchical `Category` with name, Unicode slug, description, parent, active
  state, and order.
- `Product` with name, Unicode slug, description, category M2M, publication,
  and timestamps.
- `ProductVariant` with stable primary key, globally unique SKU, display name,
  normalized option assignments, integer IRR price, stock, active/default state.
- Ordered product images.
- Append-only, locked `InventoryAdjustment` records.
- Public category, product, detail, and filter-metadata APIs.
- Descendant category, brand, collection, attribute, stock, and basic text
  search filters.
- Product detail and flat variant selection in the storefront; grouped option
  controls remain pending.
- Existing cart, checkout, reservation, payment, and order flows tied directly
  to `ProductVariant` rows.

## Compatibility Rules

- Preserve existing `ProductVariant` primary keys, SKUs, prices, stock fields,
  active/default fields, and row identity.
- Do not replace the current variant or inventory architecture.
- Do not delete or rewrite variants that may be referenced by carts,
  reservations, inventory adjustments, or historical orders.
- Keep backend ownership of prices, totals, availability, and stock decisions.
- Preserve Unicode slugs and existing product detail URL behavior.
- Keep the initial implementation PostgreSQL/Django-native without a search
  service, tree dependency, or generic plugin framework.
- Product descriptive attributes and SKU-producing variant options are separate
  concepts.

## Target Core Model

### Category hierarchy

Add a nullable self-reference from `Category` to `Category` with cycle
validation. Use a normal self-FK; do not add MPTT or another tree dependency
unless real depth/performance requirements justify it.

### Brand

Add a reusable `Brand` model with name, slug, description, active state, and
ordering as needed. Add a nullable `Product.brand` FK. Use one brand per
product unless a concrete requirement proves otherwise.

### Descriptive attributes

Add generic models for:

- `AttributeDefinition`: name, slug, visibility, filterable, searchable, order.
- `AttributeValue`: definition, label, slug, order.
- Category-to-attribute applicability: category, definition, required, order.
- Product-to-attribute-value assignment.

These represent descriptive/filterable properties such as paper size, ruling,
page count, paper weight, binding, material, refillability, and age/use group.

Category applicability is explicit. A selected category exposes mappings from
its configured subtree and inherits mappings from its active ancestors, so
parent categories remain useful without exposing unrelated global attributes.

### Variant-producing options

Keep `ProductVariant` as the purchasable SKU. Add normalized option relations
only where structured selection is required:

- Product option definition/order.
- Variant option value assignments.

Examples include ink color, body color, tip size, and pack quantity. Legacy JSON
options were migrated and removed; normalized assignments are now the only
source of truth.

### Collections

Add `Collection` and an ordered product membership through model. Collections
are merchandising groups, not categories or attributes. Examples include
new arrivals, school essentials, and staff picks.

## Catalog API Behavior

The initial target API should support:

- Category hierarchy and descendant category filtering.
- Brand filtering.
- Collection filtering.
- Attribute-value filtering.
- In-stock filtering.
- Basic text search across product name, description, brand, SKU, and values
  of searchable attributes.
- Filter metadata for rendering storefront controls.
- Normalized option information sufficient to render grouped variant selectors.

Filter semantics:

- OR between multiple values of the same attribute.
- AND between different attributes.
- AND between category, brand, collection, availability, and search criteria.
- Validate accepted query parameters instead of silently ignoring invalid ones.

Use simple Django/PostgreSQL queries and indexes first. Advanced ranking,
autocomplete, typo tolerance, synonyms, and external search are out of scope
for the initial stationery implementation.

## Storefront Behavior

- Search and filter state must be represented in URL query parameters.
- Refresh, browser back/forward, and shared filtered URLs must work.
- Category, brand, collection, attribute, availability, and search controls
  should be driven by API filter metadata.
- Variant options should render as grouped selectors.
- Impossible or unavailable combinations should be disabled.
- Add-to-cart must submit the resolved variant ID.
- Preserve pagination and Unicode slug handling.

## Generic Core vs Store Data

### Generic Core changes

- Category hierarchy.
- Brand model and product relation.
- Attribute definitions, values, applicability, and product assignments.
- Normalized variant options.
- Collections and ordered membership.
- Search/filter query behavior and API metadata.
- Admin validation and management.
- Relevant indexes, constraints, migrations, and tests.
- Optional order-line snapshot of structured purchased options.

### Stationery-specific configuration/data

- Category tree such as writing instruments, notebooks, paper, art supplies,
  and office supplies.
- Brand records and brand assets.
- Attribute definitions and allowed values.
- Category-to-attribute mappings and required flags.
- Decisions about which attributes create SKUs.
- Collections, products, images, prices, SKUs, inventory, and merchandising.
- Persian labels, copy, synonyms, and store-specific search terms.

Do not put stationery names or seed records into reusable Core models or generic
logic. Store-specific seed/configuration belongs in a separate commit/branch.

## Minimal Approved Scope

Implement the smallest useful stationery catalog:

1. Add category parent support.
2. Add Brand and a nullable product brand relation.
3. Add generic attribute definitions/values and product assignments.
4. Add category applicability with bounded parent/descendant inheritance.
5. Normalize variant options while preserving existing variant rows.
6. Add ordered Collections.
7. Add basic search and category/brand/collection/attribute/stock filters.
8. Add URL-backed storefront filters and grouped option selection.
9. Add Admin workflows and focused regression tests.

Avoid typed EAV support for every possible data type, runtime variant
combination generation, dynamic facet-count engines, external search,
multi-brand products, multiple warehouses, and generic workflow/plugin systems.

## Implementation Phases

### Phase 1: Contracts and invariants

- Confirm API query names and filter semantics.
- Confirm product/category assignment convention.
- Confirm which stationery properties are descriptive versus SKU-producing.
- Define option-combination uniqueness and category applicability validation.

Status: complete. Product categories remain M2M for compatibility, with leaf
category assignment recommended for stationery data. Descriptive attributes and
SKU-producing options are mutually exclusive per product. Category inheritance
is not automatic. The initial filter contract remains category, brand,
collection, attribute value, in-stock state, and basic text search.

### Phase 2: Generic schema

- Add additive models and relations.
- Add indexes and database constraints.
- Add category cycle validation.
- Preserve existing product, variant, inventory, cart, reservation, and order
  relationships.

Status: complete. Migration `catalog.0003` adds the models and nullable
relations without modifying existing product or variant identity.

### Phase 3: Data migration

- Convert existing JSON variant options into normalized definitions/values.
- Verify every existing variant keeps its ID, SKU, price, stock, active/default
  state, and downstream references.
- Remove the legacy JSON field only after all consumers use normalized values.

Status: complete. Migration `catalog.0004` copied every existing JSON option
into reusable definitions/values, product options, variant assignments, and
category mappings without changing variant IDs, SKU, or stock. Follow-up
`catalog.0005` removed the legacy JSON field after API, Admin, seed command,
tests, and storefront consumers switched to normalized assignments.

### Phase 4: Admin

- Register brands, definitions, values, collections, and category mappings.
- Add product attribute and option editing.
- Validate applicable values and duplicate variant combinations.
- Keep direct stock edits read-only and use inventory adjustments.

Status: implementation complete. Admin registers brands, attributes, category
applicability, products, normalized product options, variants, collections, and
inventory adjustments. Product and category screens expose the relevant inline
workflows; variant stock is read-only and inventory adjustments are append-only.

### Phase 5: API and search/filtering

- Extend serializers without exposing hidden attributes.
- Add validated search/filter parameters and filter metadata.
- Add descendant category behavior.
- Add focused query, visibility, and pagination tests.

Status: complete. Product responses expose brand, collections, visible product
attributes, product option definitions, and normalized variant option values.
`GET /api/v1/catalog/filters/` exposes only attributes configured for the
selected category (including configured descendants and inherited ancestors);
without a category it exposes no attribute definitions. `GET
/api/v1/catalog/products/` accepts `category`, repeated
`brand`, repeated `collection`, repeated `attribute=definition-slug:value-slug`,
`in_stock=true|false`, `q`, `page`, and `page_size`; unsupported or invalid
filters return validation errors. Attribute search/filter eligibility comes from
definition flags, so stationery configuration must explicitly enable it.

### Phase 6: Storefront

- Add URL-backed search and filters.
- Add responsive mobile filter controls.
- Add grouped option selectors and variant resolution.
- Add frontend tests for query synchronization and option combinations.

Status: implementation complete. The catalogue keeps search/category/brand/
collection/attribute/in-stock state in query parameters, reloads category-aware
filter metadata, clears attribute selections when the category changes, and
uses responsive controls. Product detail renders normalized grouped options
when available, retains the legacy flat-variant fallback, and shows up to four
same-category related products with names and images only. Frontend lint,
typecheck, and build pass; focused browser interaction smoke remains pending.

### Phase 7: Stationery data

- Add stationery categories, brands, attributes, collections, and products in a
  store-specific commit.
- Keep clothing demo data separate or replace it intentionally as store data;
  never silently mix it into reusable Core.

Status: complete for local sample data. `seed_stationery` creates the stationery
root/category tree, three brands, seven visible/filterable/searchable attributes,
two collections, five published products, nine variants, and inventory
adjustments. It is idempotent and does not alter the existing clothing records.

### Phase 8: Verification

- Run migration drift and data-preservation checks.
- Run catalog, cart, checkout, reservation, payment, and order regressions.
- Verify PostgreSQL filtering/search behavior.
- Run frontend lint, typecheck, build, and responsive browser checks.

Status: implementation verification is in progress. Ruff, Django checks,
migration drift, frontend lint/typecheck/build, responsive Chrome checks at
375px, 768px, and 1440px, URL filter interaction, grouped variant selection,
and local sample verification pass. Backend regression tests still require a
PostgreSQL role with permission to create the test database. Persistent
production media, real catalog assets, and real Zarinpal verification remain
release work.

## Completion Criteria

- Existing carts, reservations, inventory adjustments, payments, and orders
  continue to work with unchanged variant identity.
- Admin can manage the new generic catalog structures without raw JSON editing
  for normal stationery workflows.
- Public API exposes only published products, active values, and visible fields.
- Search and filtering are validated, URL-shareable, paginated, and tested.
- Store-specific stationery data is isolated from reusable Core changes.
