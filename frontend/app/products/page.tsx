"use client";

import { FormEvent, Suspense, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ProductCard } from "@/components/product-card";
import { CatalogFilters, Page, Product } from "@/lib/catalog";

const number = new Intl.NumberFormat("fa-IR");

function CatalogSearch({ initialQuery, onSearch }: Readonly<{ initialQuery: string; onSearch: (query: string) => void }>) {
  const [query, setQuery] = useState(initialQuery);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSearch(query.trim());
  }
  return (
    <form className="catalog-search" role="search" onSubmit={submit}>
      <label htmlFor="catalog-query">دنبال چه چیزی می‌گردید؟
        <span className="catalog-search-input">
          <input id="catalog-query" type="search" enterKeyHint="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="نام محصول، برند یا ویژگی…" />
          {query && <button className="catalog-search-clear" type="button" aria-label="پاک کردن جستجو" onClick={() => { setQuery(""); onSearch(""); }}>×</button>}
        </span>
      </label>
      <button type="submit">جستجو</button>
    </form>
  );
}

function ProductsPageContent() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryString = searchParams.toString();
  const selectedCategory = searchParams.get("category") ?? "";
  const searchQuery = searchParams.get("q") ?? "";
  const [retry, setRetry] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [searchReset, setSearchReset] = useState(0);
  const [catalog, setCatalog] = useState<{ key: string; page: Page<Product> | null; error: string | null } | null>(null);
  const [filterResource, setFilterResource] = useState<{ category: string; data: CatalogFilters | null; error: boolean } | null>(null);
  const resultsHeading = useRef<HTMLHeadingElement>(null);
  const requestKey = `${queryString}#${retry}`;
  const loading = catalog?.key !== requestKey;
  const error = !loading ? catalog?.error : null;
  const products = catalog?.page?.results ?? [];
  const totalCount = catalog?.page?.count ?? 0;
  const filters = filterResource?.data;
  const attributes = filterResource?.category === selectedCategory ? filters?.attributes ?? [] : [];

  useEffect(() => {
    const controller = new AbortController();
    const params = selectedCategory ? `?category=${encodeURIComponent(selectedCategory)}` : "";
    fetch(`/api/v1/catalog/filters/${params}`, { cache: "no-store", signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Filters unavailable");
        return response.json() as Promise<CatalogFilters>;
      })
      .then((data) => setFilterResource({ category: selectedCategory, data, error: false }))
      .catch((error) => { if (error.name !== "AbortError") setFilterResource({ category: selectedCategory, data: null, error: true }); });
    return () => controller.abort();
  }, [selectedCategory, retry]);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/v1/catalog/products/${queryString ? `?${queryString}` : ""}`, { cache: "no-store", signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(response.status === 400 || response.status === 404
          ? "فیلتر یا شمارهٔ صفحه معتبر نیست. فیلترها را پاک کنید و دوباره انتخاب کنید."
          : "دریافت محصولات ناموفق بود. اتصال اینترنت را بررسی کنید و دوباره تلاش کنید.");
        return response.json() as Promise<Page<Product>>;
      })
      .then((page) => setCatalog({ key: requestKey, page, error: null }))
      .catch((error) => {
        if (error.name !== "AbortError") setCatalog({ key: requestKey, page: null, error: error instanceof TypeError ? "ارتباط با فروشگاه برقرار نشد. اتصال اینترنت را بررسی کنید و دوباره تلاش کنید." : error.message || "دریافت محصولات ناموفق بود. دوباره تلاش کنید." });
      });
    return () => controller.abort();
  }, [queryString, requestKey]);

  function navigate(params: URLSearchParams) {
    router.push(`${pathname}${params.size ? `?${params}` : ""}`, { scroll: false });
  }
  function updateSearchParams(update: (params: URLSearchParams) => void) {
    const params = new URLSearchParams(queryString);
    update(params);
    params.delete("page");
    navigate(params);
  }
  function updateSingleFilter(key: string, value: string) {
    updateSearchParams((params) => {
      if (value) params.set(key, value);
      else params.delete(key);
      if (key === "category") params.delete("attribute");
    });
  }
  function removeFilter(key: string, value: string) {
    updateSearchParams((params) => {
      const remaining = params.getAll(key).filter((item) => item !== value);
      params.delete(key);
      remaining.forEach((item) => params.append(key, item));
      if (key === "category") params.delete("attribute");
    });
  }
  function updateAttribute(value: string, checked: boolean) {
    if (!checked) removeFilter("attribute", value);
    else updateSearchParams((params) => { if (!params.getAll("attribute").includes(value)) params.append("attribute", value); });
  }
  function resetFilters() {
    setSearchReset((value) => value + 1);
    router.push(pathname, { scroll: false });
  }
  function changePage(direction: -1 | 1) {
    const params = new URLSearchParams(queryString);
    const page = Math.max(1, Number(params.get("page") ?? "1") + direction);
    if (page === 1) params.delete("page");
    else params.set("page", String(page));
    navigate(params);
    resultsHeading.current?.focus();
  }
  const chips: { key: string; value: string; label: string }[] = [];
  searchParams.forEach((value, key) => {
    let label: string | undefined;
    if (key === "q") label = `جستجو: ${value}`;
    if (key === "category") label = filters?.categories.find((item) => item.slug === value)?.name ?? value;
    if (key === "brand") label = `برند: ${filters?.brands.find((item) => item.slug === value)?.name ?? value}`;
    if (key === "collection") label = filters?.collections.find((item) => item.slug === value)?.name ?? value;
    if (key === "in_stock") label = value === "true" ? "فقط موجود" : "فقط ناموجود";
    if (key === "attribute") {
      const [definitionSlug, valueSlug] = value.split(":");
      const definition = attributes.find((item) => item.slug === definitionSlug);
      label = definition ? `${definition.name}: ${definition.values.find((item) => item.slug === valueSlug)?.label ?? valueSlug}` : value;
    }
    if (label && !chips.some((chip) => chip.key === key && chip.value === value)) chips.push({ key, value, label });
  });

  return (
    <main className="catalog-page">
      <div className="catalog-heading">
        <div><p className="eyebrow">قفسه نورا</p><h1>ابزارهای کوچک، برای <em>فکرهای بزرگ</em></h1><p>با جستجو و فیلترها، ابزار مناسب نوشتن، طراحی و کارهای روزمره را پیدا کنید.</p></div>
        <div className="catalog-heading-art" aria-hidden="true"><span>✎</span><i>▤</i><b>✦</b></div>
      </div>
      <ul className="catalog-shopping-notes" aria-label="راهنمای خرید"><li>قیمت‌ها به ریال</li><li>انتخاب رنگ و مدل در صفحهٔ محصول</li><li>محاسبهٔ هزینهٔ ارسال در تسویه‌حساب</li></ul>
      {filters?.categories.length ? <nav className="category-pills" aria-label="دسته‌بندی سریع"><button aria-pressed={!selectedCategory} className={!selectedCategory ? "active" : ""} type="button" onClick={() => updateSingleFilter("category", "")}>همه قفسه‌ها</button>{filters.categories.filter((item) => item.parent).map((item) => <button aria-pressed={selectedCategory === item.slug} className={selectedCategory === item.slug ? "active" : ""} type="button" onClick={() => updateSingleFilter("category", item.slug)} key={item.id}>{item.name}</button>)}</nav> : null}
      <section className="catalog-filters" aria-label="جستجو و فیلتر محصولات">
        <CatalogSearch key={`${searchQuery}#${searchReset}`} initialQuery={searchQuery} onSearch={(query) => updateSingleFilter("q", query)} />
        <button className="catalog-filter-toggle" type="button" aria-expanded={filtersOpen} aria-controls="catalog-extra-filters" onClick={() => setFiltersOpen(!filtersOpen)}>فیلتر محصولات {chips.length > 0 && <span>({number.format(chips.length)})</span>}<span aria-hidden="true">{filtersOpen ? "−" : "+"}</span></button>
        <div id="catalog-extra-filters" className="catalog-filter-controls" data-open={filtersOpen}>
          <div className="filter-row">
            <label>دسته‌بندی<select disabled={!filters} value={selectedCategory} onChange={(event) => updateSingleFilter("category", event.target.value)}><option value="">همه دسته‌ها</option>{filters?.categories.map((item) => <option key={item.id} value={item.slug}>{item.parent ? `— ${item.name}` : item.name}</option>)}</select></label>
            <label>برند<select disabled={!filters} value={searchParams.get("brand") ?? ""} onChange={(event) => updateSingleFilter("brand", event.target.value)}><option value="">همه برندها</option>{filters?.brands.map((item) => <option key={item.id} value={item.slug}>{item.name}</option>)}</select></label>
            <label>مجموعه<select disabled={!filters} value={searchParams.get("collection") ?? ""} onChange={(event) => updateSingleFilter("collection", event.target.value)}><option value="">همه مجموعه‌ها</option>{filters?.collections.map((item) => <option key={item.id} value={item.slug}>{item.name}</option>)}</select></label>
            <label className="stock-filter"><input type="checkbox" checked={searchParams.get("in_stock") === "true"} onChange={(event) => updateSingleFilter("in_stock", event.target.checked ? "true" : "")} />فقط موجود</label>
          </div>
          {attributes.length ? <details className="attribute-filters"><summary>ویژگی‌های محصول</summary><div>{attributes.map((definition) => <fieldset key={definition.id}><legend>{definition.name}</legend>{definition.values.map((value) => { const parameter = `${definition.slug}:${value.slug}`; return <label key={value.id}><input type="checkbox" checked={searchParams.getAll("attribute").includes(parameter)} onChange={(event) => updateAttribute(parameter, event.target.checked)} />{value.label}</label>; })}</fieldset>)}</div></details> : !selectedCategory && <p className="catalog-filter-hint">برای فیلتر بر اساس اندازه، رنگ و سایر ویژگی‌ها، ابتدا یک دسته‌بندی انتخاب کنید.</p>}
        </div>
        {filterResource?.error && <div className="catalog-filter-error" role="alert"><span>فیلترها دریافت نشدند.</span><button type="button" onClick={() => setRetry((value) => value + 1)}>تلاش مجدد</button></div>}
      </section>
      {chips.length > 0 && <div className="catalog-active-filters" aria-label="فیلترهای انتخاب‌شده">{chips.map((chip) => <button type="button" key={`${chip.key}:${chip.value}`} aria-label={`حذف ${chip.label}`} onClick={() => removeFilter(chip.key, chip.value)}>{chip.label}<span aria-hidden="true">×</span></button>)}<button className="catalog-clear-all" type="button" onClick={resetFilters}>پاک کردن همه</button></div>}
      <div className="catalog-result-count">
        <h2 ref={resultsHeading} tabIndex={-1}>محصولات{!loading && !error && <span> · {number.format(totalCount)} مورد</span>}</h2>
        <span role="status" aria-live="polite">{loading ? "در حال دریافت محصولات…" : error ? "محصولات دریافت نشدند" : products.length ? `نمایش ${number.format(products.length)} از ${number.format(totalCount)} محصول` : "نتیجه‌ای پیدا نشد"}</span>
      </div>
      {error && <div className="catalog-notice catalog-feedback error" role="alert"><h3>دریافت محصولات ممکن نشد</h3><p>{error}</p><div><button type="button" onClick={() => setRetry((value) => value + 1)}>تلاش مجدد</button>{queryString && <button className="secondary" type="button" onClick={resetFilters}>بازگشت به همه محصولات</button>}</div></div>}
      {!loading && !error && products.length === 0 && <div className="catalog-notice catalog-feedback"><span className="catalog-empty-icon" aria-hidden="true">⌕</span><h3>محصولی با این انتخاب‌ها پیدا نشد</h3><p>{chips.length ? "واژهٔ کوتاه‌تری جستجو کنید یا یکی از فیلترها را بردارید." : "هنوز محصولی برای نمایش منتشر نشده است. کمی بعد دوباره سر بزنید."}</p>{queryString && <button type="button" onClick={resetFilters}>دیدن همه محصولات</button>}</div>}
      <section className="product-grid" aria-label="فهرست محصولات" aria-busy={loading}>
        {loading && products.length === 0 ? Array.from({ length: 6 }, (_, index) => <div className="catalog-skeleton" key={index} aria-hidden="true"><div /><span /><span /><span /></div>) : !error && products.map((product) => <ProductCard key={product.id} product={product} />)}
      </section>
      {!error && (catalog?.page?.previous || catalog?.page?.next) && <nav className="page-navigation" aria-label="صفحه‌های محصولات"><button type="button" className="secondary" disabled={loading || !catalog?.page?.previous} onClick={() => changePage(-1)}>صفحه قبل</button><span>صفحه {number.format(Number(searchParams.get("page") ?? "1"))}</span><button type="button" disabled={loading || !catalog?.page?.next} onClick={() => changePage(1)}>صفحه بعد</button></nav>}
      <details className="catalog-shopping-guide"><summary>راهنمای انتخاب و خرید</summary><p>در صفحهٔ محصول، مشخصات، تصاویر و موجودی هر مدل را ببینید و رنگ یا مدل دلخواه را انتخاب کنید. برای افزودن به سبد خرید وارد حساب کاربری شوید. قیمت‌ها به ریال نمایش داده می‌شوند؛ هر ۱۰ ریال برابر با ۱ تومان است. هزینهٔ ارسال بر اساس تهران یا خارج از تهران در تسویه‌حساب مشخص می‌شود.</p></details>
    </main>
  );
}

export default function ProductsPage() {
  return <Suspense fallback={<main className="catalog-page"><p role="status">در حال دریافت محصولات…</p></main>}><ProductsPageContent /></Suspense>;
}
