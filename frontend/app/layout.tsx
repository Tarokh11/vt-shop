import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "نورا | انتخاب‌های خاص برای زندگی روزمره",
  description: "فروشگاه نورا؛ مجموعه‌ای از محصولات کاربردی و خوش‌ساخت.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="fa" dir="rtl"><body>
    <SiteHeader />
    {children}
    <SiteFooter />
  </body></html>;
}
