"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { api, Customer } from "@/lib/api";

export default function Home() {
  const [status, setStatus] = useState("در حال بررسی اتصال…");
  const [customer, setCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    fetch("/api/v1/health/", { signal: controller.signal, cache: "no-store" })
      .then(async (response) => {
        if (!response.ok || (await response.json()).status !== "ok") {
          throw new Error("Backend unavailable");
        }
        setStatus("ارتباط با سرور برقرار است.");
      })
      .catch(() => setStatus("سرور در دسترس نیست. تنظیمات اتصال را بررسی کنید."))
      .finally(() => clearTimeout(timeout));
    return () => { clearTimeout(timeout); controller.abort(); };
  }, []);

  useEffect(() => {
    api<Customer>("/api/v1/accounts/me/")
      .then(setCustomer)
      .catch(() => setCustomer(null));
  }, []);

  return (
    <main>
      <p className="eyebrow" lang="en" dir="ltr">E-commerce Starter</p>
      <h1>زیرساخت فروشگاه</h1>
      <p>راه‌اندازی اولیه فروشگاه تکمیل شده است. امکانات خرید در مراحل بعد اضافه می‌شوند.</p>
      <p role="status" className="status">{status}</p>
      <div className="home-actions"><Link href="/products">مشاهده محصولات</Link>{customer ? <Link href="/account">حساب من</Link> : <Link href="/login">ساخت حساب کاربری و ورود</Link>}</div>
    </main>
  );
}
