import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

export const metadata: Metadata = {
  title: "E-commerce Starter",
  description: "Reusable single-store e-commerce foundation",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="fa" dir="rtl"><body>
    <SiteHeader />
    {children}
  </body></html>;
}
