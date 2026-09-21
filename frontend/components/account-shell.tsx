import Link from "next/link";

export function AccountShell({
  eyebrow,
  title,
  children,
}: Readonly<{ eyebrow: string; title: string; children: React.ReactNode }>) {
  return (
    <main className="account-shell">
      <div className="account-shell-art" aria-hidden="true"><span /><i /><b>✦</b></div>
      <section className="account-card">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        {children}
      </section>
      <Link className="back-link" href="/">بازگشت به میز نورا</Link>
    </main>
  );
}
