import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/catalog";
import { productPresentation } from "@/lib/product-presentation";
import { CatalogCategories, CatalogControls, CatalogChips, CatalogResults, CatalogGuide } from "../catalog-controls";
import type { ProductListingModel } from "../use-product-listing";
import styles from "./ledger.module.css";

function ProductTable({ products }: { products: Product[] }) {
  return <div className={styles.tableScroll} role="region" aria-label="جدول مقایسهٔ محصولات" tabIndex={0}>
    <table className={styles.table}><caption className="sr-only">مقایسهٔ مشخصات، قیمت و موجودی محصولات</caption><thead><tr><th scope="col">محصول</th><th scope="col">مشخصات کوتاه</th><th scope="col">قیمت</th><th scope="col">موجودی</th><th scope="col"><span className="sr-only">مشاهدهٔ محصول</span></th></tr></thead>
      <tbody>{products.map((product) => {
        const { image, priceLabel, available, specifications } = productPresentation(product);
        return <tr key={product.id} data-product-id={product.id}>
          <th scope="row"><Link className={styles.identity} href={`/products/${product.slug}`}>{image ? <Image src={image.image} alt={image.alt_text || product.name} width={120} height={120} sizes="72px" /> : <span className={styles.missing}>بدون تصویر</span>}<span><strong>{product.name}</strong><small>{product.brand?.name || product.categories[0]?.name}</small></span></Link></th>
          <td><ul>{specifications.map((spec) => <li key={spec}>{spec}</li>)}</ul></td>
          <td className={styles.price}>{priceLabel}</td><td><span className={available ? styles.available : styles.unavailable}>{available ? "موجود" : "ناموجود"}</span></td>
          <td><Link className={styles.action} href={`/products/${product.slug}`}>جزئیات<span aria-hidden="true">←</span></Link></td>
        </tr>;
      })}</tbody>
    </table>
  </div>;
}

export function LedgerDesign({ listing }: { listing: ProductListingModel }) {
  return <main className={styles.page} data-product-design="ledger"><div className={styles.container}>
    <header className={styles.heading}><div><p>کاتالوگ نورا</p><h1>انتخاب با یک نگاه.</h1></div><p>محصول‌ها را کنار هم مقایسه کنید.<br />مشخصات، قیمت و موجودی، در یک فهرست.</p></header>
    <CatalogControls listing={listing} /><CatalogCategories listing={listing} /><CatalogChips listing={listing} />
    <div className={styles.results}><CatalogResults listing={listing} Products={ProductTable} /></div>
    <p className={styles.hint}>قیمت‌ها به ریال است. در صفحهٔ محصول رنگ و مدل را انتخاب کنید. در موبایل، جدول را افقی پیمایش کنید.</p><CatalogGuide />
  </div></main>;
}
