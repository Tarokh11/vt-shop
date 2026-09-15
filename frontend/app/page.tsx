"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function Home() {
  const [status, setStatus] = useState("در حال بررسی اتصال…");

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

  return (
    <main>
      <p className="eyebrow" lang="en" dir="ltr">E-commerce Starter</p>
      <h1>زیرساخت فروشگاه</h1>
      <p>راه‌اندازی اولیه فروشگاه تکمیل شده است. امکانات خرید در مراحل بعد اضافه می‌شوند.</p>
      <p role="status" className="status">{status}</p>
      <div className="home-actions"><Link href="/register">ساخت حساب مشتری</Link><Link href="/login">ورود</Link></div>
    </main>
  );
}
