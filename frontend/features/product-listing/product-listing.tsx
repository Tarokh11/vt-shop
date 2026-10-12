"use client";

import type { ComponentType } from "react";
import { useProductListing, type ProductListingModel } from "./use-product-listing";

export function ProductListing({ Design }: { Design: ComponentType<{ listing: ProductListingModel }> }) {
  const listing = useProductListing();
  return <Design listing={listing} />;
}
