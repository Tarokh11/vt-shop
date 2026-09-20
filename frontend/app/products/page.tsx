"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { ProductCard } from "@/components/product-card";
import { CatalogFilters, Page, Product } from "@/lib/catalog";

function ProductsPageContent() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [filters, setFilters] = useState<CatalogFilters | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [nextPage, setNextPage] = useState<string | null>(null);
  const [query, setQuery] = useState(() => searchParams.get("q") ?? "");

  useEffect(() => {
    fetch("/api/v1/catalog/filters/", { cache: "no-store" })
      .then((response) => response.ok ? response.json() as Promise<CatalogFilters> : Promise.reject())
      .then(setFilters)
      .catch(() => setFilters(null));
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const params = searchParams.toString();
    fetch(`/api/v1/catalog/products/${params ? `?${params}` : ""}`, { cache: "no-store", signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Catalog unavailable");
        return response.json() as Promise<Page<Product>>;
      })
      .then((page) => { setProducts(page.results); setNextPage(page.next); setState("ready"); })
      .catch((error) => { if (error.name !== "AbortError") setState("error"); });
    return () => controller.abort();
  }, [searchParams]);

  function updateSearchParams(update: (params: URLSearchParams) => void) {
    const params = new URLSearchParams(searchParams.toString());
    update(params);
    params.delete("page");
    router.push(`${pathname}${params.size ? `?${params}` : ""}`);
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateSearchParams((params) => {
      if (query.trim()) params.set("q", query.trim());
      else params.delete("q");
    });
  }

  function updateAttribute(value: string, checked: boolean) {
    updateSearchParams((params) => {
      const values = params.getAll("attribute").filter((item) => item !== value);
      if (checked) values.push(value);
      params.delete("attribute");
      values.forEach((item) => params.append("attribute", item));
    });
  }

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
      </div>
      <section className="catalog-filters" aria-label="جستجو و فیلتر محصولات">
        <form className="catalog-search" onSubmit={submitSearch}>
          <label>جستجو<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="نام، برند یا ویژگی محصول" /></label>
          <button type="submit">جستجو</button>
        </form>
        <div className="filter-row">
          <label>دسته‌بندی<select value={searchParams.get("category") ?? ""} onChange={(event) => updateSearchParams((params) => { if (event.target.value) params.set("category", event.target.value); else params.delete("category"); })}><option value="">همه دسته‌ها</option>{filters?.categories.map((item) => <option key={item.id} value={item.slug}>{item.parent ? `- ${item.name}` : item.name}</option>)}</select></label>
          <label>برند<select value={searchParams.get("brand") ?? ""} onChange={(event) => updateSearchParams((params) => { if (event.target.value) params.set("brand", event.target.value); else params.delete("brand"); })}><option value="">همه برندها</option>{filters?.brands.map((item) => <option key={item.id} value={item.slug}>{item.name}</option>)}</select></label>
          <label>مجموعه<select value={searchParams.get("collection") ?? ""} onChange={(event) => updateSearchParams((params) => { if (event.target.value) params.set("collection", event.target.value); else params.delete("collection"); })}><option value="">همه مجموعه‌ها</option>{filters?.collections.map((item) => <option key={item.id} value={item.slug}>{item.name}</option>)}</select></label>
          <label className="stock-filter"><input type="checkbox" checked={searchParams.get("in_stock") === "true"} onChange={(event) => updateSearchParams((params) => { if (event.target.checked) params.set("in_stock", "true"); else params.delete("in_stock"); })} />فقط موجود</label>
        </div>
        {filters?.attributes.length ? <details className="attribute-filters"><summary>فیلتر ویژگی‌ها</summary><div>{filters.attributes.map((definition) => <fieldset key={definition.id}><legend>{definition.name}</legend>{definition.values.map((value) => { const parameter = `${definition.slug}:${value.slug}`; return <label key={value.id}><input type="checkbox" checked={searchParams.getAll("attribute").includes(parameter)} onChange={(event) => updateAttribute(parameter, event.target.checked)} />{value.label}</label>; })}</fieldset>)}</div></details> : null}
      </section>
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

function ProductsPageWithUrlState() {
  const searchParams = useSearchParams();
  return <ProductsPageContent key={searchParams.toString()} />;
}

export default function ProductsPage() {
  return <Suspense fallback={<main className="catalog-page"><p role="status">در حال دریافت محصولات…</p></main>}><ProductsPageWithUrlState /></Suspense>;
}
