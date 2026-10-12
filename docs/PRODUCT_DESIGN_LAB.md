# Product listing Design Lab

Preview: `http://127.0.0.1:3000/design-lab/products?design=current`.
Work branch: `feature/product-design-lab`. Start the local application with
`./run-dev.sh`; its local environment selects backend port 8010.

The lab compares complete listing pages using the live catalog. It shares the
site header/footer and product detail routes. Each design owns its listing
hero, layout, search/filter placement, cards' presentation and visual palette.
The store's `/products` route continues to select the original design.
Do not merge/deploy experimental changes before choosing a design.

## Designs and direct links

| ID | Full-page direction | URL |
| --- | --- | --- |
| `current` | Existing Nora listing; baseline for comparison | `/design-lab/products?design=current` |
| `bento` | Green canvas, asymmetric product grid, top search/filter board | `/design-lab/products?design=bento` |
| `studio` | Violet studio, category tabs, sidebar search/filters | `/design-lab/products?design=studio` |

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
| `frontend/features/product-listing/designs/` | Independent page renderers and scoped CSS modules |
| `frontend/features/product-listing/designs/registry.ts` | One list of design IDs, labels, descriptions and components |
| `frontend/app/design-lab/products/` | Lab dropdown and query-parameter selection; no indexing |
| `frontend/app/products/page.tsx` | Store page adapter; its import selects the production renderer |

The original listing logic was moved into the shared hook, and the original
markup into `CurrentDesign`. No new catalog endpoint, data copy or backend
change is needed. The original product cards still calculate availability and
prices from existing variants; all links open the existing product detail page.

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
prop when a design needs independent card markup. Keep loading, errors, empty
results and pagination accessible. Preserve the `resultsHeading` ref when
rendering your own results heading so pagination can move keyboard focus.

Scope styles with CSS modules. A selector such as
`.page :global(.product-card)` affects cards inside that design only. Avoid
adding variant rules to `app/globals.css` or using cross-design selectors.

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
