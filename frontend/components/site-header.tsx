"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { api, Customer } from "@/lib/api";

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
  const [menuOpen, setMenuOpen] = useState(false);

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

    queueMicrotask(() => setCustomer(savedCustomer()));
    loadCustomer();
    window.addEventListener("customer-auth-changed", loadCustomer);
    return () => window.removeEventListener("customer-auth-changed", loadCustomer);
  }, []);

  return (
    <>
      <div className="announcement-bar">ارسال سریع و مطمئن در سراسر ایران</div>
      <header className="site-header">
        <div className="site-header-inner">
          <Link className="brand" href="/">
            <span className="brand-mark" aria-hidden="true">ن</span>
            <span><strong>نورا</strong><small>فروشگاه انتخاب‌های خاص</small></span>
          </Link>
      <button
        className="menu-toggle"
        type="button"
        aria-expanded={menuOpen}
        aria-controls="main-navigation"
        onClick={() => setMenuOpen((open) => !open)}
      >
        <span className="sr-only">نمایش منوی اصلی</span>
        <span aria-hidden="true">☰</span>
      </button>
          <nav id="main-navigation" className={menuOpen ? "site-nav open" : "site-nav"} aria-label="ناوبری اصلی">
            <Link href="/">خانه</Link>
            <Link href="/products">محصولات</Link>
            <Link href="/orders">پیگیری سفارش</Link>
            {customer ? <Link href="/account">{customerName(customer)}</Link> : <Link href="/login">ورود / عضویت</Link>}
          </nav>
          <div className="header-actions">
            <Link className="header-cart" href="/cart" aria-label="سبد خرید"><span aria-hidden="true">سبد</span><b>خرید</b></Link>
          </div>
        </div>
      </header>
    </>
  );
}
