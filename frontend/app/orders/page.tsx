"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { api, ApiError } from "@/lib/api";
import { formatIrr } from "@/lib/catalog";

type Order = { number: string; total_irr: number; created_at: string; lines: { product_name: string; variant_name: string; quantity: number; line_total_irr: number }[] };

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[] | null>(null);
  useEffect(() => { api<Order[]>("/api/v1/orders/").then(setOrders).catch((error) => { if (error instanceof ApiError && error.status === 403) router.replace("/login"); }); }, [router]);
  if (!orders) return <main><p role="status">در حال دریافت سفارش‌ها…</p></main>;
  return <main className="cart-page"><p className="eyebrow">سفارش‌ها</p><h1>سفارش‌های من</h1>{orders.length === 0 ? <p>هنوز سفارشی ثبت نکرده‌اید. <Link href="/products">مشاهده محصولات</Link></p> : <section className="order-list">{orders.map((order) => <article className="order-card" key={order.number}><strong>سفارش {order.number.slice(0, 8)} - {formatIrr(order.total_irr)}</strong><ul>{order.lines.map((line) => <li key={`${order.number}-${line.product_name}`}>{line.product_name} {line.variant_name} × {line.quantity} - {formatIrr(line.line_total_irr)}</li>)}</ul></article>)}</section>}</main>;
}
