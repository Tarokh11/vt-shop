import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="site-footer-intro">
          <Link className="footer-brand" href="/">
            <span className="brand-mark" aria-hidden="true">ن</span>
            <span><strong>نورا</strong><small>انتخاب‌های خاص برای زندگی روزمره</small></span>
          </Link>
          <p>محصولات کاربردی، انتخاب‌های آرام و تجربه‌ای ساده برای خرید روزمره.</p>
        </div>
        <nav className="site-footer-links" aria-label="پیوندهای پایین صفحه">
          <div><strong>فروشگاه</strong><Link href="/products">مشاهده محصولات</Link><Link href="/cart">سبد خرید</Link></div>
          <div><strong>راهنما</strong><Link href="/account">حساب کاربری</Link><Link href="/checkout">نحوه سفارش</Link></div>
        </nav>
        <div className="site-footer-contact">
          <strong>همراه شما</strong>
          <p>شنبه تا پنجشنبه، ۹ تا ۱۸</p>
          <a href="mailto:hello@example.com">hello@example.com</a>
        </div>
      </div>
      <div className="site-footer-bottom"><span>© ۱۴۰۵ نورا</span><span>پرداخت امن و ارسال به سراسر ایران</span></div>
    </footer>
  );
}
