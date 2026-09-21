import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="about-page">
      <section className="about-hero">
        <div className="about-hero-copy">
          <p className="eyebrow">داستان نورا</p>
          <h1>برای چیزهایی که هر روز، <em>با شما هستند.</em></h1>
          <p>نورا از یک میز ساده شروع شد؛ جایی برای نوشتن، فکر کردن، ساختن و دوباره شروع کردن. ما لوازم تحریر و ابزارهای خلاقیت را با وسواس انتخاب می‌کنیم تا خرید روزمره، شخصی‌تر و دلنشین‌تر شود.</p>
          <div className="about-hero-actions"><Link className="button-primary" href="/products">دیدن انتخاب‌ها</Link><a className="button-quiet" href="#values">چرا نورا؟</a></div>
        </div>
        <div className="about-hero-art" aria-hidden="true"><span className="about-art-ring" /><span className="about-art-note">WRITE<br />MAKE<br />KEEP</span><span className="about-art-pencil" /></div>
      </section>
      <section className="about-intro" id="values">
        <div><p className="eyebrow">نگاه ما</p><h2>کمتر، اما بهتر انتخاب می‌کنیم.</h2></div>
        <p>قرار نیست هر چیزی در قفسه ما باشد. هر محصول باید کاربردی، خوش‌ساخت و ارزشمند برای ماندن روی میز شما باشد؛ از یک خودکار روان تا دفتری که ایده‌های بزرگ در آن شروع می‌شوند.</p>
      </section>
      <section className="about-values" aria-label="ارزش‌های نورا">
        <article><span>۰۱</span><h3>انتخاب با دقت</h3><p>کیفیت، کاربرد و حس خوب استفاده، معیارهای ما برای هر محصول است.</p></article>
        <article><span>۰۲</span><h3>سادگی در خرید</h3><p>دسته‌بندی روشن، اطلاعات قابل فهم و تجربه‌ای بدون شلوغی اضافه.</p></article>
        <article><span>۰۳</span><h3>همراهی واقعی</h3><p>از انتخاب تا تحویل، اگر سوالی داشته باشید یک آدم واقعی پاسخ‌گوست.</p></article>
      </section>
      <section className="about-process">
        <div className="about-process-heading"><p className="eyebrow">تجربه نورا</p><h2>یک انتخاب خوب،<br />آرام شروع می‌شود.</h2></div>
        <ol><li><strong>کشف کنید</strong><span>دسته‌ای را انتخاب کنید و بین ابزارهای کاربردی بگردید.</span></li><li><strong>با خیال راحت انتخاب کنید</strong><span>ویژگی‌ها و گزینه‌های هر محصول را واضح ببینید.</span></li><li><strong>با ما ادامه دهید</strong><span>سفارش را پیگیری کنید و هر وقت خواستید به انتخاب‌های ذخیره‌شده برگردید.</span></li></ol>
      </section>
      <section className="about-cta"><span className="about-cta-mark" aria-hidden="true">✎</span><p className="eyebrow">حالا نوبت شماست</p><h2>صفحه بعدی را با چه چیزی شروع می‌کنید؟</h2><Link className="button-primary" href="/products">ورود به قفسه نورا</Link></section>
    </main>
  );
}
