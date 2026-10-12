"use client";

import { FormEvent, useState, type ComponentType } from "react";
import { ProductCard } from "@/components/product-card";
import type { Product } from "@/lib/catalog";
import type { ProductListingModel } from "./use-product-listing";

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

export function CatalogCategories({ listing }: { listing: ProductListingModel }) {
  const { selectedCategory, filters, updateSingleFilter } = listing;
  return <>
      {filters?.categories.length ? <nav className="category-pills" aria-label="دسته‌بندی سریع"><button aria-pressed={!selectedCategory} className={!selectedCategory ? "active" : ""} type="button" onClick={() => updateSingleFilter("category", "")}>همه قفسه‌ها</button>{filters.categories.filter((item) => item.parent).map((item) => <button aria-pressed={selectedCategory === item.slug} className={selectedCategory === item.slug ? "active" : ""} type="button" onClick={() => updateSingleFilter("category", item.slug)} key={item.id}>{item.name}</button>)}</nav> : null}
  </>;
}

export function CatalogControls({ listing }: { listing: ProductListingModel }) {
  const { selectedCategory, searchQuery, filtersOpen, setFiltersOpen, searchReset, filterResource, filters, attributes, updateSingleFilter, updateAttribute, chips, searchParams, setRetry } = listing;
  return <>
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
  </>;
}

export function CatalogChips({ listing }: { listing: ProductListingModel }) {
  const { removeFilter, resetFilters, chips } = listing;
  return <>
      {chips.length > 0 && <div className="catalog-active-filters" aria-label="فیلترهای انتخاب‌شده">{chips.map((chip) => <button type="button" key={`${chip.key}:${chip.value}`} aria-label={`حذف ${chip.label}`} onClick={() => removeFilter(chip.key, chip.value)}>{chip.label}<span aria-hidden="true">×</span></button>)}<button className="catalog-clear-all" type="button" onClick={resetFilters}>پاک کردن همه</button></div>}
  </>;
}

export function CatalogResults({ listing, Card = ProductCard, Products }: {
  listing: ProductListingModel;
  Card?: ComponentType<{ product: Product }>;
  Products?: ComponentType<{ products: Product[] }>;
}) {
  const { catalog, resultsHeading, loading, error, products, totalCount, resetFilters, changePage, chips, searchParams, queryString, setRetry } = listing;
  return <>
      <div className="catalog-result-count">
        <h2 ref={resultsHeading} tabIndex={-1}>محصولات{!loading && !error && <span> · {number.format(totalCount)} مورد</span>}</h2>
        <span role="status" aria-live="polite">{loading ? "در حال دریافت محصولات…" : error ? "محصولات دریافت نشدند" : products.length ? `نمایش ${number.format(products.length)} از ${number.format(totalCount)} محصول` : "نتیجه‌ای پیدا نشد"}</span>
      </div>
      {error && <div className="catalog-notice catalog-feedback error" role="alert"><h3>دریافت محصولات ممکن نشد</h3><p>{error}</p><div><button type="button" onClick={() => setRetry((value) => value + 1)}>تلاش مجدد</button>{queryString && <button className="secondary" type="button" onClick={resetFilters}>بازگشت به همه محصولات</button>}</div></div>}
      {!loading && !error && products.length === 0 && <div className="catalog-notice catalog-feedback"><span className="catalog-empty-icon" aria-hidden="true">⌕</span><h3>محصولی با این انتخاب‌ها پیدا نشد</h3><p>{chips.length ? "واژهٔ کوتاه‌تری جستجو کنید یا یکی از فیلترها را بردارید." : "هنوز محصولی برای نمایش منتشر نشده است. کمی بعد دوباره سر بزنید."}</p>{queryString && <button type="button" onClick={resetFilters}>دیدن همه محصولات</button>}</div>}
      <section className="product-grid" aria-label="فهرست محصولات" aria-busy={loading}>
        {loading && products.length === 0 ? Array.from({ length: 6 }, (_, index) => <div className="catalog-skeleton" key={index} aria-hidden="true"><div /><span /><span /><span /></div>) : !error && (Products ? products.length > 0 && <Products products={products} /> : products.map((product) => <Card key={product.id} product={product} />))}
      </section>
      {!error && (catalog?.page?.previous || catalog?.page?.next) && <nav className="page-navigation" aria-label="صفحه‌های محصولات"><button type="button" className="secondary" disabled={loading || !catalog?.page?.previous} onClick={() => changePage(-1)}>صفحه قبل</button><span>صفحه {number.format(Number(searchParams.get("page") ?? "1"))}</span><button type="button" disabled={loading || !catalog?.page?.next} onClick={() => changePage(1)}>صفحه بعد</button></nav>}
  </>;
}

export function CatalogGuide() {
  return <>
      <details className="catalog-shopping-guide"><summary>راهنمای انتخاب و خرید</summary><p>در صفحهٔ محصول، مشخصات، تصاویر و موجودی هر مدل را ببینید و رنگ یا مدل دلخواه را انتخاب کنید. برای افزودن به سبد خرید وارد حساب کاربری شوید. قیمت‌ها به ریال نمایش داده می‌شوند؛ هر ۱۰ ریال برابر با ۱ تومان است. هزینهٔ ارسال بر اساس تهران یا خارج از تهران در تسویه‌حساب مشخص می‌شود.</p></details>
  </>;
}
