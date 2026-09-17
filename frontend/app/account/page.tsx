"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import { AccountShell } from "@/components/account-shell";
import { api, Customer } from "@/lib/api";

export default function AccountPage() {
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    api<Customer>("/api/v1/accounts/me/")
      .then(setCustomer)
      .catch(() => router.replace("/login"));
  }, [router]);

  async function update(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const updated = await api<Customer>("/api/v1/accounts/me/", {
        method: "PATCH",
        body: JSON.stringify({
          first_name: form.get("first_name"),
          last_name: form.get("last_name"),
          phone: form.get("phone"),
          address: form.get("address"),
          shipping_region: form.get("shipping_region"),
        }),
      });
      setCustomer(updated);
      setMessage("اطلاعات حساب ذخیره شد.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "ذخیره انجام نشد.");
    }
  }

  async function signOut() {
    await api("/api/v1/accounts/logout/", { method: "POST" });
    window.dispatchEvent(new Event("customer-auth-changed"));
    router.replace("/login");
  }

  if (!customer) return <AccountShell eyebrow="حساب مشتری" title="در حال بارگذاری…"><p role="status">لطفاً صبر کنید.</p></AccountShell>;

  return (
    <AccountShell eyebrow={customer.email} title="حساب من">
      <form onSubmit={update}>
        <div className="field-row">
          <label>نام<input name="first_name" defaultValue={customer.first_name} autoComplete="given-name" /></label>
          <label>نام خانوادگی<input name="last_name" defaultValue={customer.last_name} autoComplete="family-name" /></label>
        </div>
        <label>ایمیل<input value={customer.email} disabled /></label>
        <label>شماره تماس<input name="phone" defaultValue={customer.phone} inputMode="tel" autoComplete="tel" /></label>
        <label>آدرس پیش‌فرض<textarea name="address" defaultValue={customer.address} autoComplete="street-address" /></label>
        <label>منطقه ارسال پیش‌فرض<select name="shipping_region" defaultValue={customer.shipping_region}><option value="">انتخاب نشده</option><option value="TEHRAN">تهران</option><option value="OUTSIDE_TEHRAN">خارج از تهران (پست)</option></select></label>
        {message && <p className="success" role="status">{message}</p>}
        {error && <p className="error" role="alert">{error}</p>}
        <button>ذخیره اطلاعات</button>
      </form>
      <button className="secondary" type="button" onClick={signOut}>خروج از حساب</button>
    </AccountShell>
  );
}
