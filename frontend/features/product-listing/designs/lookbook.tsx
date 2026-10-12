import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/catalog";
import { productPresentation } from "@/lib/product-presentation";
import { CatalogCategories, CatalogControls, CatalogChips, CatalogResults, CatalogGuide } from "../catalog-controls";
import type { ProductListingModel } from "../use-product-listing";
import styles from "./lookbook.module.css";

function ProductSpreads({ products }: { products: Product[] }) {
  return <div className={styles.spreads}>{products.map((product) => {
    const { image, available, priceLabel, specifications } = productPresentation(product);
    return <article className={styles.spread} key={product.id} data-product-id={product.id}>
      <Link className={styles.image} href={`/products/${product.slug}`}>{image ? <Image src={image.image} alt={image.alt_text || product.name} width={960} height={720} sizes="(max-width: 800px) 100vw, 50vw" /> : <span>بدون تصویر</span>}</Link>
      <div className={styles.copy}><p className={styles.category}>{product.categories.map((category) => category.name).join("، ")}</p><h2><Link href={`/products/${product.slug}`}>{product.name}</Link></h2><p className={styles.description}>{product.description}</p><ul className={styles.specs}>{specifications.map((spec) => <li key={spec}>{spec}</li>)}</ul><div className={styles.purchase}><strong>{priceLabel}</strong><span>{available ? "موجود" : "ناموجود"}</span></div><Link className={styles.action} href={`/products/${product.slug}`}>{product.variants.length > 1 ? "انتخاب مدل" : "دیدن محصول"}<span aria-hidden="true">←</span></Link></div>
    </article>;
  })}</div>;
}

export function LookbookDesign({ listing }: { listing: ProductListingModel }) {
  return <main className={styles.page} data-product-design="lookbook"><div className={styles.container}>
    <header className={styles.hero}><p>نورا / برای نوشتن و ساختن</p><h1>هر ابزار، شروع یک داستان.</h1><p>از نزدیک ببینید. با حوصله انتخاب کنید.</p></header>
    <div className={styles.finder}><CatalogCategories listing={listing} /><CatalogControls listing={listing} /><CatalogChips listing={listing} /></div>
    <CatalogResults listing={listing} Products={ProductSpreads} /><footer className={styles.footer}><p>قیمت‌ها به ریال · انتخاب رنگ و مدل در صفحهٔ محصول</p><CatalogGuide /></footer>
  </div></main>;
}
