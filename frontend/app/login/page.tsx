"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

import { AccountShell } from "@/components/account-shell";
import { api, Customer } from "@/lib/api";

export default function LoginPage() {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const customer = await api<Customer>("/api/v1/accounts/login/", {
        method: "POST",
        body: JSON.stringify({ email: form.get("email"), password: form.get("password") }),
      });
      window.localStorage.setItem("customer", JSON.stringify(customer));
      window.location.assign(new URL("/products", window.location.href).toString());
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "ورود انجام نشد.");
    } finally {
      setPending(false);
    }
  }

  return (
    <AccountShell eyebrow="حساب مشتری" title="ورود به فروشگاه">
      <form onSubmit={submit}>
        <label>ایمیل<input name="email" type="email" autoComplete="email" required /></label>
        <label>رمز عبور<input name="password" type="password" autoComplete="current-password" required /></label>
        {error && <p className="error" role="alert">{error}</p>}
        <button disabled={pending}>{pending ? "در حال ورود…" : "ورود"}</button>
      </form>
      <div className="form-links">
        <Link href="/register">ساخت حساب</Link>
        <Link href="/forgot-password">فراموشی رمز عبور</Link>
      </div>
    </AccountShell>
  );
}
