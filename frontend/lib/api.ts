export type Customer = {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  address: string;
  shipping_region: string;
};

export class ApiError extends Error {
  constructor(
    public status: number,
    public data: Record<string, unknown>,
  ) {
    super(formatApiError(data));
  }
}

function formatApiError(data: Record<string, unknown>): string {
  const messages = Object.values(data).flatMap((value) =>
    Array.isArray(value) ? value.map(String) : [String(value)],
  );
  return messages.join(" ") || "درخواست انجام نشد.";
}

function cookie(name: string): string | undefined {
  const prefix = `${name}=`;
  return document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix))
    ?.slice(prefix.length);
}

async function csrfToken(): Promise<string> {
  const response = await fetch("/api/v1/accounts/csrf/", {
    credentials: "same-origin",
    cache: "no-store",
  });
  if (!response.ok) throw new Error("دریافت مجوز امنیتی ناموفق بود.");
  const token = cookie("csrftoken");
  if (!token) throw new Error("کوکی امنیتی دریافت نشد.");
  return decodeURIComponent(token);
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const method = (init.method ?? "GET").toUpperCase();
  const headers = new Headers(init.headers);
  if (init.body) headers.set("Content-Type", "application/json");
  if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
    headers.set("X-CSRFToken", await csrfToken());
  }
  const response = await fetch(path, {
    ...init,
    method,
    headers,
    credentials: "same-origin",
    cache: init.cache ?? "no-store",
  });
  const data = response.status === 204 ? {} : await response.json().catch(() => ({}));
  if (!response.ok) throw new ApiError(response.status, data as Record<string, unknown>);
  return data as T;
}
