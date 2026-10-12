"use client";

import { Suspense } from "react";
import { ProductListing } from "@/features/product-listing/product-listing";
import { CurrentDesign as SelectedDesign } from "@/features/product-listing/designs/current";

export default function ProductsPage() {
  return <Suspense fallback={<main className="catalog-page"><p role="status">در حال دریافت محصولات…</p></main>}><ProductListing Design={SelectedDesign} /></Suspense>;
}
