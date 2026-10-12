"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { CatalogFilters, Page, Product } from "@/lib/catalog";

export function useProductListing() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const catalogParams = new URLSearchParams(searchParams.toString());
  catalogParams.delete("design");
  const queryString = catalogParams.toString();
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
    const params = new URLSearchParams(searchParams.toString());
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
    const params = new URLSearchParams();
    const design = searchParams.get("design");
    if (design) params.set("design", design);
    navigate(params);
  }
  function changePage(direction: -1 | 1) {
    const params = new URLSearchParams(searchParams.toString());
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

  return { selectedCategory, searchQuery, filtersOpen, setFiltersOpen, searchReset, catalog, filterResource, resultsHeading, loading, error, products, totalCount, filters, attributes, updateSingleFilter, removeFilter, updateAttribute, resetFilters, changePage, chips, searchParams, queryString, setRetry };
}

export type ProductListingModel = ReturnType<typeof useProductListing>;
