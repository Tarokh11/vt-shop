"use client";

import Link from "next/link";
import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { productDesigns } from "@/features/product-listing/designs/registry";
import { useProductListing } from "@/features/product-listing/use-product-listing";
import styles from "./switcher.module.css";

export function ProductDesignLab() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryString = searchParams.toString();
  const selected = productDesigns.find((design) => design.id === searchParams.get("design")) ?? productDesigns[0];
  const listing = useProductListing();

  useEffect(() => {
    const params = new URLSearchParams(queryString);
    if (params.get("design") !== selected.id) {
      params.set("design", selected.id);
      router.replace(`${pathname}?${params}`, { scroll: false });
    }
  }, [pathname, queryString, router, selected.id]);

  function selectDesign(id: string) {
    const params = new URLSearchParams(queryString);
    params.set("design", id);
    router.push(`${pathname}?${params}`, { scroll: false });
  }
  const storeParams = new URLSearchParams(queryString);
  storeParams.delete("design");
  const Design = selected.Component;
  return <>
    <section className={styles.toolbar} aria-label="آزمایشگاه طراحی محصولات">
      <div className={styles.intro}><strong>آزمایشگاه طراحی</strong><span>جستجو و فیلترها هنگام تغییر طرح حفظ می‌شوند.</span></div>
      <label htmlFor="product-design">نمایش طرح<select id="product-design" value={selected.id} onChange={(event) => selectDesign(event.target.value)}>{productDesigns.map((design) => <option key={design.id} value={design.id}>{design.name}</option>)}</select></label>
      <p className={styles.description} role="status">{selected.description}</p>
      <Link href={`/products${storeParams.size ? `?${storeParams}` : ""}`}>صفحهٔ اصلی محصولات</Link>
    </section>
    <Design listing={listing} />
  </>;
}
