"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { api, ApiError } from "@/lib/api";
import { formatIrr, Page } from "@/lib/catalog";

type Shipment = { status: "READY" | "SHIPPED" | "DELIVERED"; tracking_code: string };
type Order = {
  number: string;
  status: "PAID" | "CANCELLED" | string;
  total_irr: number;
  created_at: string;
  shipment: Shipment | null;
  lines: { product_name: string; product_slug: string; variant_name: string; quantity: number; line_total_irr: number }[];
};

const orderSteps = [
  { key: "paid", label: "پرداخت شد", detail: "سفارش شما ثبت شد" },
  { key: "ready", label: "در حال آماده‌سازی", detail: "در حال آماده کردن سفارش" },
  { key: "shipped", label: "ارسال شد", detail: "تحویل پست یا پیک" },
  { key: "delivered", label: "تحویل شد", detail: "به دست شما رسید" },
] as const;

function currentStep(order: Order): number {
  if (order.status === "CANCELLED") return -1;
  if (order.shipment?.status === "DELIVERED") return 3;
  if (order.shipment?.status === "SHIPPED") return 2;
  if (order.shipment?.status === "READY") return 1;
  return 0;
}

function orderStatus(order: Order): { label: string; tone: string } {
  if (order.status === "CANCELLED") return { label: "لغو شده", tone: "cancelled" };
  if (order.shipment?.status === "DELIVERED") return { label: "تحویل شده", tone: "delivered" };
  if (order.shipment?.status === "SHIPPED") return { label: "در مسیر شما", tone: "shipping" };
  if (order.shipment?.status === "READY") return { label: "در حال آماده‌سازی", tone: "preparing" };
  return { label: "پرداخت موفق", tone: "paid" };
}

function orderDate(value: string): string {
  return new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium" }).format(new Date(value));
}

function OrdersPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [pageLinks, setPageLinks] = useState({ next: false, previous: false });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = searchParams.toString();
    api<Page<Order>>(`/api/v1/orders/${params ? `?${params}` : ""}`)
      .then((page) => {
        setOrders(page.results);
        setPageLinks({ next: Boolean(page.next), previous: Boolean(page.previous) });
      })
      .catch((reason) => {
        if (reason instanceof ApiError && [401, 403].includes(reason.status)) router.replace("/login");
        else setError(reason instanceof Error ? reason.message : "دریافت سفارش‌ها ناموفق بود.");
      })
      .finally(() => setLoading(false));
  }, [router, searchParams]);

  function changePage(direction: -1 | 1) {
    const params = new URLSearchParams(searchParams.toString());
    const page = Math.max(1, Number(params.get("page") ?? "1") + direction);
    if (page === 1) params.delete("page");
    else params.set("page", String(page));
    router.push(`${pathname}?${params}`);
  }

  if (loading) return <main><p role="status">در حال دریافت سفارش‌ها…</p></main>;
  if (!orders) return <main><p className="error" role="alert">دریافت سفارش‌ها ناموفق بود.</p></main>;

  return (
    <main className="orders-page">
      <header className="orders-heading">
        <div><p className="eyebrow">از قفسه تا میز شما</p><h1>سفارش‌های من</h1><p>آماده شدن بسته نورا و مسیر رسیدنش را قدم‌به‌قدم دنبال کنید.</p></div>
        <Link className="button-quiet" href="/products">خرید دوباره</Link>
      </header>
      {error && <p className="error" role="alert">{error}</p>}
      {orders.length === 0 ? (
        <section className="orders-empty">
          <span className="orders-empty-mark" aria-hidden="true">▤</span>
          <h2>هنوز سفارشی ندارید</h2>
          <p>دفتر و ابزار مورد علاقه‌تان را پیدا کنید و اولین بسته نورا را بسازید.</p>
          <Link className="button-primary" href="/products">مشاهده محصولات</Link>
        </section>
      ) : (
        <section className="order-list" aria-label="فهرست سفارش‌ها">
          {orders.map((order) => {
            const status = orderStatus(order);
            const activeStep = currentStep(order);
            return <article className="order-card" key={order.number}>
              <header className="order-card-header">
                <div><p className="eyebrow">سفارش {order.number.slice(0, 8)}</p><p className="order-date">ثبت شده در {orderDate(order.created_at)}</p></div>
                <span className={`order-status ${status.tone}`}>{status.label}</span>
              </header>
              <ol className="order-progress" aria-label={`وضعیت سفارش: ${status.label}`}>
                {orderSteps.map((step, index) => <li className={index <= activeStep ? "complete" : ""} key={step.key}>
                  <span className="order-progress-dot" aria-hidden="true">{index <= activeStep ? "✓" : index + 1}</span>
                  <span><strong>{step.label}</strong><small>{step.detail}</small></span>
                </li>)}
              </ol>
              <div className="order-card-summary">
                <div><span>مبلغ نهایی</span><strong>{formatIrr(order.total_irr)}</strong></div>
                <div><span>اقلام سفارش</span><strong>{order.lines.reduce((total, line) => total + line.quantity, 0)} کالا</strong></div>
                {order.shipment?.tracking_code && <div><span>کد رهگیری</span><strong>{order.shipment.tracking_code}</strong></div>}
              </div>
              <ul className="order-lines">
                {order.lines.map((line, index) => <li key={`${order.number}-${line.product_name}-${index}`}>
                  <div>{line.product_slug ? <Link href={`/products/${encodeURIComponent(line.product_slug)}`}><strong>{line.product_name}</strong></Link> : <strong>{line.product_name}</strong>}{line.variant_name && <span>{line.variant_name}</span>}</div>
                  <span>{line.quantity} عدد · {formatIrr(line.line_total_irr)}</span>
                </li>)}
              </ul>
            </article>;
          })}
        </section>
      )}
      {(pageLinks.previous || pageLinks.next) && <nav className="order-pagination" aria-label="صفحه‌های سفارش‌ها"><button type="button" className="secondary" disabled={!pageLinks.previous} onClick={() => changePage(-1)}>سفارش‌های جدیدتر</button><span>صفحه {searchParams.get("page") ?? "1"}</span><button type="button" disabled={!pageLinks.next} onClick={() => changePage(1)}>سفارش‌های قدیمی‌تر</button></nav>}
    </main>
  );
}

export default function OrdersPage() {
  return <Suspense fallback={<main><p role="status">در حال دریافت سفارش‌ها…</p></main>}><OrdersPageContent /></Suspense>;
}
