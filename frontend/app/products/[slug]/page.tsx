"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { formatIrr, Product, ProductVariant } from "@/lib/catalog";

export default function ProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [variant, setVariant] = useState<ProductVariant | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/v1/catalog/products/${encodeURIComponent(slug)}/`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error("Product unavailable");
        return response.json() as Promise<Product>;
      })
      .then((value) => {
        setProduct(value);
        setVariant(value.variants.find((item) => item.is_default) ?? value.variants[0] ?? null);
      })
      .catch((reason) => { if (reason.name !== "AbortError") setError("محصول پیدا نشد یا منتشر نشده است."); });
    return () => controller.abort();
  }, [slug]);

  if (error) return <main><p className="error" role="alert">{error}</p><Link href="/products">بازگشت به محصولات</Link></main>;
  if (!product) return <main><p role="status">در حال دریافت محصول…</p></main>;

  const image = product.images[0];
  return (
    <main className="product-page">
      <div className="product-gallery">
        {image ? <Image src={image.image} alt={image.alt_text || product.name} width={900} height={700} priority /> : <div className="image-placeholder">بدون تصویر</div>}
      </div>
      <section className="product-info">
        <Link href="/products">محصولات /</Link>
        <p className="product-category">{product.categories.map((item) => item.name).join("، ")}</p>
        <h1>{product.name}</h1>
        <p>{product.description}</p>
        {product.variants.length > 1 && <div className="variant-list" aria-label="انتخاب مدل">
          {product.variants.map((item) => <button key={item.id} type="button" className={variant?.id === item.id ? "variant active" : "variant"} onClick={() => setVariant(item)}>{item.name || item.sku}</button>)}
        </div>}
        {variant && <div className="selected-variant">
          <strong>{formatIrr(variant.price_irr)}</strong>
          <span className={variant.available ? "in-stock" : "out-of-stock"}>{variant.available ? "آماده سفارش" : "در حال حاضر ناموجود"}</span>
          {Object.keys(variant.options).length > 0 && <dl>{Object.entries(variant.options).map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{value}</dd></div>)}</dl>}
        </div>}
      </section>
    </main>
  );
}
