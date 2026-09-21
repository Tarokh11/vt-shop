import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "نورا | نوشت‌افزار برای ایده‌های تازه",
  description: "فروشگاه نورا؛ نوشت‌افزار، دفتر و ابزارهای خلاقیت برای مدرسه، کار و زندگی روزمره.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="fa" dir="rtl"><body>
    <SiteHeader />
    {children}
    <SiteFooter />
  </body></html>;
}
