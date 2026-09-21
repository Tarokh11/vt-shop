"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import { api, ApiError, Customer } from "@/lib/api";
import { Favorite } from "@/lib/cart";

export default function AccountPage() {
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    api<Customer>("/api/v1/accounts/me/")
      .then((profile) => setCustomer(profile))
      .catch((reason) => {
        if (reason instanceof ApiError && reason.status === 403) router.replace("/login");
        else setError("دریافت اطلاعات حساب ناموفق بود.");
      })
      .finally(() => setLoading(false));
    api<Favorite[]>("/api/v1/accounts/favorites/")
      .then(setFavorites)
      .catch(() => setFavorites([]));
  }, [router]);

  async function update(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const updated = await api<Customer>("/api/v1/accounts/me/", {
        method: "PATCH",
        body: JSON.stringify({
          first_name: form.get("first_name"), last_name: form.get("last_name"),
          phone: form.get("phone"), address: form.get("address"), shipping_region: form.get("shipping_region"),
        }),
      });
      setCustomer(updated);
      window.localStorage.setItem("customer", JSON.stringify(updated));
      window.dispatchEvent(new Event("customer-auth-changed"));
      setMessage("اطلاعات حساب ذخیره شد.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "ذخیره انجام نشد.");
    }
  }

  async function removeFavorite(productId: number) {
    try {
      await api(`/api/v1/accounts/favorites/${productId}/`, { method: "DELETE" });
      setFavorites((current) => current.filter((favorite) => favorite.product.id !== productId));
    } catch {
      setError("حذف از علاقه‌مندی‌ها انجام نشد.");
    }
  }

  async function signOut() {
    await api("/api/v1/accounts/logout/", { method: "POST" });
    window.localStorage.removeItem("customer");
    window.dispatchEvent(new Event("customer-auth-changed"));
    router.replace("/login");
  }

  if (loading) return <main><p role="status">در حال آماده‌سازی فضای حساب شما…</p></main>;
  if (!customer) return <main><p className="error" role="alert">دریافت حساب کاربری ناموفق بود.</p></main>;

  return (
    <main className="account-dashboard">
      <header className="account-welcome">
        <div><p className="eyebrow">گوشه شخصی شما</p><h1>{customer.first_name ? `${customer.first_name}، خوش آمدید` : "حساب من"}</h1><p>سفارش‌ها، نشانی و انتخاب‌هایی که برای میزتان کنار گذاشته‌اید.</p></div>
        <button className="secondary" type="button" onClick={signOut}>خروج از حساب</button>
      </header>
      {error && <p className="error" role="alert">{error}</p>}
      <nav className="account-shortcuts" aria-label="دسترسی سریع حساب">
        <Link href="/orders"><span>۰۱</span><strong>سفارش‌های من</strong><small>پیگیری و مشاهده سفارش‌ها</small></Link>
        <a href="#favorites"><span>۰۲</span><strong>علاقه‌مندی‌ها</strong><small>{favorites.length} انتخاب ذخیره‌شده</small></a>
        <Link href="/products"><span>۰۳</span><strong>ادامه خرید</strong><small>کشف محصولات تازه</small></Link>
      </nav>
      <div className="account-columns">
        <section className="account-panel account-profile-panel">
          <div className="account-panel-heading"><div><p className="eyebrow">اطلاعات پایه</p><h2>پروفایل و ارسال</h2></div><span className="account-avatar" aria-hidden="true">{(customer.first_name || customer.email).slice(0, 1).toUpperCase()}</span></div>
          <form onSubmit={update}>
            <div className="field-row"><label>نام<input name="first_name" defaultValue={customer.first_name} autoComplete="given-name" /></label><label>نام خانوادگی<input name="last_name" defaultValue={customer.last_name} autoComplete="family-name" /></label></div>
            <label>ایمیل<input value={customer.email} disabled /></label>
            <label>شماره تماس<input name="phone" defaultValue={customer.phone} inputMode="tel" autoComplete="tel" /></label>
            <label>آدرس پیش‌فرض<textarea name="address" defaultValue={customer.address} autoComplete="street-address" /></label>
            <label>منطقه ارسال پیش‌فرض<select name="shipping_region" defaultValue={customer.shipping_region}><option value="">انتخاب نشده</option><option value="TEHRAN">تهران</option><option value="OUTSIDE_TEHRAN">خارج از تهران (پست)</option></select></label>
            {message && <p className="success" role="status">{message}</p>}
            <button>ذخیره تغییرات</button>
          </form>
        </section>
        <section className="account-panel account-note-panel"><span className="account-note-mark" aria-hidden="true">✎</span><p className="eyebrow">خرید راحت‌تر</p><h2>ایده‌های بعدی را همین‌جا نگه دارید.</h2><p>دفترها و ابزارهایی که دوست دارید ذخیره کنید تا هر وقت خواستید دوباره به آن‌ها سر بزنید.</p><Link className="button-primary" href="/products">رفتن به قفسه‌ها</Link></section>
      </div>
      <section className="account-panel favorites-panel" id="favorites"><div className="account-panel-heading"><div><p className="eyebrow">انتخاب‌های شما</p><h2>علاقه‌مندی‌ها</h2></div><span className="favorites-count">{favorites.length} مورد</span></div>{favorites.length === 0 ? <div className="favorites-empty"><span aria-hidden="true">♡</span><p>هنوز چیزی ذخیره نکرده‌اید.</p><Link href="/products">پیدا کردن یک انتخاب تازه</Link></div> : <div className="favorite-grid">{favorites.map((favorite) => <article className="favorite-card" key={favorite.id}><Link href={`/products/${favorite.product.slug}`} className="favorite-image">{favorite.product.image ? <Image src={favorite.product.image} alt={favorite.product.name} width={320} height={240} /> : <span>بدون تصویر</span>}</Link><div><Link href={`/products/${favorite.product.slug}`}><strong>{favorite.product.name}</strong></Link><button type="button" className="favorite-remove" onClick={() => removeFavorite(favorite.product.id)}>حذف</button></div></article>)}</div>}</section>
    </main>
  );
}
