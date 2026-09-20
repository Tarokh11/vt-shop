"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { api, ApiError } from "@/lib/api";
import { Cart } from "@/lib/cart";
import { formatIrr } from "@/lib/catalog";

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
      <p className="eyebrow">سبد خرید</p>
      <h1>انتخاب‌های شما</h1>
      {error && <p className="error" role="alert">{error}</p>}
      {cart.items.length === 0 ? <section className="empty-cart"><p>سبد خرید شما خالی است.</p><Link href="/products">مشاهده محصولات</Link></section> : <>
        <section className="cart-items">
          {cart.items.map((item) => <article className="cart-item" key={item.id}>
            <div><Link href={`/products/${encodeURIComponent(item.product_slug)}`}>{item.product}</Link><p>{item.variant || item.sku}</p>{!item.available && <p className="error">این گزینه دیگر موجود نیست.</p>}</div>
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
