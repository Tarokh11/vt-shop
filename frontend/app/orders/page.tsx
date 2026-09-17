"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { api, ApiError } from "@/lib/api";
import { formatIrr } from "@/lib/catalog";

type Order = { number: string; status: string; total_irr: number; created_at: string; shipment: { status: string; tracking_code: string } | null; lines: { product_name: string; variant_name: string; quantity: number; line_total_irr: number }[] };

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { api<Order[]>("/api/v1/orders/").then(setOrders).catch((error) => { if (error instanceof ApiError && error.status === 403) router.replace("/login"); else setError(error instanceof Error ? error.message : "دریافت سفارش‌ها ناموفق بود."); }); }, [router]);
  if (!orders) return <main><p role="status">در حال دریافت سفارش‌ها…</p></main>;
  return <main className="cart-page"><p className="eyebrow">سفارش‌ها</p><h1>سفارش‌های پرداخت‌شده</h1>{error && <p className="error">{error}</p>}{orders.length === 0 ? <p>هنوز سفارش پرداخت‌شده‌ای ندارید. <Link href="/products">مشاهده محصولات</Link></p> : <section className="order-list">{orders.map((order) => <article className="order-card" key={order.number}><strong>سفارش {order.number.slice(0, 8)} - {formatIrr(order.total_irr)}</strong><p>پرداخت شده</p>{order.shipment && <p>ارسال: {order.shipment.status === "SHIPPED" ? "ارسال شد" : order.shipment.status === "DELIVERED" ? "تحویل شد" : "آماده ارسال"}{order.shipment.tracking_code && ` - کد رهگیری: ${order.shipment.tracking_code}`}</p>}<ul>{order.lines.map((line) => <li key={`${order.number}-${line.product_name}`}>{line.product_name} {line.variant_name} × {line.quantity} - {formatIrr(line.line_total_irr)}</li>)}</ul></article>)}</section>}</main>;
}
