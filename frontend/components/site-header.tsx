"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { api, Customer } from "@/lib/api";
import { Cart } from "@/lib/cart";
import { Category } from "@/lib/catalog";

const announcements = [
  "ارسال مطمئن نوشت‌افزار به سراسر ایران",
  "برای هر ایده، یک صفحه تازه آماده است",
  "انتخاب‌های کاربردی برای مدرسه، کار و خلاقیت",
];

function customerName(customer: Customer): string {
  const name = `${customer.first_name} ${customer.last_name}`.trim();
  return name || customer.email;
}

function savedCustomer(): Customer | null {
  if (typeof window === "undefined") return null;
  try {
    const customer = window.localStorage.getItem("customer");
    return customer ? JSON.parse(customer) as Customer : null;
  } catch {
    return null;
  }
}

const categoryHints: Record<string, string> = {
  "writing-tools": "خودکار، مداد و ابزار نوشتن",
  "notebooks-paper": "دفتر، کاغذ و صفحه‌های تازه",
  "art-supplies": "رنگ، طراحی و ایده‌های خلاق",
  "office-supplies": "نظم و ابزارهای میز کار",
};

function CategorySymbol({ slug }: { slug: string }) {
  const shape = slug === "writing-tools" ? <><path d="m6 18 2-6L18 2l4 4-10 10-6 2Z" /><path d="m15 5 4 4M8 12l4 4M3 22h18" /></>
    : slug === "notebooks-paper" ? <><rect x="5" y="3" width="15" height="19" rx="2" /><path d="M9 3v19M3 7h4M3 12h4M3 17h4M12 8h5M12 12h5" /></>
    : slug === "art-supplies" ? <><path d="M12 3a9 9 0 1 0 0 18h2a2 2 0 0 0 1-4 2 2 0 0 1 1-4h2a3 3 0 0 0 3-3c0-4-4-7-9-7Z" /><circle cx="7" cy="10" r="1" /><circle cx="11" cy="7" r="1" /><circle cx="16" cy="8" r="1" /><circle cx="6" cy="15" r="1" /></>
    : <><path d="M3 9h18v12H3ZM5 9V4h14v5M8 4V2M16 4V2M3 14h18M10 14v3h4v-3" /></>;
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{shape}</svg>;
}

export function SiteHeader() {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [cartCount, setCartCount] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const menuToggle = useRef<HTMLButtonElement>(null);
  const productsToggle = useRef<HTMLButtonElement>(null);
  const productsNav = useRef<HTMLDivElement>(null);
  const productsHoverTimer = useRef<number | null>(null);
  function clearProductsHover() {
    if (productsHoverTimer.current !== null) window.clearTimeout(productsHoverTimer.current);
    productsHoverTimer.current = null;
  }
  useEffect(() => () => {
    if (productsHoverTimer.current !== null) window.clearTimeout(productsHoverTimer.current);
  }, []);
  const categorySlugs = new Set(categories.map((category) => category.slug));
  const categoryRoots = categories.filter((category) => !category.parent || !categorySlugs.has(category.parent));
  function belongsTo(category: Category, root: Category): boolean {
    const visited = new Set<string>();
    let parent = category.parent;
    while (parent && !visited.has(parent)) {
      if (parent === root.slug) return true;
      visited.add(parent);
      parent = categories.find((item) => item.slug === parent)?.parent ?? null;
    }
    return false;
  }

  useEffect(() => {
    if (!productsOpen) return;
    function closeOutside(event: PointerEvent) {
      if (!productsNav.current?.contains(event.target as Node)) {
        if (productsHoverTimer.current !== null) window.clearTimeout(productsHoverTimer.current);
        setProductsOpen(false);
      }
    }
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, [productsOpen]);
  const [announcementIndex, setAnnouncementIndex] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const interval = window.setInterval(() => {
      setAnnouncementIndex((index) => (index + 1) % announcements.length);
    }, 4500);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    function loadCustomer() {
      api<Customer>("/api/v1/accounts/me/")
        .then((customer) => {
          window.localStorage.setItem("customer", JSON.stringify(customer));
          setCustomer(customer);
        })
        .catch(() => {
          window.localStorage.removeItem("customer");
          setCustomer(null);
        });
    }

    function loadCart() {
      api<Cart>("/api/v1/cart/")
        .then((cart) => setCartCount(cart.items.reduce((total, item) => total + item.quantity, 0)))
        .catch(() => setCartCount(0));
    }

    queueMicrotask(() => setCustomer(savedCustomer()));
    loadCustomer();
    loadCart();
    fetch("/api/v1/catalog/categories/", { cache: "no-store" })
      .then((response) => response.ok ? response.json() as Promise<Category[]> : Promise.reject())
      .then(setCategories)
      .catch(() => setCategories([]));
    window.addEventListener("customer-auth-changed", loadCustomer);
    window.addEventListener("cart-updated", loadCart);
    return () => {
      window.removeEventListener("customer-auth-changed", loadCustomer);
      window.removeEventListener("cart-updated", loadCart);
    };
  }, []);

  return (
    <>
      <div className="announcement-bar"><span aria-hidden="true">✦</span><span className="announcement-message" key={announcementIndex}>{announcements[announcementIndex]}</span><span aria-hidden="true">✦</span></div>
      <header className="site-header">
        <div className="site-header-inner">
          <Link className="brand" href="/">
            <span className="brand-mark" aria-hidden="true">ن</span>
             <span><strong>نورا</strong><small>نوشت‌افزار و ابزار خلاقیت</small></span>
          </Link>
      <button
        ref={menuToggle}
        className="menu-toggle"
        type="button"
        aria-expanded={menuOpen}
        aria-controls="main-navigation"
        onClick={() => { setMenuOpen(!menuOpen); setProductsOpen(false); }}
      >
        <span className="sr-only">نمایش منوی اصلی</span>
        <span aria-hidden="true">☰</span>
      </button>
          <nav id="main-navigation" className={menuOpen ? "site-nav open" : "site-nav"} aria-label="ناوبری اصلی"
            onClick={(event) => {
              if ((event.target as HTMLElement).closest("a")) { clearProductsHover(); setMenuOpen(false); setProductsOpen(false); }
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                clearProductsHover();
                if (productsOpen) { setProductsOpen(false); productsToggle.current?.focus(); }
                else { setMenuOpen(false); menuToggle.current?.focus(); }
              }
            }}
          >
            <Link href="/">خانه</Link>
            <div className="products-nav" ref={productsNav}
              onMouseEnter={() => { if (window.matchMedia("(min-width: 641px) and (hover: hover)").matches) { clearProductsHover(); productsHoverTimer.current = window.setTimeout(() => setProductsOpen(true), 160); } }}
              onMouseLeave={() => { clearProductsHover(); if (window.matchMedia("(min-width: 641px) and (hover: hover)").matches && !productsNav.current?.contains(document.activeElement)) setProductsOpen(false); }}
              onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) { clearProductsHover(); setProductsOpen(false); } }}
            >
              <button ref={productsToggle} className="products-toggle" type="button" aria-expanded={productsOpen} aria-controls="products-navigation" onClick={() => { clearProductsHover(); setProductsOpen((open) => !open); }}>
                محصولات<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="m4 6 4 4 4-4" /></svg>
              </button>
              <div id="products-navigation" className={productsOpen ? "products-menu open" : "products-menu"}>
                <div className="products-menu-catalog">
                  <div className="products-menu-heading"><strong>از کدام قفسه شروع کنیم؟</strong><span>انتخاب ابزار برای هر روز شما</span></div>
                  <div className="products-category-groups">
                    {categoryRoots.map((root) => {
                      const children = categories.filter((category) => belongsTo(category, root));
                      const items = children.length ? children : [root];
                      return <section className="products-category-group" key={root.id}>
                        <Link className="products-group-title" href={`/products?category=${encodeURIComponent(root.slug)}`}>{root.name}<span aria-hidden="true">←</span></Link>
                        <div className="products-category-grid">{items.map((category) => <Link className="products-category-link" href={`/products?category=${encodeURIComponent(category.slug)}`} key={category.id}>
                          <span className={`products-category-icon category-${category.slug}`}><CategorySymbol slug={category.slug} /></span>
                          <span className="products-category-copy"><strong>{category.name}</strong><small>{categoryHints[category.slug] || category.description || "دیدن محصولات این دسته"}</small></span>
                          <span className="products-category-arrow" aria-hidden="true">←</span>
                        </Link>)}</div>
                      </section>;
                    })}
                    {!categories.length && <p className="products-category-empty">دسته‌ها در حال حاضر در دسترس نیستند؛ همهٔ محصولات را ببینید.</p>}
                  </div>
                  <Link className="products-menu-all" href="/products"><span>دیدن همهٔ محصولات</span><span aria-hidden="true">←</span></Link>
                </div>
                <aside className="products-menu-note">
                  <svg className="products-menu-art" viewBox="0 0 180 150" fill="none" aria-hidden="true"><path d="M36 27h88v110H36z" fill="#e7eef3" /><path d="M45 27v110M56 46h50M56 61h50M56 76h31" stroke="#75a9bd" strokeWidth="2" /><path d="M31 38h10M31 54h10M31 70h10M31 86h10M31 102h10M31 118h10" stroke="#fff" strokeWidth="3" /><path d="m130 113 24-80 10 3-24 80-8 10-2-13Z" fill="#f2c14e" /><path d="m132 125 8-9-10-3 2 12Z" fill="#fffdf7" /><path d="m132 125 3-3-4-1 1 4Z" fill="#19324f" /><path d="m154 33 3-10 10 3-3 10" fill="#e8684a" /></svg>
                  <div><strong>جای یک ایدهٔ تازه<br />روی میز شما خالی‌ست.</strong><p>برای نوشتن، ساختن و مرتب کردن؛ ابزار دلخواهتان را پیدا کنید.</p></div>
                  <Link href="/products">کشف نوشت‌افزار<span aria-hidden="true">←</span></Link>
                </aside>
              </div>
            </div>
            <Link href="/orders">پیگیری سفارش</Link>
            <Link href="/about">درباره نورا</Link>
          </nav>
          <div className="header-actions">
            {customer ? <Link className="header-account" href="/account">{customerName(customer)}</Link> : <Link className="header-account" href="/login">ورود</Link>}
            <Link className="header-cart" href="/cart" aria-label={`سبد خرید، ${cartCount} کالا`}><span aria-hidden="true">سبد</span><b>خرید</b><i className="cart-count">{cartCount}</i></Link>
          </div>
        </div>
      </header>
    </>
  );
}
