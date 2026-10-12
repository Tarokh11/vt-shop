"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Product } from "@/lib/catalog";
import { productPresentation } from "@/lib/product-presentation";
import { CatalogCategories, CatalogControls, CatalogChips, CatalogResults, CatalogGuide } from "../catalog-controls";
import type { ProductListingModel } from "../use-product-listing";
import styles from "./shelves.module.css";

function Shelf({ name, products }: { name: string; products: Product[] }) {
  const rail = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ previous: false, next: false });
  useEffect(() => {
    const element = rail.current;
    if (!element) return;
    function measure() {
      if (!element) return;
      const offset = Math.abs(element.scrollLeft);
      const next = { previous: offset > 1, next: offset < element.scrollWidth - element.clientWidth - 1 };
      setEdges((current) => current.previous === next.previous && current.next === next.next ? current : next);
    }
    const frame = window.requestAnimationFrame(measure);
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    element.addEventListener("scroll", measure, { passive: true });
    return () => { window.cancelAnimationFrame(frame); observer.disconnect(); element.removeEventListener("scroll", measure); };
  }, [products.length]);
  function scroll(direction: number) {
    rail.current?.scrollBy({ left: direction * rail.current.clientWidth * .8, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }
  return <section className={styles.shelf} aria-label={name}>
    <header><div><h3>{name}</h3><span>{new Intl.NumberFormat("fa-IR").format(products.length)} محصول در این صفحه</span></div><div className={styles.arrows}><button type="button" aria-label={`محصولات قبلی ${name}`} disabled={!edges.previous} onClick={() => scroll(1)}>→</button><button type="button" aria-label={`محصولات بعدی ${name}`} disabled={!edges.next} onClick={() => scroll(-1)}>←</button></div></header>
    <div className={styles.rail} ref={rail} tabIndex={0} role="group" aria-label={`قفسهٔ ${name}`}>{products.map((product) => {
      const { image, priceLabel, available } = productPresentation(product);
      return <article className={styles.item} key={product.id} data-product-id={product.id}><Link className={styles.image} href={`/products/${product.slug}`}>{image ? <Image src={image.image} alt={image.alt_text || product.name} width={480} height={480} sizes="240px" /> : <span>بدون تصویر</span>}</Link><div className={styles.info}><span>{product.brand?.name}</span><h4><Link href={`/products/${product.slug}`}>{product.name}</Link></h4><div><strong>{priceLabel}</strong><small>{available ? "موجود" : "ناموجود"}</small></div><Link className={styles.detail} href={`/products/${product.slug}`}>انتخاب و جزئیات ←</Link></div></article>;
    })}</div>
  </section>;
}

function ProductShelves({ products }: { products: Product[] }) {
  const groups = new Map<string, { name: string; products: Product[] }>();
  for (const product of products) {
    const category = product.categories.find((item) => item.parent) ?? product.categories[0];
    const key = category?.slug ?? "other";
    if (!groups.has(key)) groups.set(key, { name: category?.name ?? "سایر محصولات", products: [] });
    groups.get(key)!.products.push(product);
  }
  return <div>{Array.from(groups, ([key, group]) => <Shelf key={key} name={group.name} products={group.products} />)}</div>;
}

export function ShelvesDesign({ listing }: { listing: ProductListingModel }) {
  return <main className={styles.page} data-product-design="shelves"><div className={styles.container}>
    <header className={styles.hero}><div><p>به قفسه‌های نورا خوش آمدید</p><h1>امروز، کدام قفسه؟</h1></div><p>هر دسته یک ردیف؛<br />بین محصولات حرکت کنید و انتخابتان را پیدا کنید.</p></header>
    <div className={styles.discovery}><CatalogCategories listing={listing} /><CatalogControls listing={listing} /></div>
    <CatalogChips listing={listing} /><CatalogResults listing={listing} Products={ProductShelves} /><CatalogGuide />
  </div></main>;
}
