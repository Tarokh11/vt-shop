import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "E-commerce Starter",
  description: "Reusable single-store e-commerce foundation",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="fa" dir="rtl"><body>
    <header className="site-header">
      <Link className="brand" href="/">فروشگاه</Link>
      <nav aria-label="حساب کاربری"><Link href="/login">ورود</Link><Link href="/account">حساب من</Link></nav>
    </header>
    {children}
  </body></html>;
}
