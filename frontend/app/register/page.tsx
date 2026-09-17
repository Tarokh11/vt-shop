"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

import { AccountShell } from "@/components/account-shell";
import { api, Customer } from "@/lib/api";

export default function RegisterPage() {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const customer = await api<Customer>("/api/v1/accounts/register/", {
        method: "POST",
        body: JSON.stringify({
          email: form.get("email"),
          password: form.get("password"),
          first_name: form.get("first_name"),
          last_name: form.get("last_name"),
        }),
      });
      window.localStorage.setItem("customer", JSON.stringify(customer));
      window.location.assign(new URL("/products", window.location.href).toString());
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "ثبت‌نام انجام نشد.");
    } finally {
      setPending(false);
    }
  }

  return (
    <AccountShell eyebrow="عضویت" title="حساب تازه بسازید">
      <form onSubmit={submit}>
        <div className="field-row">
          <label>نام<input name="first_name" autoComplete="given-name" /></label>
          <label>نام خانوادگی<input name="last_name" autoComplete="family-name" /></label>
        </div>
        <label>ایمیل<input name="email" type="email" autoComplete="email" required /></label>
        <label>رمز عبور<input name="password" type="password" autoComplete="new-password" minLength={8} required /></label>
        <p className="hint">حداقل ۸ نویسه و غیرقابل حدس انتخاب کنید.</p>
        {error && <p className="error" role="alert">{error}</p>}
        <button disabled={pending}>{pending ? "در حال ساخت…" : "ساخت حساب"}</button>
      </form>
      <div className="form-links"><Link href="/login">حساب دارید؟ وارد شوید</Link></div>
    </AccountShell>
  );
}
