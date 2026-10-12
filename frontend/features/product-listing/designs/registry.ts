import type { ComponentType } from "react";
import type { ProductListingModel } from "../use-product-listing";
import { CurrentDesign } from "./current";
import { BentoDesign } from "./bento";
import { StudioDesign } from "./studio";
import { LedgerDesign } from "./ledger";
import { LookbookDesign } from "./lookbook";
import { ShelvesDesign } from "./shelves";
import { FormDesign } from "./form";

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
  { id: "ledger", name: "Ledger / جدول مقایسه", description: "فهرست جدولی با تصویر کوچک، مشخصات، قیمت و موجودی در ستون‌های مستقل.", Component: LedgerDesign },
  { id: "lookbook", name: "Lookbook / داستان تصویری", description: "هر محصول یک بخش بزرگ؛ تصویر و توضیحات در ردیف‌های متناوب.", Component: LookbookDesign },
  { id: "shelves", name: "Shelves / قفسه‌های افقی", description: "محصولات هر دسته در یک قفسهٔ افقی با پیمایش مستقل.", Component: ShelvesDesign },
  { id: "form", name: "FORM / گرید مستقل", description: "یک فروشگاه مستقل با هدر اختصاصی، تایپوگرافی استعداد، آبی کبالت و گرید محصول تازه.", Component: FormDesign },
];
