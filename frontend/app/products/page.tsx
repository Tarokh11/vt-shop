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
  const [pageLinks, setPageLinks] = useState({ next: false, previous: false });
  const [totalCount, setTotalCount] = useState(0);
  const [query, setQuery] = useState(() => searchParams.get("q") ?? "");
  const selectedCategory = searchParams.get("category") ?? "";

  useEffect(() => {
    const params = selectedCategory ? `?category=${encodeURIComponent(selectedCategory)}` : "";
    fetch(`/api/v1/catalog/filters/${params}`, { cache: "no-store" })
      .then((response) => response.ok ? response.json() as Promise<CatalogFilters> : Promise.reject())
      .then(setFilters)
      .catch(() => setFilters(null));
  }, [selectedCategory]);

  useEffect(() => {
    const controller = new AbortController();
    const params = searchParams.toString();
    fetch(`/api/v1/catalog/products/${params ? `?${params}` : ""}`, { cache: "no-store", signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Catalog unavailable");
        return response.json() as Promise<Page<Product>>;
      })
      .then((page) => { setProducts(page.results); setTotalCount(page.count); setPageLinks({ next: Boolean(page.next), previous: Boolean(page.previous) }); setState("ready"); })
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

  function changePage(direction: -1 | 1) {
    const params = new URLSearchParams(searchParams.toString());
    const page = Math.max(1, Number(params.get("page") ?? "1") + direction);
    if (page === 1) params.delete("page");
    else params.set("page", String(page));
    router.push(`${pathname}?${params}`);
  }

  return (
    <main className="catalog-page">
      <div className="catalog-heading">
        <div><p className="eyebrow">قفسه نورا</p><h1>ابزارهای کوچک، برای <em>فکرهای بزرگ</em></h1><p>بر اساس کاری که می‌خواهید انجام دهید، رنگی که دوست دارید یا ویژگی مورد نیازتان جستجو کنید.</p></div>
        <div className="catalog-heading-art" aria-hidden="true"><span>✎</span><i>▤</i><b>✦</b></div>
      </div>
      {filters?.categories.length ? <nav className="category-pills" aria-label="دسته‌بندی سریع"><button className={!selectedCategory ? "active" : ""} type="button" onClick={() => updateSearchParams((params) => { params.delete("category"); params.delete("attribute"); })}>همه قفسه‌ها</button>{filters.categories.filter((item) => item.parent).map((item) => <button className={selectedCategory === item.slug ? "active" : ""} type="button" onClick={() => updateSearchParams((params) => { params.set("category", item.slug); params.delete("attribute"); })} key={item.id}>{item.name}</button>)}</nav> : null}
      <section className="catalog-filters" aria-label="جستجو و فیلتر محصولات">
        <form className="catalog-search" onSubmit={submitSearch}>
          <label>جستجو<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="نام، برند یا ویژگی محصول" /></label>
          <button type="submit">جستجو</button>
        </form>
        <div className="filter-row">
          <label>دسته‌بندی<select value={selectedCategory} onChange={(event) => updateSearchParams((params) => { if (event.target.value) params.set("category", event.target.value); else params.delete("category"); params.delete("attribute"); })}><option value="">همه دسته‌ها</option>{filters?.categories.map((item) => <option key={item.id} value={item.slug}>{item.parent ? `- ${item.name}` : item.name}</option>)}</select></label>
          <label>برند<select value={searchParams.get("brand") ?? ""} onChange={(event) => updateSearchParams((params) => { if (event.target.value) params.set("brand", event.target.value); else params.delete("brand"); })}><option value="">همه برندها</option>{filters?.brands.map((item) => <option key={item.id} value={item.slug}>{item.name}</option>)}</select></label>
          <label>مجموعه<select value={searchParams.get("collection") ?? ""} onChange={(event) => updateSearchParams((params) => { if (event.target.value) params.set("collection", event.target.value); else params.delete("collection"); })}><option value="">همه مجموعه‌ها</option>{filters?.collections.map((item) => <option key={item.id} value={item.slug}>{item.name}</option>)}</select></label>
          <label className="stock-filter"><input type="checkbox" checked={searchParams.get("in_stock") === "true"} onChange={(event) => updateSearchParams((params) => { if (event.target.checked) params.set("in_stock", "true"); else params.delete("in_stock"); })} />فقط موجود</label>
        </div>
        {filters?.attributes.length ? <details className="attribute-filters"><summary>فیلتر ویژگی‌ها</summary><div>{filters.attributes.map((definition) => <fieldset key={definition.id}><legend>{definition.name}</legend>{definition.values.map((value) => { const parameter = `${definition.slug}:${value.slug}`; return <label key={value.id}><input type="checkbox" checked={searchParams.getAll("attribute").includes(parameter)} onChange={(event) => updateAttribute(parameter, event.target.checked)} />{value.label}</label>; })}</fieldset>)}</div></details> : null}
      </section>
      {state === "ready" && <div className="catalog-result-count"><span><strong>{new Intl.NumberFormat("fa-IR").format(totalCount)}</strong> محصول روی این قفسه</span>{searchParams.size > 0 && <button type="button" onClick={() => { setQuery(""); router.push(pathname); }}>پاک کردن فیلترها ×</button>}</div>}
      {state === "loading" && <p className="catalog-notice" role="status">در حال دریافت محصولات…</p>}
      {state === "error" && <p className="catalog-notice error" role="alert">دریافت محصولات ناموفق بود.</p>}
      {state === "ready" && products.length === 0 && <p className="catalog-notice">محصولی در این دسته منتشر نشده است.</p>}
      <section className="product-grid" aria-live="polite">
        {products.map((product) => <ProductCard key={product.id} product={product} />)}
      </section>
      {(pageLinks.previous || pageLinks.next) && <nav className="page-navigation" aria-label="صفحه‌های محصولات"><button type="button" className="secondary" disabled={!pageLinks.previous} onClick={() => changePage(-1)}>صفحه قبل</button><span>صفحه {searchParams.get("page") ?? "1"}</span><button type="button" disabled={!pageLinks.next} onClick={() => changePage(1)}>صفحه بعد</button></nav>}
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
