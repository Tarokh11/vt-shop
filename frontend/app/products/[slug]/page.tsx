"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { formatIrr, Product, ProductVariant } from "@/lib/catalog";
import { api, ApiError } from "@/lib/api";
import { Favorite } from "@/lib/cart";

export default function ProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [variant, setVariant] = useState<ProductVariant | null>(null);
  const [error, setError] = useState("");
  const [cartMessage, setCartMessage] = useState("");
  const [adding, setAdding] = useState(false);
  const [favorite, setFavorite] = useState(false);
  const [favoritePending, setFavoritePending] = useState(false);

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
        api<Favorite[]>("/api/v1/accounts/favorites/")
          .then((items) => setFavorite(items.some((item) => item.product.id === value.id)))
          .catch(() => setFavorite(false));
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
      window.dispatchEvent(new Event("cart-updated"));
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

  async function toggleFavorite() {
    if (!product) return;
    setFavoritePending(true);
    try {
      if (favorite) {
        await api(`/api/v1/accounts/favorites/${product.id}/`, { method: "DELETE" });
        setFavorite(false);
      } else {
        await api("/api/v1/accounts/favorites/", {
          method: "POST", body: JSON.stringify({ product_id: product.id }),
        });
        setFavorite(true);
      }
    } catch (reason) {
      if (reason instanceof ApiError && reason.status === 403) router.push("/login");
    } finally {
      setFavoritePending(false);
    }
  }

  if (error) return <main><p className="error" role="alert">{error}</p><Link href="/products">بازگشت به محصولات</Link></main>;
  if (!product) return <main><p role="status">در حال دریافت محصول…</p></main>;

  const image = product.images[0];
  const relatedProducts = product.related_products ?? [];
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
    <main>
      <div className="product-page">
        <div className="product-gallery">
        {image ? <Image src={image.image} alt={image.alt_text || product.name} width={900} height={700} priority /> : <div className="image-placeholder">بدون تصویر</div>}
        </div>
        <section className="product-info">
        <Link href="/products">محصولات /</Link>
        <p className="product-category">{product.categories.map((item) => item.name).join("، ")}</p>
        {product.brand && <p className="product-brand">{product.brand.name}</p>}
        <div className="product-title-row"><h1>{product.name}</h1><button className={favorite ? "favorite-button active" : "favorite-button"} type="button" disabled={favoritePending} onClick={toggleFavorite} aria-label={favorite ? "حذف از علاقه‌مندی‌ها" : "افزودن به علاقه‌مندی‌ها"}>{favorite ? "♥" : "♡"}</button></div>
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
          {variant.option_values.length > 0 && <dl>{variant.option_values.map((item) => <div key={`${item.definition.id}-${item.value.slug}`}><dt>{item.definition.name}</dt><dd>{item.value.label}</dd></div>)}</dl>}
          <button type="button" disabled={!variant.available || adding} onClick={addToCart}>{adding ? "در حال افزودن…" : "افزودن به سبد خرید"}</button>
          {cartMessage && <p className={cartMessage === "به سبد خرید افزوده شد." ? "success" : "error"} role="status">{cartMessage}</p>}
        </div>}
        </section>
      </div>
      {relatedProducts.length > 0 && <section className="related-products" aria-labelledby="related-products-title">
        <div className="section-heading"><div><p className="eyebrow">برای کنار این انتخاب</p><h2 id="related-products-title">محصولات مشابه</h2></div></div>
        <div className="related-products-grid">{relatedProducts.map((item) => {
          const relatedImage = item.images[0];
          return <Link className="related-product" href={`/products/${item.slug}`} key={item.id}>
            <span className="related-product-image">{relatedImage ? <Image src={relatedImage.image} alt={relatedImage.alt_text || item.name} width={480} height={360} /> : <span aria-hidden="true">بدون تصویر</span>}</span>
            <strong>{item.name}</strong>
          </Link>;
        })}</div>
      </section>}
    </main>
  );
}
