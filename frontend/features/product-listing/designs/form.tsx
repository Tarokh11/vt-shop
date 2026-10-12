"use client";

import Image from "next/image";
import Link from "next/link";
import localFont from "next/font/local";
import { useState, type FormEvent } from "react";
import type { Product } from "@/lib/catalog";
import { productPresentation } from "@/lib/product-presentation";
import { CatalogResults } from "../catalog-controls";
import type { ProductListingModel } from "../use-product-listing";
import styles from "./form.module.css";

const estedad = localFont({ src: "./form-assets/Estedad-variable.woff2", weight: "100 900", display: "swap" });
const number = new Intl.NumberFormat("fa-IR");

function FormSearch({ query, onSearch }: { query: string; onSearch: (value: string) => void }) {
  const [draft, setDraft] = useState(query);
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); onSearch(draft.trim()); }
  return <form className={styles.search} role="search" onSubmit={submit}>
    <label className="sr-only" htmlFor="form-search">جستجوی محصولات</label>
    <input id="form-search" type="search" placeholder="چی می‌خواهی بسازی؟ جستجو کن." value={draft} onChange={(event) => setDraft(event.target.value)} enterKeyHint="search" />
    {draft && <button className={styles.clearSearch} type="button" aria-label="پاک کردن جستجو" onClick={() => { setDraft(""); onSearch(""); }}>×</button>}
    <button className={styles.searchSubmit} type="submit">پیدا کن</button>
  </form>;
}

function FormGrid({ products }: { products: Product[] }) {
  return <div className={styles.grid}>{products.map((product) => {
    const { image, priceLabel, available, specifications } = productPresentation(product);
    return <article className={styles.product} key={product.id} data-product-id={product.id}>
      <Link className={styles.image} href={`/products/${product.slug}`}>{image ? <Image src={image.image} alt={image.alt_text || product.name} width={640} height={640} sizes="(max-width: 480px) 100vw, (max-width: 1024px) 50vw, 25vw" /> : <span>بدون تصویر</span>}</Link>
      <div className={styles.productBody}><div className={styles.productLabels}><span>{product.brand?.name || product.categories[0]?.name}</span><span className={available ? styles.available : styles.soldOut}>{available ? "موجود" : "ناموجود"}</span></div>
        <h2><Link href={`/products/${product.slug}`}>{product.name}</Link></h2>
        <p className={styles.specs}>{specifications.join(" / ")}</p>
        <div className={styles.productBottom}><strong>{priceLabel}</strong><Link href={`/products/${product.slug}`} aria-label={`جزئیات ${product.name}`}>ببین<span aria-hidden="true">↗</span></Link></div>
      </div>
    </article>;
  })}</div>;
}

export function FormDesign({ listing }: { listing: ProductListingModel }) {
  const { filters, selectedCategory, searchParams, attributes, filtersOpen, chips } = listing;
  return <main className={`${styles.page} ${estedad.className}`} data-product-design="form">
    <header className={styles.header}><Link className={styles.wordmark} href="/design-lab/products?design=form" aria-label="صفحهٔ اصلی طرح FORM">FORM<span>فرم</span></Link><nav aria-label="ناوبری فروشگاه فرم"><a href="#form-catalog">همه ابزارها</a><Link href="/orders">سفارش‌های من</Link><Link href="/account">حساب من</Link></nav><Link className={styles.cart} href="/cart">سبد خرید<span aria-hidden="true">↗</span></Link></header>
    <section className={styles.hero} aria-labelledby="form-heading"><div><p>ابزار روزمره برای آدم‌های خلاق</p><h1 id="form-heading">خوب بنویس.<br />خوب بساز.</h1></div><p className={styles.heroNote}>چیزهایی که هر روز به کار می‌آیند.<br />از اولین یادداشت تا آخرین ایده.</p></section>
    <div className={styles.container} id="form-catalog">
      <div className={styles.finder}><FormSearch key={`${listing.searchQuery}#${listing.searchReset}`} query={listing.searchQuery} onSearch={(query) => listing.updateSingleFilter("q", query)} /><button className={styles.filterToggle} type="button" aria-expanded={filtersOpen} aria-controls="form-filters" onClick={() => listing.setFiltersOpen(!filtersOpen)}>فیلترها{chips.length > 0 && <span>{number.format(chips.length)}</span>}<span aria-hidden="true">{filtersOpen ? "−" : "+"}</span></button></div>
      <section id="form-filters" className={styles.filters} hidden={!filtersOpen} aria-label="فیلتر محصولات فرم">
        <label htmlFor="form-category">دسته‌بندی<select id="form-category" disabled={!filters} value={selectedCategory} onChange={(event) => listing.updateSingleFilter("category", event.target.value)}><option value="">همه ابزارها</option>{filters?.categories.map((category) => <option key={category.id} value={category.slug}>{category.name}</option>)}</select></label>
        <label htmlFor="form-brand">برند<select id="form-brand" disabled={!filters} value={searchParams.get("brand") ?? ""} onChange={(event) => listing.updateSingleFilter("brand", event.target.value)}><option value="">همه برندها</option>{filters?.brands.map((brand) => <option key={brand.id} value={brand.slug}>{brand.name}</option>)}</select></label>
        <label htmlFor="form-collection">مجموعه<select id="form-collection" disabled={!filters} value={searchParams.get("collection") ?? ""} onChange={(event) => listing.updateSingleFilter("collection", event.target.value)}><option value="">همه مجموعه‌ها</option>{filters?.collections.map((collection) => <option key={collection.id} value={collection.slug}>{collection.name}</option>)}</select></label>
        <label className={styles.stock}><input type="checkbox" checked={searchParams.get("in_stock") === "true"} onChange={(event) => listing.updateSingleFilter("in_stock", event.target.checked ? "true" : "")} />فقط کالاهای موجود</label>
        {attributes.length > 0 && <div className={styles.attributes}>{attributes.map((definition) => <fieldset key={definition.id}><legend>{definition.name}</legend>{definition.values.map((value) => { const parameter = `${definition.slug}:${value.slug}`; return <label key={value.id}><input type="checkbox" checked={searchParams.getAll("attribute").includes(parameter)} onChange={(event) => listing.updateAttribute(parameter, event.target.checked)} />{value.label}</label>; })}</fieldset>)}</div>}
        {!selectedCategory && <p className={styles.filterHint}>یک دسته را انتخاب کنید تا فیلترهای اندازه، رنگ و ویژگی‌های آن را ببینید.</p>}
      </section>
      {listing.filterResource?.error && <div className={styles.filterError} role="alert">فیلترها دریافت نشدند.<button type="button" onClick={() => listing.setRetry((value) => value + 1)}>دوباره تلاش کن</button></div>}
      <nav className={styles.categories} aria-label="دسته‌های محصولات فرم"><button type="button" aria-pressed={!selectedCategory} onClick={() => listing.updateSingleFilter("category", "")}>همه ابزارها</button>{filters?.categories.filter((category) => category.parent).map((category) => <button key={category.id} type="button" aria-pressed={selectedCategory === category.slug} onClick={() => listing.updateSingleFilter("category", category.slug)}>{category.name}</button>)}</nav>
      {chips.length > 0 && <div className={styles.chips} aria-label="فیلترهای انتخاب‌شده">{chips.map((chip) => <button key={`${chip.key}:${chip.value}`} type="button" aria-label={`حذف ${chip.label}`} onClick={() => listing.removeFilter(chip.key, chip.value)}>{chip.label}<span aria-hidden="true">×</span></button>)}<button type="button" onClick={listing.resetFilters}>پاک کردن همه</button></div>}
      <div className={styles.results}><CatalogResults listing={listing} Products={FormGrid} /></div>
    </div>
    <footer className={styles.footer}><div className={styles.footerBrand}>FORM<span>ابزار خوب. برای هر روز.</span></div><div><strong>قبل از خرید</strong><p>قیمت‌ها به ریال هستند. رنگ و مدل را در صفحهٔ محصول انتخاب کنید. هزینهٔ ارسال در تسویه‌حساب مشخص می‌شود.</p></div><nav aria-label="راهنمای فروشگاه فرم"><Link href="/orders">پیگیری سفارش</Link><Link href="/account">حساب کاربری</Link><a href="#form-catalog">برگشت به ابزارها</a></nav></footer>
  </main>;
}
