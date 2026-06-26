import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** Tailwind-aware className merge. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Backend origin (strip the trailing /api or /api/v1 from the configured URL),
// used to resolve relative /media/... image paths the API returns.
const MEDIA_ORIGIN = (
  process.env.NEXT_PUBLIC_API_ROOT_URL ?? "http://localhost:8000/api"
).replace(/\/api(\/v\d+)?\/?$/, "");

/** Resolve a possibly-relative media URL to an absolute backend URL. */
export function mediaUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  if (/^https?:\/\//i.test(url) || url.startsWith("data:")) return url;
  return `${MEDIA_ORIGIN}${url.startsWith("/") ? "" : "/"}${url}`;
}

/** Format a decimal string / number as currency. */
export function formatCurrency(
  value: string | number | null | undefined,
  currency = "USD",
): string {
  const num = typeof value === "string" ? parseFloat(value) : (value ?? 0);
  if (Number.isNaN(num)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(num);
}

/** Compact number, e.g. 12_500 → "12.5K". */
export function formatCompact(value: number | string | null | undefined): string {
  const num = typeof value === "string" ? parseFloat(value) : (value ?? 0);
  if (Number.isNaN(num)) return "—";
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(num);
}

export function formatNumber(value: number | string | null | undefined): string {
  const num = typeof value === "string" ? parseFloat(value) : (value ?? 0);
  if (Number.isNaN(num)) return "—";
  return new Intl.NumberFormat("en-US").format(num);
}

export function formatPercent(value: number | string | null | undefined): string {
  const num = typeof value === "string" ? parseFloat(value) : (value ?? 0);
  if (Number.isNaN(num)) return "—";
  return `${num.toFixed(1)}%`;
}

/** Human date, e.g. "Jun 18, 2026". */
export function formatDate(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateTime(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Relative time, e.g. "3 hours ago". */
export function timeAgo(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value).getTime();
  if (Number.isNaN(d)) return "—";
  const diff = Date.now() - d;
  const sec = Math.round(diff / 1000);
  const min = Math.round(sec / 60);
  const hr = Math.round(min / 60);
  const day = Math.round(hr / 24);
  if (sec < 60) return "just now";
  if (min < 60) return `${min}m ago`;
  if (hr < 24) return `${hr}h ago`;
  if (day < 30) return `${day}d ago`;
  return formatDate(value);
}

export function initials(name?: string | null): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function titleCase(value?: string | null): string {
  if (!value) return "";
  return value
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function truncate(value: string, len = 60): string {
  return value.length > len ? `${value.slice(0, len)}…` : value;
}

/** Build a querystring from a record, skipping empty values. */
export function toQuery(params: Record<string, unknown>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

export function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
