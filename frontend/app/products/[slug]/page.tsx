"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";

import { formatIrr, Product } from "@/lib/catalog";
import { api, ApiError } from "@/lib/api";
import { Favorite } from "@/lib/cart";
import { initialVariant, matchingOptionVariant, optionValue, parseQuantity } from "@/lib/product-selection";

const number = new Intl.NumberFormat("fa-IR");
type Feedback = { type: "success" | "error" | "auth"; message: string };

function ProductGallery({ product }: Readonly<{ product: Product }>) {
  const [imageIndex, setImageIndex] = useState(0);
  const [failedImages, setFailedImages] = useState<number[]>([]);
  const viewer = useRef<HTMLDialogElement>(null);
  const image = product.images[imageIndex];
  const failed = image && failedImages.includes(image.id);
  function move(direction: number) {
    setImageIndex((index) => (index + direction + product.images.length) % product.images.length);
  }
  return (
    <section className="product-gallery detail-gallery" aria-label="تصاویر محصول">
      <div className="product-gallery-main">
        {image && !failed ? <button className="detail-image-open" type="button" aria-label={`بزرگ‌نمایی تصویر ${product.name}`} onClick={() => viewer.current?.showModal()}>
          <Image src={image.image} alt={image.alt_text || product.name} width={1000} height={1000} sizes="(max-width: 900px) 100vw, 55vw" loading="eager" onError={() => setFailedImages((ids) => [...ids, image.id])} />
          <span className="detail-zoom-hint"><span aria-hidden="true">⊕</span> بزرگ‌نمایی تصویر</span>
        </button> : <div className="image-placeholder"><span>{failed ? "تصویر بارگذاری نشد" : "تصویر این محصول هنوز اضافه نشده است"}</span>{failed && <button type="button" onClick={() => setFailedImages((ids) => ids.filter((id) => id !== image.id))}>تلاش مجدد</button>}</div>}
        {product.images.length > 1 && <div className="detail-gallery-navigation"><button type="button" aria-label="تصویر قبلی" onClick={() => move(-1)}>→</button><span>{number.format(imageIndex + 1)} / {number.format(product.images.length)}</span><button type="button" aria-label="تصویر بعدی" onClick={() => move(1)}>←</button></div>}
      </div>
      {product.images.length > 1 && <div className="product-thumbnails" aria-label="انتخاب تصویر">{product.images.map((item, index) => <button key={item.id} type="button" className={index === imageIndex ? "product-thumbnail active" : "product-thumbnail"} onClick={() => setImageIndex(index)} aria-label={`تصویر ${number.format(index + 1)} از ${product.name}`} aria-pressed={index === imageIndex}><Image src={item.image} alt="" width={120} height={120} sizes="80px" /></button>)}</div>}
      <p className="detail-gallery-caption">{product.brand?.name ?? "جزئیات محصول"}<span> {product.categories.map((category) => category.name).join("، ")}</span></p>
      <dialog className="detail-image-dialog" ref={viewer} aria-labelledby="detail-image-title" onClick={(event) => { if (event.target === event.currentTarget) viewer.current?.close(); }}>
        <div><h2 id="detail-image-title" className="sr-only">تصویر {product.name}</h2><button className="detail-dialog-close" type="button" aria-label="بستن تصویر" onClick={() => viewer.current?.close()}>×</button>{image && <Image src={image.image} alt={image.alt_text || product.name} width={1400} height={1400} sizes="90vw" />}<p>{product.name}</p></div>
      </dialog>
    </section>
  );
}

function PurchaseFeedback({ feedback }: Readonly<{ feedback: Feedback }>) {
  return <div className={feedback.type === "success" ? "detail-feedback success" : "detail-feedback error"} role={feedback.type === "success" ? "status" : "alert"}><p>{feedback.message}</p>{feedback.type === "success" && <Link href="/cart">مشاهدهٔ سبد خرید ←</Link>}{feedback.type === "auth" && <Link href="/login">ورود به حساب کاربری ←</Link>}</div>;
}

function ProductDetails({ product }: Readonly<{ product: Product }>) {
  const [variant, setVariant] = useState(() => initialVariant(product.variants));
  const [quantity, setQuantity] = useState("1");
  const [cartFeedback, setCartFeedback] = useState<Feedback | null>(null);
  const [adding, setAdding] = useState(false);
  const [favorite, setFavorite] = useState(false);
  const [favoriteReady, setFavoriteReady] = useState(false);
  const [favoritePending, setFavoritePending] = useState(false);
  const [favoriteFeedback, setFavoriteFeedback] = useState<Feedback | null>(null);
  const purchase = useRef<HTMLElement>(null);
  const quantityValue = parseQuantity(quantity);
  const relatedProducts = product.related_products ?? [];
  const category = product.categories[0];
  const hasStructuredOptions = product.option_definitions.length > 0 && product.variants.some((item) => item.option_values.length > 0);

  useEffect(() => {
    const controller = new AbortController();
    api<Favorite[]>("/api/v1/accounts/favorites/", { signal: controller.signal })
      .then((items) => setFavorite(items.some((item) => item.product.id === product.id)))
      .catch((reason) => {
        if (reason.name !== "AbortError" && !(reason instanceof ApiError && [401, 403].includes(reason.status))) setFavoriteFeedback({ type: "error", message: "وضعیت علاقه‌مندی‌ها دریافت نشد. کمی بعد دوباره تلاش کنید." });
      })
      .finally(() => { if (!controller.signal.aborted) setFavoriteReady(true); });
    return () => controller.abort();
  }, [product.id]);

  async function addToCart(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!variant?.available || quantityValue === null || adding) return;
    setAdding(true);
    setCartFeedback(null);
    try {
      await api("/api/v1/cart/items/", { method: "POST", body: JSON.stringify({ variant_id: variant.id, quantity: quantityValue }) });
      window.dispatchEvent(new Event("cart-updated"));
      setCartFeedback({ type: "success", message: `${number.format(quantityValue)} عدد از ${product.name} به سبد خرید افزوده شد.` });
    } catch (reason) {
      if (reason instanceof ApiError && [401, 403].includes(reason.status)) setCartFeedback({ type: "auth", message: "برای افزودن محصول به سبد خرید، وارد حساب کاربری شوید." });
      else setCartFeedback({ type: "error", message: reason instanceof ApiError && reason.status === 400 ? "افزودن این تعداد ممکن نشد. تعداد یا موجودی مدل انتخاب‌شده را بررسی کنید." : "افزودن به سبد انجام نشد. اتصال اینترنت را بررسی کنید و دوباره تلاش کنید." });
    } finally {
      setAdding(false);
    }
  }

  async function toggleFavorite() {
    if (!favoriteReady || favoritePending) return;
    setFavoritePending(true);
    setFavoriteFeedback(null);
    try {
      if (favorite) await api(`/api/v1/accounts/favorites/${product.id}/`, { method: "DELETE" });
      else await api("/api/v1/accounts/favorites/", { method: "POST", body: JSON.stringify({ product_id: product.id }) });
      setFavorite(!favorite);
      setFavoriteFeedback({ type: "success", message: favorite ? "از علاقه‌مندی‌های شما حذف شد." : "به علاقه‌مندی‌های شما اضافه شد." });
    } catch (reason) {
      setFavoriteFeedback(reason instanceof ApiError && [401, 403].includes(reason.status)
        ? { type: "auth", message: "برای ذخیرهٔ محصول در علاقه‌مندی‌ها، وارد حساب کاربری شوید." }
        : { type: "error", message: "ذخیرهٔ علاقه‌مندی انجام نشد. دوباره تلاش کنید." });
    } finally {
      setFavoritePending(false);
    }
  }

  function changeVariant(next: typeof variant) {
    if (!next || adding) return;
    setVariant(next);
    setQuantity("1");
    setCartFeedback(null);
  }
  function changeQuantity(next: string) {
    setQuantity(next);
    setCartFeedback(null);
  }

  return (
    <main className="product-detail-page">
      <nav className="detail-breadcrumbs" aria-label="مسیر صفحه"><ol><li><Link href="/products">محصولات</Link></li>{category && <li><Link href={`/products?category=${encodeURIComponent(category.slug)}`}>{category.name}</Link></li>}<li><span aria-current="page">{product.name}</span></li></ol></nav>
      <div className="product-page detail-layout">
        <ProductGallery product={product} />
        <section className="product-info detail-info" aria-labelledby="detail-product-title">
          <div className="detail-kicker">{product.brand && <Link href={`/products?brand=${encodeURIComponent(product.brand.slug)}`}>{product.brand.name}</Link>}<span className={variant?.available ? "in-stock" : "out-of-stock"}>{variant?.available ? "موجود و قابل سفارش" : "در حال حاضر ناموجود"}</span></div>
          <div className="product-title-row"><h1 id="detail-product-title">{product.name}</h1><button className={favorite ? "favorite-button active" : "favorite-button"} type="button" disabled={!favoriteReady || favoritePending} onClick={toggleFavorite} aria-pressed={favorite} aria-label={favorite ? "حذف از علاقه‌مندی‌ها" : "افزودن به علاقه‌مندی‌ها"} title={favorite ? "حذف از علاقه‌مندی‌ها" : "ذخیره برای بعد"}>{favoritePending ? "…" : favorite ? "♥" : "♡"}</button></div>
          {favoriteFeedback && <div className={favoriteFeedback.type === "success" ? "detail-feedback success" : "detail-feedback error"} role={favoriteFeedback.type === "success" ? "status" : "alert"}><p>{favoriteFeedback.message}</p>{favoriteFeedback.type === "auth" && <Link href="/login">ورود به حساب کاربری ←</Link>}</div>}
          <p className="detail-intro">{product.description}</p>
          <a className="detail-specs-link" href="#product-specifications">مشخصات و راهنمای خرید ↓</a>
          <section className="detail-purchase" ref={purchase} tabIndex={-1} aria-labelledby="detail-purchase-title">
            <h2 id="detail-purchase-title">انتخاب شما</h2>
            {variant ? <form onSubmit={addToCart}>
              <fieldset className="detail-selection" disabled={adding}>
                <legend className="sr-only">انتخاب مدل و تعداد</legend>
                {hasStructuredOptions && <div className="option-groups">{product.option_definitions.map((option) => {
                  const values = Array.from(new Map(product.variants.flatMap((item) => item.option_values.filter((value) => value.definition.id === option.definition.id).map((value) => [value.value.slug, value.value]))).values());
                  return <fieldset key={option.id}><legend>{option.definition.name}<span>{variant.option_values.find((item) => item.definition.id === option.definition.id)?.value.label}</span></legend><div>{values.map((value) => {
                    const matching = matchingOptionVariant(product.variants, variant, option.definition.id, value.slug);
                    const selected = optionValue(variant, option.definition.id) === value.slug;
                    return <button key={value.id} type="button" className={selected ? "variant active" : "variant"} aria-pressed={selected} disabled={!matching} title={!matching ? "در این ترکیب موجود نیست" : value.label} onClick={() => changeVariant(matching)}>{value.label}{selected && <span aria-hidden="true"> ✓</span>}</button>;
                  })}</div></fieldset>;
                })}<p className="detail-option-hint">گزینه‌های کم‌رنگ در ترکیب انتخاب‌شده موجود نیستند.</p></div>}
                {!hasStructuredOptions && product.variants.length > 1 && <div className="variant-list" aria-label="انتخاب مدل">{product.variants.map((item) => <button key={item.id} type="button" className={variant.id === item.id ? "variant active" : "variant"} aria-pressed={variant.id === item.id} disabled={!item.available} onClick={() => changeVariant(item)}>{item.name || item.sku}{!item.available && " · ناموجود"}</button>)}</div>}
                <div className="detail-selected-model"><span>مدل انتخاب‌شده</span><strong>{variant.name || product.name}</strong><small>کد کالا: <bdi>{variant.sku}</bdi></small></div>
                <div className="detail-price" aria-live="polite"><span>قیمت هر عدد</span><strong>{formatIrr(variant.price_irr)}</strong><small>معادل {number.format(variant.price_irr / 10)} تومان</small></div>
                <div className="detail-quantity-row"><label htmlFor="product-quantity">تعداد</label><div className="quantity-control"><button type="button" aria-label="کاهش تعداد" disabled={!variant.available || quantityValue === null || quantityValue <= 1} onClick={() => changeQuantity(String((quantityValue ?? 1) - 1))}>−</button><input id="product-quantity" type="number" inputMode="numeric" min={1} max={999} step={1} required value={quantity} disabled={!variant.available} aria-invalid={quantityValue === null} aria-describedby={quantityValue === null ? "quantity-error" : undefined} onChange={(event) => changeQuantity(event.target.value)} /><button type="button" aria-label="افزایش تعداد" disabled={!variant.available || quantityValue === null || quantityValue >= 999} onClick={() => changeQuantity(String((quantityValue ?? 1) + 1))}>+</button></div></div>
                {quantityValue === null && <p className="detail-quantity-error" id="quantity-error">تعداد باید یک عدد صحیح بین ۱ تا ۹۹۹ باشد.</p>}
                {quantityValue !== null && quantityValue > 1 && <p className="detail-line-total">جمع کالا، بدون هزینهٔ ارسال<strong>{formatIrr(variant.price_irr * quantityValue)}</strong></p>}
              </fieldset>
              <button className="detail-add-button" type="submit" disabled={!variant.available || adding || quantityValue === null}>{adding ? "در حال افزودن…" : !variant.available ? "این مدل فعلاً ناموجود است" : "افزودن به سبد خرید"}<span aria-hidden="true">{variant.available && !adding ? "←" : ""}</span></button>
              {cartFeedback && <PurchaseFeedback feedback={cartFeedback} />}
              <p className="detail-purchase-note">موجودی و قیمت نهایی هنگام ثبت سفارش بررسی می‌شود.</p>
            </form> : <div className="catalog-notice">این محصول هنوز مدل قابل خریدی ندارد. <Link href="/products">دیدن محصولات دیگر</Link></div>}
          </section>
          <ul className="detail-service-notes"><li><strong>ارسال به سراسر ایران</strong><span>هزینه بر اساس مقصد در تسویه‌حساب مشخص می‌شود.</span></li><li><strong>نگهداری برای خرید بعدی</strong><span>محصول را در علاقه‌مندی‌های حساب خود ذخیره کنید.</span></li></ul>
        </section>
      </div>
      <div id="product-specifications" className="detail-information">
        <section className="detail-description" aria-labelledby="detail-description-title"><p className="eyebrow">نگاهی نزدیک‌تر</p><h2 id="detail-description-title">دربارهٔ این محصول</h2><p>{product.description || "توضیح بیشتری برای این محصول ثبت نشده است."}</p><h3>مشخصات محصول</h3><dl className="detail-specifications">{product.brand && <div><dt>برند</dt><dd>{product.brand.name}</dd></div>}{product.categories.length > 0 && <div><dt>دسته‌بندی</dt><dd>{product.categories.map((item) => item.name).join("، ")}</dd></div>}{product.attributes.map((item) => <div key={`${item.definition.id}-${item.value.id}`}><dt>{item.definition.name}</dt><dd>{item.value.label}</dd></div>)}{variant?.option_values.map((item) => <div key={`variant-${item.definition.id}`}><dt>{item.definition.name} انتخاب‌شده</dt><dd>{item.value.label}</dd></div>)}</dl></section>
        <section className="detail-buying-guide" aria-labelledby="detail-guide-title"><h2 id="detail-guide-title">پیش از خرید بدانید</h2><details open><summary>قیمت‌ها ریال هستند یا تومان؟</summary><p>قیمت اصلی به ریال است؛ معادل تومان کنار قیمت نمایش داده می‌شود. هر ۱۰ ریال برابر با ۱ تومان است.</p></details><details><summary>هزینهٔ ارسال چطور محاسبه می‌شود؟</summary><p>در تسویه‌حساب، تهران یا خارج از تهران را انتخاب می‌کنید. هزینهٔ ارسال پیش از پرداخت به شما نمایش داده می‌شود.</p></details><details><summary>چطور خرید را تکمیل کنم؟</summary><p>مدل و تعداد دلخواه را انتخاب کنید و وارد حساب کاربری شوید. پس از افزودن به سبد، نشانی و مقصد ارسال را در تسویه‌حساب تکمیل کنید.</p><Link href="/cart">رفتن به سبد خرید ←</Link></details></section>
      </div>
      {relatedProducts.length > 0 && <section className="related-products detail-related" aria-labelledby="related-products-title"><div className="section-heading"><div><p className="eyebrow">در همین قفسه</p><h2 id="related-products-title">محصولات مشابه</h2></div>{category && <Link href={`/products?category=${encodeURIComponent(category.slug)}`}>همهٔ محصولات این دسته ←</Link>}</div><div className="related-products-grid">{relatedProducts.map((item) => { const relatedImage = item.images[0]; return <Link className="related-product" href={`/products/${item.slug}`} key={item.id}><span className="related-product-image">{relatedImage ? <Image src={relatedImage.image} alt={relatedImage.alt_text || item.name} width={480} height={360} sizes="(max-width: 680px) 50vw, 25vw" /> : <span aria-hidden="true">بدون تصویر</span>}</span><strong>{item.name}</strong><span className="detail-related-link">دیدن جزئیات ←</span></Link>; })}</div></section>}
      {variant && <div className="detail-mobile-purchase"><div><strong>{formatIrr(variant.price_irr)}</strong><span>{variant.available ? variant.name || "مدل انتخاب‌شده" : "در حال حاضر ناموجود"}</span></div><button type="button" onClick={() => { purchase.current?.focus({ preventScroll: true }); purchase.current?.scrollIntoView({ block: "start" }); }}>{variant.available ? "انتخاب و خرید" : "دیدن موجودی"}</button></div>}
    </main>
  );
}

function ProductLoader({ slug }: Readonly<{ slug: string }>) {
  const [attempt, setAttempt] = useState(0);
  const [resource, setResource] = useState<{ attempt: number; product: Product | null; error: string | null } | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    let decodedSlug: string;
    try { decodedSlug = decodeURIComponent(slug); } catch { decodedSlug = slug; }
    fetch(`/api/v1/catalog/products/${encodeURIComponent(decodedSlug)}/`, { cache: "no-store", signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(response.status === 404 ? "این محصول پیدا نشد یا دیگر منتشر نیست." : "دریافت محصول ممکن نشد. لطفاً دوباره تلاش کنید.");
        return response.json() as Promise<Product>;
      })
      .then((product) => setResource({ attempt, product, error: null }))
      .catch((reason) => { if (reason.name !== "AbortError") setResource({ attempt, product: null, error: reason instanceof TypeError ? "ارتباط با فروشگاه برقرار نشد. اتصال اینترنت را بررسی کنید." : reason.message }); });
    return () => controller.abort();
  }, [slug, attempt]);
  if (resource?.attempt !== attempt) return <main className="product-detail-page"><Link className="detail-back-link" href="/products">← بازگشت به محصولات</Link><p role="status">در حال دریافت جزئیات محصول…</p><div className="detail-loading" aria-hidden="true"><div className="catalog-skeleton"><div /></div><div className="catalog-skeleton"><span /><span /><span /><div /></div></div></main>;
  if (resource.error || !resource.product) return <main className="product-detail-page"><div className="catalog-notice catalog-feedback error" role="alert"><h1>محصول در دسترس نیست</h1><p>{resource.error}</p><div><button type="button" onClick={() => setAttempt((value) => value + 1)}>تلاش مجدد</button><Link href="/products">بازگشت به محصولات ←</Link></div></div></main>;
  return <ProductDetails key={resource.product.id} product={resource.product} />;
}

export default function ProductPage() {
  const { slug } = useParams<{ slug: string }>();
  return <ProductLoader key={slug} slug={slug} />;
}
