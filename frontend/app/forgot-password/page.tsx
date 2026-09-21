"use client";

import { FormEvent, useState } from "react";

import { AccountShell } from "@/components/account-shell";
import { api } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      await api("/api/v1/accounts/password-reset/", {
        method: "POST",
        body: JSON.stringify({ email: form.get("email") }),
      });
      setMessage("اگر این ایمیل ثبت شده باشد، پیوند بازیابی ارسال می‌شود.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "درخواست انجام نشد.");
    } finally {
      setPending(false);
    }
  }

  return (
    <AccountShell eyebrow="برگشت به میز شما" title="رمز عبور را فراموش کرده‌اید؟">
      <p>ایمیل حساب را وارد کنید تا مسیر انتخاب رمز تازه را برایتان بفرستیم.</p>
      <form onSubmit={submit}>
        <label>ایمیل<input name="email" type="email" autoComplete="email" required /></label>
        {message && <p className="success" role="status">{message}</p>}
        {error && <p className="error" role="alert">{error}</p>}
        <button disabled={pending}>{pending ? "در حال ارسال…" : "ارسال پیوند"}</button>
      </form>
    </AccountShell>
  );
}
