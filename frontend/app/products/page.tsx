"use client";

import { useEffect, useState } from "react";

import { ProductCard } from "@/components/product-card";
import { Category, Page, Product } from "@/lib/catalog";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [category, setCategory] = useState("");
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [nextPage, setNextPage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/v1/catalog/categories/", { cache: "no-store" })
      .then((response) => response.json())
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const query = category ? `?category=${encodeURIComponent(category)}` : "";
    fetch(`/api/v1/catalog/products/${query}`, { cache: "no-store", signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Catalog unavailable");
        return response.json() as Promise<Page<Product>>;
      })
      .then((page) => { setProducts(page.results); setNextPage(page.next); setState("ready"); })
      .catch((error) => { if (error.name !== "AbortError") setState("error"); });
    return () => controller.abort();
  }, [category]);

  async function loadMore() {
    if (!nextPage) return;
    setState("loading");
    try {
      const url = new URL(nextPage, window.location.origin);
      const response = await fetch(`${url.pathname}${url.search}`, { cache: "no-store" });
      if (!response.ok) throw new Error("Catalog unavailable");
      const page = await response.json() as Page<Product>;
      setProducts((current) => [...current, ...page.results]);
      setNextPage(page.next);
      setState("ready");
    } catch {
      setState("error");
    }
  }

  return (
    <main className="catalog-page">
      <div className="catalog-heading">
        <div><p className="eyebrow">کاتالوگ</p><h1>محصولات فروشگاه</h1></div>
        <label className="category-filter">دسته‌بندی
          <select value={category} onChange={(event) => { setState("loading"); setCategory(event.target.value); }}>
            <option value="">همه محصولات</option>
            {categories.map((item) => <option key={item.id} value={item.slug}>{item.name}</option>)}
          </select>
        </label>
      </div>
      {state === "loading" && <p className="catalog-notice" role="status">در حال دریافت محصولات…</p>}
      {state === "error" && <p className="catalog-notice error" role="alert">دریافت محصولات ناموفق بود.</p>}
      {state === "ready" && products.length === 0 && <p className="catalog-notice">محصولی در این دسته منتشر نشده است.</p>}
      <section className="product-grid" aria-live="polite">
        {products.map((product) => <ProductCard key={product.id} product={product} />)}
      </section>
      {nextPage && <button className="load-more" type="button" onClick={loadMore} disabled={state === "loading"}>نمایش محصولات بیشتر</button>}
    </main>
  );
}
