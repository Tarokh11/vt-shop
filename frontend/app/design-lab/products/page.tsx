import type { Metadata } from "next";
import { Suspense } from "react";
import { ProductDesignLab } from "./product-design-lab";

export const metadata: Metadata = {
  title: "آزمایشگاه طراحی محصولات | نورا",
  robots: { index: false, follow: false },
};

export default function DesignLabPage() {
  return <Suspense fallback={<main><p role="status">در حال آماده‌سازی آزمایشگاه…</p></main>}><ProductDesignLab /></Suspense>;
}
