"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { api } from "@/lib/api";

export default function CheckoutPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setError("");
    const form = new FormData(event.currentTarget);
    try {
      await api("/api/v1/orders/checkout/", { method: "POST", body: JSON.stringify({ shipping_region: form.get("shipping_region"), recipient_name: form.get("recipient_name"), recipient_phone: form.get("recipient_phone"), address: form.get("address") }) });
      router.replace("/orders");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "ثبت سفارش ناموفق بود."); } finally { setPending(false); }
  }

  return <main className="account-shell"><section className="account-card"><p className="eyebrow">ثبت سفارش</p><h1>ارسال و آدرس</h1><form onSubmit={submit}><label>نام گیرنده<input name="recipient_name" required /></label><label>شماره تماس<input name="recipient_phone" inputMode="tel" required /></label><label>آدرس کامل<textarea name="address" required /></label><label>منطقه ارسال<select name="shipping_region"><option value="TEHRAN">تهران</option><option value="OUTSIDE_TEHRAN">خارج از تهران (پست)</option></select></label>{error && <p className="error">{error}</p>}<button disabled={pending}>{pending ? "در حال ثبت…" : "ثبت سفارش و ادامه پرداخت"}</button></form></section></main>;
}
