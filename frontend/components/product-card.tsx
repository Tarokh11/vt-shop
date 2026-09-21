import Image from "next/image";
import Link from "next/link";

import { formatIrr, Product } from "@/lib/catalog";

export function ProductCard({ product }: Readonly<{ product: Product }>) {
  const prices = product.variants.map((variant) => variant.price_irr);
  const available = product.variants.some((variant) => variant.available);
  const image = product.images[0];

  return (
    <article className="product-card">
      <Link className="product-image" href={`/products/${product.slug}`}>
        {image ? (
          <Image src={image.image} alt={image.alt_text || product.name} width={720} height={540} />
        ) : (
          <span aria-hidden="true">بدون تصویر</span>
        )}
      </Link>
      <div className="product-card-body">
        {product.brand && <span className="product-card-brand">{product.brand.name}</span>}
        <p className="product-category">{product.categories.map((item) => item.name).join("، ")}</p>
        <h2><Link href={`/products/${product.slug}`}>{product.name}</Link></h2>
        <div className="product-meta">
          <strong>{prices.length ? `از ${formatIrr(Math.min(...prices))}` : "بدون قیمت"}</strong>
          <span className={available ? "in-stock" : "out-of-stock"}>{available ? "موجود" : "ناموجود"}</span>
        </div>
        <Link className="product-card-link" href={`/products/${product.slug}`}>دیدن جزئیات <span aria-hidden="true">←</span></Link>
      </div>
    </article>
  );
}
