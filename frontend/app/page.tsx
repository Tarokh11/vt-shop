"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { api, Customer } from "@/lib/api";
import { ProductCard } from "@/components/product-card";
import { Page, Product } from "@/lib/catalog";

export default function Home() {
  const [status, setStatus] = useState("در حال بررسی اتصال…");
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [products, setProducts] = useState<Product[]>([]);

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
    fetch("/api/v1/catalog/products/?page_size=3", { cache: "no-store" })
      .then((response) => response.ok ? response.json() as Promise<Page<Product>> : Promise.reject())
      .then((page) => setProducts(page.results.slice(0, 3)))
      .catch(() => setProducts([]));
  }, []);

  useEffect(() => {
    api<Customer>("/api/v1/accounts/me/")
      .then(setCustomer)
      .catch(() => setCustomer(null));
  }, []);

  return (
    <main className="home-page">
      <section className="hero-section">
        <div className="hero-copy">
          <p className="eyebrow">فصل تازه، انتخاب تازه</p>
          <h1>چیزهایی برای <em>خوب زندگی کردن</em></h1>
          <p className="hero-lede">مجموعه‌ای از محصولات کاربردی و خوش‌ساخت، برای روزهایی که جزئیات اهمیت دارند.</p>
          <div className="home-actions"><Link className="button-primary" href="/products">دیدن مجموعه</Link>{customer ? <Link className="button-quiet" href="/account">حساب من</Link> : <Link className="button-quiet" href="/login">ورود به حساب</Link>}</div>
          <div className="hero-status"><span className="status-dot" aria-hidden="true" />{status}</div>
        </div>
        <div className="hero-art" aria-label="مجموعه جدید نورا" role="img"><span className="hero-art-label">NEW<br /><strong>COLLECTION</strong></span><span className="hero-art-circle" /><span className="hero-art-card">نورا<br /><small>سادگی، با دقت</small></span></div>
      </section>
      <section className="value-strip" aria-label="مزایای خرید">
        <div><span>۰۱</span><strong>انتخاب با دقت</strong><p>محصولاتی که ارزش ماندن دارند</p></div>
        <div><span>۰۲</span><strong>ارسال مطمئن</strong><p>تحویل سریع در سراسر ایران</p></div>
        <div><span>۰۳</span><strong>پشتیبانی واقعی</strong><p>همراه شما از انتخاب تا تحویل</p></div>
      </section>
      {products.length > 0 && <section className="featured-section"><div className="section-heading"><div><p className="eyebrow">پیشنهاد نورا</p><h2>محبوب‌ترین انتخاب‌ها</h2></div><Link href="/products">مشاهده همه <span aria-hidden="true">←</span></Link></div><div className="product-grid">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div></section>}
    </main>
  );
}
