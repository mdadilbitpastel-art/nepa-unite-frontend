import type { Role, OrderStatus, PaymentStatus, CommissionStatus } from "@/types";

export const APP_NAME = "NEPA Unite";
export const APP_TAGLINE = "The B2B marketplace for Northeastern Pennsylvania";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";
export const API_ROOT_URL =
  process.env.NEXT_PUBLIC_API_ROOT_URL ?? "http://localhost:8000/api";

/**
 * External "Become a seller" sign-up page served by the Django backend.
 * Defaults to the local backend; set NEXT_PUBLIC_SIGNUP_URL to the deployed
 * host (e.g. https://nepa-unite-mtii.onrender.com/signup/) in production.
 */
export const SIGNUP_URL =
  process.env.NEXT_PUBLIC_SIGNUP_URL ?? "http://localhost:8000/signup/";

/**
 * Landing route after login. This is a public storefront with no role
 * dashboards, so every role lands on the home page.
 */
export const ROLE_HOME: Record<Role, string> = {
  buyer: "/",
  seller: "/",
  admin: "/",
  auditor: "/",
};

export const ROLE_LABEL: Record<Role, string> = {
  buyer: "Buyer",
  seller: "Seller",
  admin: "Administrator",
  auditor: "Auditor",
};

// ─── Status → badge variant mapping ──────────────────────────────────
export const ORDER_STATUS_VARIANT: Record<
  OrderStatus,
  "default" | "info" | "success" | "warning" | "danger" | "muted" | "teal"
> = {
  draft: "muted",
  confirmed: "info",
  fulfillment: "warning",
  shipped: "teal",
  delivered: "success",
  closed: "default",
  cancelled: "danger",
};

export const PAYMENT_STATUS_VARIANT: Record<
  PaymentStatus,
  "default" | "info" | "success" | "warning" | "danger" | "muted"
> = {
  pending: "warning",
  completed: "success",
  failed: "danger",
  refunded: "muted",
  disputed: "danger",
};

export const COMMISSION_STATUS_VARIANT: Record<
  CommissionStatus,
  "default" | "info" | "success" | "warning" | "danger" | "muted"
> = {
  pending: "warning",
  earned: "success",
  reversed: "muted",
};

/** Ordered order-lifecycle for timelines. */
export const ORDER_LIFECYCLE: OrderStatus[] = [
  "draft",
  "confirmed",
  "fulfillment",
  "shipped",
  "delivered",
  "closed",
];

export const DEFAULT_PAGE_SIZE = 20;
