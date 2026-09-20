import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="site-footer-intro">
          <Link className="footer-brand" href="/">
            <span className="brand-mark" aria-hidden="true">ن</span>
            <span><strong>نورا</strong><small>لوازم تحریر و ابزار خلاقیت</small></span>
          </Link>
          <p>از نوشت‌افزار روزمره تا دفتر و ابزارهای خلاقیت، انتخاب‌هایی برای میز کار و مدرسه.</p>
        </div>
        <nav className="site-footer-links" aria-label="پیوندهای پایین صفحه">
          <div><strong>فروشگاه</strong><Link href="/products">همه محصولات</Link><Link href="/products?category=writing-tools">نوشت‌افزار</Link><Link href="/products?category=notebooks-paper">دفتر و کاغذ</Link></div>
          <div><strong>راهنما</strong><Link href="/cart">سبد خرید</Link><Link href="/account">حساب کاربری</Link><Link href="/orders">پیگیری سفارش</Link></div>
        </nav>
        <div className="site-footer-contact">
          <strong>پشتیبانی نورا</strong>
          <p>شنبه تا پنجشنبه، ۹ تا ۱۸<br />همراه شما از انتخاب تا تحویل</p>
          <a href="mailto:hello@example.com">hello@example.com</a>
        </div>
      </div>
      <div className="site-footer-bottom"><span>© ۱۴۰۵ نورا</span><span>پرداخت امن و ارسال لوازم تحریر به سراسر ایران</span></div>
    </footer>
  );
}
