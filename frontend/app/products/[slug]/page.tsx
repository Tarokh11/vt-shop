"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { formatIrr, Product, ProductVariant } from "@/lib/catalog";
import { api, ApiError } from "@/lib/api";

export default function ProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [variant, setVariant] = useState<ProductVariant | null>(null);
  const [error, setError] = useState("");
  const [cartMessage, setCartMessage] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const decodedSlug = decodeURIComponent(slug);
    fetch(`/api/v1/catalog/products/${encodeURIComponent(decodedSlug)}/`, {
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

  async function addToCart() {
    if (!variant) return;
    setAdding(true);
    setCartMessage("");
    try {
      await api("/api/v1/cart/items/", {
        method: "POST", body: JSON.stringify({ variant_id: variant.id, quantity: 1 }),
      });
      setCartMessage("به سبد خرید افزوده شد.");
    } catch (reason) {
      if (reason instanceof ApiError && reason.status === 403) {
        router.push("/login");
      } else {
        setCartMessage(reason instanceof Error ? reason.message : "افزودن به سبد ناموفق بود.");
      }
    } finally {
      setAdding(false);
    }
  }

  if (error) return <main><p className="error" role="alert">{error}</p><Link href="/products">بازگشت به محصولات</Link></main>;
  if (!product) return <main><p role="status">در حال دریافت محصول…</p></main>;

  const image = product.images[0];
  const hasStructuredOptions = product.option_definitions.length > 0 && product.variants.some((item) => item.option_values.length > 0);

  function optionValue(variant: ProductVariant, optionId: number): string | undefined {
    return variant.option_values.find((item) => item.definition.id === optionId)?.value.slug;
  }

  function selectOption(optionId: number, valueSlug: string) {
    if (!product || !variant) return;
    const selected = new Map(variant.option_values.map((item) => [item.definition.id, item.value.slug]));
    selected.set(optionId, valueSlug);
    const matching = product.variants.find((item) => (
      [...selected].every(([id, value]) => optionValue(item, id) === value)
    ));
    if (matching) setVariant(matching);
  }

  return (
    <main className="product-page">
      <div className="product-gallery">
        {image ? <Image src={image.image} alt={image.alt_text || product.name} width={900} height={700} priority /> : <div className="image-placeholder">بدون تصویر</div>}
      </div>
      <section className="product-info">
        <Link href="/products">محصولات /</Link>
        <p className="product-category">{product.categories.map((item) => item.name).join("، ")}</p>
        {product.brand && <p className="product-brand">{product.brand.name}</p>}
        <h1>{product.name}</h1>
        <p>{product.description}</p>
        {hasStructuredOptions && <div className="option-groups" aria-label="انتخاب ویژگی‌ها">{product.option_definitions.map((option) => {
          const values = Array.from(new Map(product.variants.flatMap((item) => item.option_values.filter((value) => value.definition.id === option.definition.id).map((value) => [value.value.slug, value.value]))).values());
          return <fieldset key={option.id}><legend>{option.definition.name}</legend><div>{values.map((value) => {
            const selected = variant ? new Map(variant.option_values.map((item) => [item.definition.id, item.value.slug])) : new Map<number, string>();
            selected.set(option.definition.id, value.slug);
            const matching = product.variants.find((item) => [...selected].every(([id, slug]) => optionValue(item, id) === slug));
            const disabled = !matching || !matching.available;
            return <button key={value.id} type="button" className={variant && optionValue(variant, option.definition.id) === value.slug ? "variant active" : "variant"} disabled={disabled} onClick={() => selectOption(option.definition.id, value.slug)}>{value.label}</button>;
          })}</div></fieldset>;
        })}</div>}
        {!hasStructuredOptions && product.variants.length > 1 && <div className="variant-list" aria-label="انتخاب مدل">
          {product.variants.map((item) => <button key={item.id} type="button" className={variant?.id === item.id ? "variant active" : "variant"} onClick={() => setVariant(item)}>{item.name || item.sku}</button>)}
        </div>}
        {variant && <div className="selected-variant">
          <strong>{formatIrr(variant.price_irr)}</strong>
          <span className={variant.available ? "in-stock" : "out-of-stock"}>{variant.available ? "آماده سفارش" : "در حال حاضر ناموجود"}</span>
          {Object.keys(variant.options).length > 0 && <dl>{Object.entries(variant.options).map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{value}</dd></div>)}</dl>}
          <button type="button" disabled={!variant.available || adding} onClick={addToCart}>{adding ? "در حال افزودن…" : "افزودن به سبد خرید"}</button>
          {cartMessage && <p className={cartMessage === "به سبد خرید افزوده شد." ? "success" : "error"} role="status">{cartMessage}</p>}
        </div>}
      </section>
    </main>
  );
}
