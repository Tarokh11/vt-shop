import { CatalogCategories, CatalogControls, CatalogChips, CatalogResults, CatalogGuide } from "../catalog-controls";
import type { ProductListingModel } from "../use-product-listing";
import styles from "./bento.module.css";

export function BentoDesign({ listing }: { listing: ProductListingModel }) {
  return <main className={styles.page} data-product-design="bento">
    <div className={styles.container}>
      <header className={styles.hero}>
        <div><span className={styles.brand}>نورا / ابزار خلاقیت</span><h1>فکر تازه.<br />ابزار تازه.</h1><p>از اولین خط تا آخرین ایده؛ چیزهایی که دوست دارید روی میزتان باشند.</p></div>
        <div className={styles.note}><svg viewBox="0 0 100 100" fill="none" aria-hidden="true"><path d="M50 7v86M7 50h86M20 20l60 60M20 80l60-60" stroke="currentColor" strokeWidth="10" /></svg><strong>قفسهٔ خودت را بساز.</strong><span>نوشتن، طراحی، نظم روزانه</span></div>
      </header>
      <CatalogCategories listing={listing} />
      <div className={styles.search}><CatalogControls listing={listing} /></div>
      <CatalogChips listing={listing} />
      <div className={styles.results}><CatalogResults listing={listing} /></div>
      <footer className={styles.footer}><p>قیمت‌ها به ریال است. رنگ و مدل را در صفحهٔ محصول انتخاب کنید.</p><CatalogGuide /></footer>
    </div>
  </main>;
}
