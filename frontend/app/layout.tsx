import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

export const metadata: Metadata = {
  title: "نورا | انتخاب‌های خاص برای زندگی روزمره",
  description: "فروشگاه نورا؛ مجموعه‌ای از محصولات کاربردی و خوش‌ساخت.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="fa" dir="rtl"><body>
    <SiteHeader />
    {children}
  </body></html>;
}
