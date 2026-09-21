"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { api, Customer } from "@/lib/api";
import { ProductCard } from "@/components/product-card";
import { Page, Product } from "@/lib/catalog";

export default function Home() {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [products, setProducts] = useState<Product[]>([]);

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
          <p className="eyebrow">یک صفحه تازه باز کنید</p>
          <h1>ایده‌ها از یک <em>خط کوچک</em> شروع می‌شوند.</h1>
          <p className="hero-lede">دفتر، ابزار نوشتن و انتخاب‌های خلاقانه برای میزهایی که روی آن‌ها فکر می‌کنیم، یاد می‌گیریم و می‌سازیم.</p>
          <div className="home-actions"><Link className="button-primary" href="/products">چیدن میز من</Link>{customer ? <Link className="button-quiet" href="/account">انتخاب‌های ذخیره‌شده</Link> : <Link className="button-quiet" href="/login">ورود به نورا</Link>}</div>
          <div className="hero-note"><span aria-hidden="true">✓</span> انتخاب‌شده برای استفاده هر روز</div>
        </div>
        <div className="hero-art stationery-hero-art" aria-label="میز نوشت‌افزار نورا" role="img"><span className="hero-art-label">WRITE<br /><strong>YOUR STORY</strong></span><span className="hero-notebook"><i>نورا</i></span><span className="hero-pencil" /><span className="hero-paperclip" /><span className="hero-art-card">صفحه امروز<br /><small>برای یک فکر تازه</small></span></div>
      </section>
      <section className="value-strip" aria-label="مزایای خرید">
        <div><span>۰۱</span><strong>روان و کاربردی</strong><p>انتخاب‌هایی برای استفاده واقعی</p></div>
        <div><span>۰۲</span><strong>جزئیات روشن</strong><p>اندازه، جنس و ویژگی‌های مشخص</p></div>
        <div><span>۰۳</span><strong>ارسال مطمئن</strong><p>همراه شما تا رسیدن به میز</p></div>
      </section>
      <section className="home-categories" aria-labelledby="home-categories-title"><div className="section-heading"><div><p className="eyebrow">از کجا شروع کنیم؟</p><h2 id="home-categories-title">برای هر گوشه میز، یک انتخاب</h2></div></div><div className="home-category-grid"><Link href="/products?category=writing-tools"><span aria-hidden="true">✎</span><strong>ابزار نوشتن</strong><small>خودکار، مداد و نوشتن روان</small></Link><Link href="/products?category=notebooks-paper"><span aria-hidden="true">▤</span><strong>دفتر و کاغذ</strong><small>برای یادداشت و برنامه‌ریزی</small></Link><Link href="/products?category=art-supplies"><span aria-hidden="true">◒</span><strong>لوازم هنری</strong><small>برای رنگ و تجربه‌های تازه</small></Link><Link href="/products?category=office-supplies"><span aria-hidden="true">⌂</span><strong>لوازم اداری</strong><small>برای یک میز مرتب‌تر</small></Link></div></section>
      {products.length > 0 && <section className="featured-section"><div className="section-heading"><div><p className="eyebrow">پیشنهاد نورا</p><h2>محبوب‌ترین انتخاب‌ها</h2></div><Link href="/products">مشاهده همه <span aria-hidden="true">←</span></Link></div><div className="product-grid">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div></section>}
      <section className="desk-note"><div><p className="eyebrow">یادداشت نورا</p><h2>میز خوب، قرار نیست شلوغ باشد.</h2></div><p>چند ابزار درست که واقعاً دوستشان دارید، برای شروع کافی است. ما انتخاب‌ها را کوتاه، کاربردی و با جزئیات روشن نگه می‌داریم.</p><Link className="button-quiet" href="/about">داستان انتخاب‌های ما</Link></section>
    </main>
  );
}
