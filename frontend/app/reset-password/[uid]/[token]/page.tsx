"use client";

import { useParams, useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { AccountShell } from "@/components/account-shell";
import { api } from "@/lib/api";

export default function ResetPasswordPage() {
  const params = useParams<{ uid: string; token: string }>();
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      await api("/api/v1/accounts/password-reset/confirm/", {
        method: "POST",
        body: JSON.stringify({ uid: params.uid, token: params.token, password: form.get("password") }),
      });
      router.replace("/login");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "تغییر رمز انجام نشد.");
    } finally {
      setPending(false);
    }
  }

  return (
    <AccountShell eyebrow="امنیت حساب" title="رمز عبور تازه">
      <form onSubmit={submit}>
        <label>رمز عبور تازه<input name="password" type="password" autoComplete="new-password" minLength={8} required /></label>
        {error && <p className="error" role="alert">{error}</p>}
        <button disabled={pending}>{pending ? "در حال ثبت…" : "ثبت رمز تازه"}</button>
      </form>
    </AccountShell>
  );
}
