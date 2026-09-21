"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import { api, Customer } from "@/lib/api";

type CheckoutOrder = { number: string };

export default function CheckoutPage() {
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    api<Customer>("/api/v1/accounts/me/")
      .then((customer) => { setCustomer(customer); setLoaded(true); })
      .catch(() => router.replace("/login"));
  }, [router]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setError("");
    const form = new FormData(event.currentTarget);
    try {
      const order = await api<CheckoutOrder>("/api/v1/orders/checkout/", { method: "POST", body: JSON.stringify({ shipping_region: form.get("shipping_region"), recipient_name: form.get("recipient_name"), recipient_phone: form.get("recipient_phone"), address: form.get("address") }) });
      window.dispatchEvent(new Event("cart-updated"));
      const payment = await api<{ redirect_url: string }>(`/api/v1/payments/orders/${order.number}/start/`, { method: "POST" });
      window.location.assign(payment.redirect_url);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "ثبت سفارش ناموفق بود."); } finally { setPending(false); }
  }

  if (!loaded) return <main className="checkout-page"><section className="checkout-card"><p role="status">در حال دریافت اطلاعات حساب…</p></section></main>;

  return <main className="checkout-page"><header className="checkout-heading"><p className="eyebrow">مرحله پایانی</p><h1>این بسته را کجا بفرستیم؟</h1><p>اطلاعات گیرنده را بررسی کنید و سپس برای پرداخت امن ادامه دهید.</p></header><div className="checkout-layout"><section className="checkout-card"><div className="checkout-steps" aria-label="مراحل خرید"><span className="complete">۱. سبد خرید</span><span className="active">۲. ارسال</span><span>۳. پرداخت</span></div><form onSubmit={submit}><label>نام گیرنده<input name="recipient_name" defaultValue={`${customer?.first_name ?? ""} ${customer?.last_name ?? ""}`.trim()} required /></label><label>شماره تماس<input name="recipient_phone" inputMode="tel" defaultValue={customer?.phone ?? ""} required /></label><label>آدرس کامل<textarea name="address" defaultValue={customer?.address ?? ""} required /></label><label>منطقه ارسال<select name="shipping_region" defaultValue={customer?.shipping_region || "TEHRAN"}><option value="TEHRAN">تهران</option><option value="OUTSIDE_TEHRAN">خارج از تهران (پست)</option></select></label>{error && <p className="error">{error}</p>}<button disabled={pending}>{pending ? "در حال انتقال به پرداخت…" : "ثبت سفارش و رفتن به پرداخت"}</button></form></section><aside className="checkout-note"><span aria-hidden="true">✦</span><p className="eyebrow">با خیال راحت</p><h2>بسته شما با دقت آماده می‌شود.</h2><p>هزینه ارسال بر اساس منطقه انتخابی محاسبه و مبلغ نهایی پیش از پرداخت نمایش داده می‌شود.</p><ul><li>پرداخت امن</li><li>پیگیری سفارش از حساب</li><li>بررسی دوباره موجودی</li></ul></aside></div></main>;
}
