# Nora Admin Guide

Open `http://127.0.0.1:8000/admin/` and sign in with a staff account.

## Separate Product Panel

Open `/manage/products/` on the same Django server (the current local preview is
`http://127.0.0.1:8010/manage/products/`). Sign in using the existing Django staff
username and password. Django Admin remains available at `/admin/`.

- Search by product name, SKU, or brand; filter by category and publication.
- Add/edit names, descriptions, Unicode slugs, categories, brands, and publication.
- Add/edit variants, whole-rial prices, active/default status, and configured option values.
- Upload, replace, reorder, or remove product images (PNG/JPEG/WebP/GIF, up to 5 MB).
- After saving a new SKU, select **Register stock change** to add inventory with a reason.
- Products with order, cart, reservation, or stock history are archived and unpublished so their records remain intact.

Both panels use the same database records. Refresh a page after edits in the
other panel. The separate panel rejects stale submissions rather than replacing
newer product, image, price, or stock changes. No migration or data duplication
is required. Fixed attributes, option definitions, collections, taxonomy,
Excel import, orders, and fulfillment remain managed through Django Admin.

Staff need `view_product` and `add_product`/`change_product`, plus the corresponding
variant/image permissions for related edits. Changing configured option values
requires the relevant `variantoptionvalue` permission. Inventory changes need
`add_inventoryadjustment` and `view_productvariant`. Superusers already have these
permissions. Authentication, CSRF checks, and staff access apply to every write.

### Delete or archive products

Use **Delete** beside a product. Products imported through Excel require
confirmation that they have also been removed from the source inventory; they
are then archived because stock adjustments are immutable. Manually entered
products without order, cart, reservation, or inventory history can be
permanently deleted. Older products with an unknown source ask staff to identify
how they entered the catalog. Find archived products using the status filter;
open one and choose **Restore product** to bring it back to the active list.

## Daily Workflow

- **Products:** edit names, descriptions, categories, images, variants, and publication.
- **Product variants:** review SKU, price, active/default state, and current stock.
- **Inventory adjustments:** add or remove stock with a reason. Existing records cannot be changed or deleted.
- **Orders:** search by number, customer, recipient, or phone; review lines and reservations together.
- **Shipments:** create or update fulfillment status and tracking code for paid orders.
- **Shipping rates:** maintain Tehran and outside-Tehran prices and availability.
- **Users:** find customers and update contact or default shipping information.

## Excel Catalog Import

1. Open **Catalog → Products**.
2. Select **Download Excel template**. Always use a newly downloaded template because its `References` sheet reflects the current database.
3. Complete the `Products` sheet. Each row represents one SKU. Repeat product-level fields for every variant of the same product.
4. Open **Import from Excel**, upload the `.xlsx` file, and submit it.
5. If any row is invalid, no rows are saved. Correct the listed row errors and upload again.
6. Add product images in Product Admin after import.

### Important Columns

| Column | Meaning |
| --- | --- |
| `product_slug` | Stable unique product identifier. Reuse it to update a product. |
| `category_slugs` | Existing category slugs separated by commas. |
| `brand_slug` | Existing brand slug; optional. |
| `collection_slugs` | Existing collection slugs separated by commas; optional. |
| `sku` | Stable unique variant identifier. Reuse it to update a variant. |
| `price_irr` | Whole-rial price, never toman or decimal. |
| `stock_quantity` | Desired final stock. The difference is recorded as an inventory adjustment. |
| `attributes` | Fixed values, such as `ruling:lined|page-count:80`. |
| `options` | Variant values, such as `color:blue|paper-size:a5`. |
| `is_default` | At most one default row per product. If omitted, the first active variant becomes default. |

The importer never creates categories, brands, collections, or attribute values. This prevents misspellings from silently becoming storefront filters. Add taxonomy in Admin first, then download a fresh template.

## Publication Safety

A product can be published only when it has an active default variant. Bulk publishing skips invalid products and reports them. Removing publication hides a product without deleting variants, stock history, carts, or order references.
