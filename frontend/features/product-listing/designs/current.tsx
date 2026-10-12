import { CatalogCategories, CatalogControls, CatalogChips, CatalogResults, CatalogGuide } from "../catalog-controls";
import type { ProductListingModel } from "../use-product-listing";

export function CurrentDesign({ listing }: { listing: ProductListingModel }) {
  return (
    <main className="catalog-page">
      <div className="catalog-heading">
        <div><p className="eyebrow">قفسه نورا</p><h1>ابزارهای کوچک، برای <em>فکرهای بزرگ</em></h1><p>با جستجو و فیلترها، ابزار مناسب نوشتن، طراحی و کارهای روزمره را پیدا کنید.</p></div>
        <div className="catalog-heading-art" aria-hidden="true"><span>✎</span><i>▤</i><b>✦</b></div>
      </div>
      <ul className="catalog-shopping-notes" aria-label="راهنمای خرید"><li>قیمت‌ها به ریال</li><li>انتخاب رنگ و مدل در صفحهٔ محصول</li><li>محاسبهٔ هزینهٔ ارسال در تسویه‌حساب</li></ul>
      <CatalogCategories listing={listing} />
      <CatalogControls listing={listing} />
      <CatalogChips listing={listing} />
      <CatalogResults listing={listing} />
      <CatalogGuide />
    </main>
  );
}
