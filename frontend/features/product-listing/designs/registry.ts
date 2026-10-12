import type { ComponentType } from "react";
import type { ProductListingModel } from "../use-product-listing";
import { CurrentDesign } from "./current";
import { BentoDesign } from "./bento";
import { StudioDesign } from "./studio";

type ProductDesign = {
  id: string;
  name: string;
  description: string;
  Component: ComponentType<{ listing: ProductListingModel }>;
};

// Add one independent design here; the switcher automatically reads this list.
export const productDesigns: readonly ProductDesign[] = [
  { id: "current", name: "طرح فعلی نورا", description: "صفحهٔ فعلی فروشگاه، برای مقایسه با طرح‌های جدید.", Component: CurrentDesign },
  { id: "bento", name: "Bento / ایدهٔ تازه", description: "چیدمان نامتقارن، رنگ سبز و ابزارهای جستجو در بالای صفحه.", Component: BentoDesign },
  { id: "studio", name: "Studio / میز کار", description: "قفسهٔ مینیمال بنفش، فیلتر کناری و کارت‌های یکدست.", Component: StudioDesign },
];
