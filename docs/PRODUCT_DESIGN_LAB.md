# Product listing Design Lab

Preview: `http://127.0.0.1:3000/design-lab/products?design=current`.
Work branch: `feature/product-design-lab`. Start the local application with
`./run-dev.sh`; its local environment selects backend port 8010.

The lab compares complete listing pages using the live catalog. Most variants
share the site header/footer; FORM previews its own standalone visual identity.
All variants use the existing product detail routes. Each design owns its listing
hero, layout, search/filter placement, cards' presentation and visual palette.
The store's `/products` route continues to select the original design.
Do not merge/deploy experimental changes before choosing a design.

## Designs and direct links

| ID | Full-page direction | URL |
| --- | --- | --- |
| `current` | Existing Nora listing; baseline for comparison | `/design-lab/products?design=current` |
| `bento` | Green canvas, asymmetric product grid, top search/filter board | `/design-lab/products?design=bento` |
| `studio` | Violet studio, category tabs, sidebar search/filters | `/design-lab/products?design=studio` |
| `ledger` | Comparison table: compact thumbnails, specifications, price and stock columns | `/design-lab/products?design=ledger` |
| `lookbook` | Large alternating image/text product spreads | `/design-lab/products?design=lookbook` |
| `shelves` | Category-grouped horizontal rails with independent scroll controls | `/design-lab/products?design=shelves` |
| `form` | Standalone cobalt/white grid, Estedad typography, custom chrome and filter UI | `/design-lab/products?design=form` |

The dropdown and description come from the registry. Changing designs preserves
applied search, repeated attribute filters, category, brand, collection, stock
and pagination parameters. Browser Back/Forward and reload restore the selected
design. Missing/unknown IDs normalize to `current` while retaining filters.
The URL can be copied directly for comparison. `design` is excluded from catalog
API requests; switching only the design does not refetch the catalog.
Clearing filters retains the chosen design and the lab route.

## Structure

| File / directory | Responsibility |
| --- | --- |
| `frontend/features/product-listing/use-product-listing.ts` | Existing API requests, abort handling, metadata, URL filters, retry and pagination |
| `frontend/features/product-listing/catalog-controls.tsx` | Reusable search, filter fields, category navigation, chips, results/feedback and buying guide |
| `frontend/lib/product-presentation.ts` | Shared variant price, availability and short-spec rules |
| `frontend/features/product-listing/designs/` | Independent page renderers and scoped CSS modules |
| `frontend/features/product-listing/designs/registry.ts` | One list of design IDs, labels, descriptions and components |
| `frontend/app/design-lab/products/` | Lab dropdown and query-parameter selection; no indexing |
| `frontend/app/products/page.tsx` | Store page adapter; its import selects the production renderer |

The original listing logic was moved into the shared hook, and the original
markup into `CurrentDesign`. No new catalog endpoint, data copy or backend
change is needed. All renderers use the shared product-presentation rules for
variant pricing, availability and short specs; all links open the existing detail page.

## Add an independent full-page design

1. Create `designs/gallery.tsx` and, if needed, `gallery.module.css`.
2. Export a page renderer accepting `{ listing: ProductListingModel }`.
3. Register its import and one entry in `productDesigns`, after `current`:

```tsx
import { GalleryDesign } from "./gallery";

// Entry inside productDesigns:
{
  id: "gallery",
  name: "Gallery / گالری",
  description: "توضیح کوتاهِ چیدمان کامل صفحه",
  Component: GalleryDesign,
},
```

The dropdown automatically includes it. No switcher condition or route change
is required. Keep IDs unique and stable for existing shared links.

A renderer can compose the existing controls with any layout:

```tsx
import { CatalogControls, CatalogChips, CatalogResults } from "../catalog-controls";
import type { ProductListingModel } from "../use-product-listing";
import styles from "./gallery.module.css";

export function GalleryDesign({ listing }: { listing: ProductListingModel }) {
  return <main className={styles.page}>
    <header><h1>قفسهٔ گالری</h1></header>
    <CatalogControls listing={listing} />
    <CatalogChips listing={listing} />
    <CatalogResults listing={listing} />
  </main>;
}
```

Use the typed `listing` model directly when a design needs different filter or
result markup. Do not duplicate API fetching or URL mutation logic.
`CatalogResults` also accepts an optional `Card` component with a `product`
prop when a design needs independent card markup. For a completely different result
structure, pass `Products`, a component accepting `{ products: Product[] }`,
into `CatalogResults`. It replaces the whole results collection while preserving
loading/error/empty feedback and pagination. Ledger uses a real table, Lookbook
uses large alternating spreads, and Shelves uses grouped horizontal rails.
Shelf groups and counts cover the current API page, not the entire catalog. Keep loading, errors, empty
results and pagination accessible. Preserve the `resultsHeading` ref when
rendering your own results heading so pagination can move keyboard focus.

Scope styles with CSS modules. A selector such as
`.page :global(.product-card)` affects cards inside that design only. Avoid
adding variant rules to `app/globals.css` or using cross-design selectors.

## Standalone FORM experiment

FORM treats the listing as a separate storefront concept. It renders its own
header/footer, search/filter controls and product grid, using the shared model
and result feedback/pagination. Its scoped CSS conditionally hides the original
site chrome with `body:has(.page)` only while the FORM renderer is mounted.
Switching designs or navigating to another store route restores original chrome.
It does not modify the root layout, global stylesheet or production selection.

Its font is self-hosted with `next/font/local`. The original Estedad font,
SIL OFL license and pinned source/hash live in `designs/form-assets/`.
Light/dark colors follow system preference; reduced motion disables hover motion.
The FORM name is an experimental identity, not a change to the production brand.
Approve real branding and metadata separately if this concept is selected.

## Promote the chosen full page

After approval, change the selected renderer import in
`frontend/app/products/page.tsx`, for example:

```tsx
import { BentoDesign as SelectedDesign } from "@/features/product-listing/designs/bento";
```

The existing `<ProductListing Design={SelectedDesign} />` already supplies its
controller. The lab remains available for later experiments. The store route
never reads `?design=` to choose its renderer; it uses the explicit import.
Verify the chosen layout and functionality, then merge/deploy as a separate
reviewed change. No selection in the lab writes a production setting.

## Verification

For changes to a renderer or shared catalog behavior, run frontend lint,
TypeScript and a production build. Keep the active development `.next` output
separate from build output, or stop/restart dev deliberately.

Check all designs with real data: direct link/reload, dropdown and browser
history, preserved filters, search/empty results, repeated attribute values,
brand/collection/stock, pagination/focus, error/retry, mobile controls and
horizontal overflow. Confirm `design` never reaches the catalog API. Check
`/products` independently after modifying shared logic.
