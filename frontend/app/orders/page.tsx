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
  useEffect(() => { api<Order[]>("/api/v1/orders/").then(setOrders).catch((error) => { if (error instanceof ApiError && error.status === 403) router.replace("/login"); }); }, [router]);
  if (!orders) return <main><p role="status">در حال دریافت سفارش‌ها…</p></main>;
  async function pay(order: Order) { try { const data = await api<{ redirect_url: string }>(`/api/v1/payments/orders/${order.number}/start/`, { method: "POST" }); window.location.assign(data.redirect_url); } catch (reason) { setError(reason instanceof Error ? reason.message : "شروع پرداخت ناموفق بود."); } }
  return <main className="cart-page"><p className="eyebrow">سفارش‌ها</p><h1>سفارش‌های من</h1>{error && <p className="error">{error}</p>}{orders.length === 0 ? <p>هنوز سفارشی ثبت نکرده‌اید. <Link href="/products">مشاهده محصولات</Link></p> : <section className="order-list">{orders.map((order) => <article className="order-card" key={order.number}><strong>سفارش {order.number.slice(0, 8)} - {formatIrr(order.total_irr)}</strong><p>{order.status === "PAID" ? "پرداخت شده" : "در انتظار پرداخت"}</p>{order.shipment && <p>ارسال: {order.shipment.status === "SHIPPED" ? "ارسال شد" : order.shipment.status === "DELIVERED" ? "تحویل شد" : "آماده ارسال"}{order.shipment.tracking_code && ` - کد رهگیری: ${order.shipment.tracking_code}`}</p>}<ul>{order.lines.map((line) => <li key={`${order.number}-${line.product_name}`}>{line.product_name} {line.variant_name} × {line.quantity} - {formatIrr(line.line_total_irr)}</li>)}</ul>{order.status === "PENDING_PAYMENT" && <button type="button" onClick={() => pay(order)}>پرداخت با زرین‌پال</button>}</article>)}</section>}</main>;
}
