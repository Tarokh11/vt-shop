"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { api, ApiError } from "@/lib/api";
import { Cart } from "@/lib/cart";
import { formatIrr } from "@/lib/catalog";

function CartProductImage({ image }: Readonly<{ image: string | null }>) {
  const [failedImage, setFailedImage] = useState<string | null>(null);
  return image && failedImage !== image
    ? <Image src={image} alt="" width={72} height={72} sizes="72px" onError={() => setFailedImage(image)} />
    : <span className="cart-image-placeholder" role="img" aria-label="بدون تصویر">▧</span>;
}

export default function CartPage() {
  const router = useRouter();
  const [cart, setCart] = useState<Cart | null>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState<number | null>(null);

  useEffect(() => {
    api<Cart>("/api/v1/cart/")
      .then(setCart)
      .catch((reason) => {
        if (reason instanceof ApiError && reason.status === 403) router.replace("/login");
        else setError("دریافت سبد خرید ناموفق بود.");
      });
  }, [router]);

  async function updateQuantity(itemId: number, quantity: number) {
    setPending(itemId);
    setError("");
    try {
      const updated = await api<Cart>(`/api/v1/cart/items/${itemId}/`, {
        method: "PATCH", body: JSON.stringify({ quantity }),
      });
      setCart(updated);
      window.dispatchEvent(new Event("cart-updated"));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "به‌روزرسانی ناموفق بود.");
    } finally {
      setPending(null);
    }
  }

  async function remove(itemId: number) {
    setPending(itemId);
    setError("");
    try {
      const updated = await api<Cart>(`/api/v1/cart/items/${itemId}/`, { method: "DELETE" });
      setCart(updated);
      window.dispatchEvent(new Event("cart-updated"));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "حذف ناموفق بود.");
    } finally {
      setPending(null);
    }
  }

  if (!cart && !error) return <main><p role="status">در حال دریافت سبد خرید…</p></main>;
  if (!cart) return <main><p className="error" role="alert">{error}</p></main>;

  return (
    <main className="cart-page">
      <header className="commerce-heading"><div><p className="eyebrow">سبد خرید</p><h1>انتخاب‌های روی میز شما</h1><p>تعداد و مدل‌ها را مرور کنید؛ موجودی و قیمت‌ها دوباره در پرداخت بررسی می‌شوند.</p></div><span aria-hidden="true">▤</span></header>
      {error && <p className="error" role="alert">{error}</p>}
      {cart.items.length === 0 ? <section className="empty-cart"><span aria-hidden="true">✎</span><h2>هنوز چیزی روی میز نیست</h2><p>از بین دفترها و ابزارهای نوشتن، اولین انتخاب را پیدا کنید.</p><Link className="button-primary" href="/products">رفتن به قفسه‌ها</Link></section> : <>
        <section className="cart-items">
          {cart.items.map((item) => <article className="cart-item" key={item.id}>
            <div className="cart-item-product">
              <Link className="cart-item-image" href={`/products/${encodeURIComponent(item.product_slug)}`} aria-label={`دیدن ${item.product}`}><CartProductImage image={item.product_image} /></Link>
              <div><Link href={`/products/${encodeURIComponent(item.product_slug)}`}>{item.product}</Link><p>{item.variant || item.sku}</p>{!item.available && <p className="error">این گزینه دیگر موجود نیست.</p>}</div>
            </div>
            <strong>{formatIrr(item.line_total_irr)}</strong>
            <div className="quantity-control">
              <button type="button" aria-label="کاهش تعداد" disabled={pending === item.id || item.quantity === 1} onClick={() => updateQuantity(item.id, item.quantity - 1)}>−</button>
              <span>{item.quantity}</span>
              <button type="button" aria-label="افزایش تعداد" disabled={pending === item.id || !item.available} onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
            </div>
            <button className="remove-item" type="button" disabled={pending === item.id} onClick={() => remove(item.id)}>حذف</button>
          </article>)}
        </section>
        <aside className="cart-total"><span>جمع کالاها</span><strong>{formatIrr(cart.subtotal_irr)}</strong><p>هزینه ارسال در مرحله بعد محاسبه می‌شود.</p><Link className="checkout-link" href="/checkout">ادامه برای پرداخت</Link></aside>
      </>}
    </main>
  );
}
