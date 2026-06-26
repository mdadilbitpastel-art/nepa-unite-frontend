/**
 * NEPA Unite — domain types.
 * Mirrors the backend REST contract (see backend/FRONTEND_API.md).
 * Money values are decimal strings ("50.00"); IDs are UUID strings.
 */

export type UUID = string;
export type DecimalString = string;
export type ISODate = string;

// ─── Enums ───────────────────────────────────────────────────────────
export type Role = "buyer" | "seller" | "admin" | "auditor";

export type AccountStatus = "pending" | "active" | "suspended";

export type OrderStatus =
  | "draft"
  | "confirmed"
  | "fulfillment"
  | "shipped"
  | "delivered"
  | "closed"
  | "cancelled";

export type PaymentStatus =
  | "pending"
  | "completed"
  | "failed"
  | "refunded"
  | "disputed";

export type FulfillmentStatus = "pending" | "fulfilled" | "cancelled";

export type CommissionStatus = "pending" | "earned" | "reversed";

export type ProductStatus = "active" | "inactive" | "deleted";

export const VERTICAL_TYPES = [
  "automotive",
  "architectural",
  "construction",
  "dental",
  "dry_cleaning",
  "education",
  "electronics",
  "food_beverage",
  "healthcare",
  "hospitality",
  "law_office",
  "logistics",
  "manufacturing",
  "real_estate",
  "retail",
  "technology",
  "textiles",
  "wholesale",
  "other",
] as const;

export type VerticalType = (typeof VERTICAL_TYPES)[number];

// ─── Auth ────────────────────────────────────────────────────────────
export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface RegisterResponse {
  id: UUID;
  email: string;
  role: Role;
  status: AccountStatus;
}

// ─── Users / Tenant ──────────────────────────────────────────────────
export interface Tenant {
  id: UUID;
  name: string;
  vertical_type: VerticalType;
  status: AccountStatus;
}

export interface Member {
  id: UUID;
  email: string;
  role: Role;
  status: AccountStatus;
  tenant?: Tenant | null;
  first_name?: string;
  last_name?: string;
  stripe_account_id?: string | null;
  created_at: ISODate;
  updated_at: ISODate;
}

// ─── Addresses ───────────────────────────────────────────────────────
export interface Address {
  id: UUID;
  label: string;
  recipient_name: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  is_default: boolean;
  created_at?: ISODate;
  updated_at?: ISODate;
}

// ─── Products ────────────────────────────────────────────────────────
export interface ProductImage {
  id: UUID;
  url: string;
  is_primary: boolean;
}

export interface Product {
  id: UUID;
  tenant: UUID;
  seller: UUID;
  sku: string;
  name: string;
  description: string;
  price: DecimalString;
  /** Max retail / reference price. When > price the storefront shows a strike + discount %. */
  mrp?: DecimalString | null;
  attributes: Record<string, unknown>;
  inventory_count: number;
  min_order_qty: number;
  status: ProductStatus;
  primary_image_url?: string | null;
  images?: ProductImage[];
  /** Aggregate review rating (0–5) and number of reviews, annotated by the API. */
  rating_avg?: number;
  review_count?: number;
  created_at: ISODate;
  updated_at: ISODate;
}

export interface ProductSearchResponse {
  count: number;
  page: number;
  page_size: number;
  results: Product[];
}

export interface Category {
  category: string;
  count?: number;
}

export interface ProductReview {
  id: UUID;
  product: UUID;
  rating: number;
  title: string;
  body: string;
  user?: UUID;
  created_at: ISODate;
}

export interface WishlistItem {
  id: UUID;
  product: UUID | Product;
  // Flat fields the API returns alongside the product id.
  product_name?: string;
  product_price?: DecimalString;
  product_image_url?: string | null;
  created_at?: ISODate;
}

// ─── Cart ────────────────────────────────────────────────────────────
export interface CartItem {
  id: UUID;
  product: UUID;
  product_name: string;
  product_sku: string;
  product_min_order_qty?: number;
  product_image_url?: string | null;
  quantity: number;
  unit_price: DecimalString;
  line_total: DecimalString;
  updated_at: ISODate;
}

export interface Cart {
  id: UUID;
  items: CartItem[];
  total: DecimalString;
  item_count: number;
  updated_at: ISODate;
}

// ─── Orders ──────────────────────────────────────────────────────────
export interface OrderItem {
  id: UUID;
  product: UUID;
  product_name?: string;
  seller: UUID;
  quantity: number;
  unit_price: DecimalString;
  fulfillment_status: FulfillmentStatus;
}

export interface Order {
  id: UUID;
  buyer: UUID;
  tenant: UUID;
  status: OrderStatus;
  total_amount: DecimalString;
  shipping_name: string;
  shipping_phone: string;
  shipping_address_line1: string;
  shipping_address_line2?: string;
  shipping_city: string;
  shipping_state: string;
  shipping_zip: string;
  buyer_notes?: string;
  stripe_payment_intent_id?: string;
  items: OrderItem[];
  created_at: ISODate;
  updated_at: ISODate;
}

// ─── Payments ────────────────────────────────────────────────────────
export interface PaymentConfig {
  publishable_key: string;
  currency: string;
  platform_fee_percent: number;
  configured: boolean;
}

export interface Payment {
  id: UUID;
  order: UUID;
  stripe_payment_intent_id: string;
  amount: DecimalString;
  platform_fee: DecimalString;
  status: PaymentStatus;
  disbursed_at?: ISODate | null;
  created_at: ISODate;
}

export interface PaymentIntentResponse {
  client_secret: string;
  payment_intent_id: string;
}

// ─── Commissions ─────────────────────────────────────────────────────
export interface Commission {
  id: UUID;
  order: UUID;
  order_item: UUID;
  seller: UUID;
  seller_email: string;
  category: string;
  base_amount: DecimalString;
  rate_percent: DecimalString;
  commission_amount: DecimalString;
  status: CommissionStatus;
  earned_at?: ISODate | null;
  reversed_at?: ISODate | null;
  created_at: ISODate;
}

export interface CommissionSummary {
  pending: { total: DecimalString; count: number };
  earned: { total: DecimalString; count: number };
  reversed: { total: DecimalString; count: number };
  earned_total: DecimalString;
}

export interface CommissionRate {
  id: UUID;
  category: string;
  percent: DecimalString;
  min_fee: DecimalString;
  is_active: boolean;
  created_at: ISODate;
  updated_at: ISODate;
}

// ─── Invoices ────────────────────────────────────────────────────────
export interface Invoice {
  id: UUID;
  order: UUID;
  invoice_number: string;
  s3_key: string;
  pre_signed_url: string;
  pre_signed_url_expires_at: ISODate;
  created_at: ISODate;
}

// ─── Jobs (bulk upload) ──────────────────────────────────────────────
export interface Job {
  id: UUID;
  status: "queued" | "running" | "success" | "failed" | "done";
  result?: Record<string, unknown>;
  errors?: string[];
  created_at?: ISODate;
}

// ─── Generic API helpers ─────────────────────────────────────────────
export interface ApiErrorShape {
  detail?: string;
  [field: string]: string[] | string | undefined;
}

export interface Paginated<T> {
  count: number;
  page: number;
  page_size: number;
  results: T[];
}
