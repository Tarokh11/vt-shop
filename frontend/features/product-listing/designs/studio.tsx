import { CatalogCategories, CatalogControls, CatalogChips, CatalogResults, CatalogGuide } from "../catalog-controls";
import type { ProductListingModel } from "../use-product-listing";
import styles from "./studio.module.css";

export function StudioDesign({ listing }: { listing: ProductListingModel }) {
  return <main className={styles.page} data-product-design="studio">
    <div className={styles.container}>
      <header className={styles.hero}><div><span>انتخاب‌های نورا</span><h1>میز کار،<br />به سلیقهٔ شما.</h1></div><p>دفترهای همراه، ابزار نوشتن و رنگ‌هایی برای ساختن.<br />انتخاب کنید؛ باقی ایده از شما.</p></header>
      <CatalogCategories listing={listing} />
      <div className={styles.layout}>
        <aside className={styles.filters}><h2>انتخاب دقیق‌تر</h2><CatalogControls listing={listing} /><CatalogGuide /></aside>
        <section className={styles.results} aria-label="نتایج انتخاب شما"><CatalogChips listing={listing} /><CatalogResults listing={listing} /></section>
      </div>
      <footer className={styles.footer}><strong>از قفسه تا میز شما</strong><p>قیمت‌ها به ریال · انتخاب مدل در صفحهٔ محصول · هزینهٔ ارسال در تسویه‌حساب</p></footer>
    </div>
  </main>;
}
