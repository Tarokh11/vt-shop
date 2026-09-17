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
  const [customer, setCustomer] = useState<Customer | null>(savedCustomer);

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

    loadCustomer();
    window.addEventListener("customer-auth-changed", loadCustomer);
    return () => window.removeEventListener("customer-auth-changed", loadCustomer);
  }, []);

  return (
    <header className="site-header">
      <Link className="brand" href="/">فروشگاه</Link>
      <nav aria-label="ناوبری اصلی">
        <Link href="/products">محصولات</Link>
        <Link href="/cart">سبد خرید</Link>
        <Link href="/orders">سفارش‌ها</Link>
        {customer ? (
          <Link href="/account">{customerName(customer)}</Link>
        ) : (
          <Link href="/login">ساخت حساب کاربری و ورود</Link>
        )}
      </nav>
    </header>
  );
}
