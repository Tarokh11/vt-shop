import Image from "next/image";
import Link from "next/link";

import type { Product } from "@/lib/catalog";
import { productPresentation } from "@/lib/product-presentation";

export function ProductCard({ product }: Readonly<{ product: Product }>) {
  const { available, image, specifications, priceLabel } = productPresentation(product);

  return (
    <article className="product-card">
      <Link className="product-image" href={`/products/${product.slug}`}>
        {image ? (
          <Image src={image.image} alt={image.alt_text || product.name} width={720} height={540} sizes="(max-width: 380px) 100vw, (max-width: 900px) 50vw, 33vw" />
        ) : (
          <span aria-hidden="true">بدون تصویر</span>
        )}
      </Link>
      <div className="product-card-body">
        {product.brand && <span className="product-card-brand">{product.brand.name}</span>}
        <p className="product-category">{product.categories.map((item) => item.name).join("، ")}</p>
        <h2><Link href={`/products/${product.slug}`}>{product.name}</Link></h2>
        {specifications.length > 0 && <ul className="product-card-specs" aria-label="مشخصات کوتاه">{specifications.map((specification) => <li key={specification}>{specification}</li>)}</ul>}
        <div className="product-meta">
          <strong>{priceLabel}</strong>
          <span className={available ? "in-stock" : "out-of-stock"}>{available ? "موجود" : "ناموجود"}</span>
        </div>
        <Link className="product-card-link" href={`/products/${product.slug}`}>{product.variants.length > 1 ? "انتخاب مدل و جزئیات" : "دیدن جزئیات"} <span aria-hidden="true">←</span></Link>
      </div>
    </article>
  );
}
