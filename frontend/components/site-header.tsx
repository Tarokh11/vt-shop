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

export function SiteHeader() {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [cartCount, setCartCount] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const menuToggle = useRef<HTMLButtonElement>(null);
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
              if ((event.target as HTMLElement).closest("a")) { setMenuOpen(false); setProductsOpen(false); }
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape") { setMenuOpen(false); setProductsOpen(false); menuToggle.current?.focus(); }
            }}
          >
            <Link href="/">خانه</Link>
            <div className="products-nav">
              <Link className="products-desktop-link" href="/products">محصولات</Link>
              <button className="products-toggle" type="button" aria-expanded={productsOpen} aria-controls="products-navigation" onClick={() => setProductsOpen((open) => !open)}>محصولات<span aria-hidden="true">{productsOpen ? "−" : "+"}</span></button>
              <div id="products-navigation" className={productsOpen ? "products-menu open" : "products-menu"}>
                <div><strong>دسته‌بندی محصولات</strong><Link href="/products">همه محصولات</Link>{categories.map((category) => <Link href={`/products?category=${encodeURIComponent(category.slug)}`} key={category.id}>{category.parent ? `↳ ${category.name}` : category.name}</Link>)}</div>
                <div className="products-menu-note"><span>برای میز شما</span><strong>ابزارهایی برای نوشتن،<br />ساختن و فکر کردن.</strong><Link href="/products">مشاهده کاتالوگ ←</Link></div>
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
