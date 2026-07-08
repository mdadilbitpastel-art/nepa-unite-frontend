/**
 * API service layer. Every call maps 1:1 to a backend endpoint
 * (see backend/FRONTEND_API.md). Mind trailing slashes:
 *  - router endpoints (members, products, cart, orders, wishlist, reviews,
 *    addresses, jobs, commissions) END WITH "/"
 *  - hand-written endpoints (/auth/*, /payments/*, /sellers/onboard,
 *    /orders/{id}/invoice) have NO trailing slash.
 */
import { http } from "@/lib/axios";
import { API_ROOT_URL } from "@/lib/constants";
import { toQuery } from "@/lib/utils";
import type {
  Address,
  Cart,
  Category,
  Commission,
  CommissionRate,
  CommissionSummary,
  Invoice,
  Job,
  Member,
  Order,
  OrderStatus,
  Payment,
  PaymentConfig,
  PaymentIntentResponse,
  PaymentSyncResponse,
  Product,
  ProductReview,
  ProductSearchResponse,
  RegisterResponse,
  ReturnReason,
  ReturnRequest,
  ReturnStatus,
  ReturnType,
  Role,
  VerticalType,
  WishlistItem,
} from "@/types";

// ─── Auth ────────────────────────────────────────────────────────────
export const authService = {
  register: (body: {
    email: string;
    password: string;
    role: Extract<Role, "buyer" | "seller">;
    business_name?: string;
    vertical_type?: VerticalType;
  }) => http.post<RegisterResponse>("/auth/register", body),

  forgotPassword: (email: string) =>
    http.post<void>("/auth/forgot-password", { email }),

  resetPassword: (body: { uid: string; token: string; new_password: string }) =>
    http.post<void>("/auth/reset-password", body),

  logout: (refresh_token: string) =>
    http.post<void>("/auth/logout", { refresh_token }),
};

// ─── Members / Profile ───────────────────────────────────────────────
export const memberService = {
  list: (params?: Record<string, unknown>) =>
    http.get<Member[]>(`/members/${toQuery(params ?? {})}`),
  get: (id: string) => http.get<Member>(`/members/${id}/`),
  update: (id: string, body: Partial<Member>) =>
    http.patch<Member>(`/members/${id}/`, body),

  // Admin
  adminList: (params?: Record<string, unknown>) =>
    http.get<Member[]>(`/admin/members/${toQuery(params ?? {})}`),
  adminGet: (id: string) => http.get<Member>(`/admin/members/${id}/`),
  approve: (id: string) => http.post<Member>(`/admin/members/${id}/approve/`),
  suspend: (id: string) => http.post<Member>(`/admin/members/${id}/suspend/`),
};

// ─── Addresses ───────────────────────────────────────────────────────
export const addressService = {
  list: () => http.get<Address[]>("/addresses/"),
  create: (body: Omit<Address, "id" | "created_at" | "updated_at">) =>
    http.post<Address>("/addresses/", body),
  update: (id: string, body: Partial<Address>) =>
    http.patch<Address>(`/addresses/${id}/`, body),
  remove: (id: string) => http.delete<void>(`/addresses/${id}/`),
  setDefault: (id: string) =>
    http.post<Address>(`/addresses/${id}/set-default/`),
};

// ─── Products ────────────────────────────────────────────────────────
export type ProductSort =
  | "relevance"
  | "price_asc"
  | "price_desc"
  | "rating_desc"
  | "newest"
  | "discount_desc";

export interface ProductSearchParams {
  q?: string;
  category?: string;
  region?: string;
  brand?: string;
  price_min?: number;
  price_max?: number;
  min_rating?: number;
  contract_status?: string;
  in_stock?: boolean;
  sort?: ProductSort;
  page?: number;
  page_size?: number;
}

export const productService = {
  list: (params?: Record<string, unknown>) =>
    http.get<Product[]>(`/products/${toQuery(params ?? {})}`),
  get: (id: string) => http.get<Product>(`/products/${id}/`),
  create: (body: Partial<Product>) => http.post<Product>("/products/", body),
  update: (id: string, body: Partial<Product>) =>
    http.patch<Product>(`/products/${id}/`, body),
  remove: (id: string) => http.delete<void>(`/products/${id}/`),

  search: (params: ProductSearchParams) =>
    http
      .get<{
        total: number;
        page: number;
        page_size: number;
        items: Product[];
      }>(`/products/search/${toQuery(params as Record<string, unknown>)}`)
      .then(
        (r): ProductSearchResponse => ({
          count: r.total,
          page: r.page,
          page_size: r.page_size,
          results: r.items ?? [],
        }),
      ),
  categories: () =>
    http
      .get<{ items: { name: string; product_count?: number }[] }>(
        "/products/categories/",
      )
      .then((r): Category[] =>
        (r.items ?? []).map((c) => ({
          category: c.name,
          count: c.product_count,
        })),
      ),
  brands: () =>
    http
      .get<{ items: { name: string; product_count?: number }[] }>(
        "/products/brands/",
      )
      .then((r): { brand: string; count?: number }[] =>
        (r.items ?? []).map((b) => ({
          brand: b.name,
          count: b.product_count,
        })),
      ),
  bySeller: (sellerId: string, params?: Record<string, unknown>) =>
    http
      .get<{ total: number; page: number; page_size: number; items: Product[] }>(
        `/products/by-seller/${sellerId}/${toQuery(params ?? {})}`,
      )
      .then((r) => r.items ?? []),

  bulkUpload: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return http.post<Job>("/products/bulk-upload/", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  reviews: (productId: string) =>
    http
      .get<{ average_rating: number; count: number; items: ProductReview[] }>(
        `/products/${productId}/reviews/`,
      )
      .then((r) => r.items ?? []),
  addReview: (
    productId: string,
    body: { product: string; rating: number; title: string; body: string },
  ) => http.post<ProductReview>(`/products/${productId}/reviews/`, body),
};

// ─── Wishlist ────────────────────────────────────────────────────────
export const wishlistService = {
  list: () => http.get<WishlistItem[]>("/wishlist/"),
  add: (product: string) => http.post<WishlistItem>("/wishlist/", { product }),
  remove: (id: string) => http.delete<void>(`/wishlist/${id}/`),
};

// ─── Cart ────────────────────────────────────────────────────────────
export const cartService = {
  get: () => http.get<Cart>("/cart/"),
  addItem: (product_id: string, quantity: number) =>
    http.post<Cart>("/cart/items/", { product_id, quantity }),
  updateItem: (itemId: string, quantity: number) =>
    http.patch<Cart>(`/cart/items/${itemId}/`, { quantity }),
  removeItem: (itemId: string) => http.delete<Cart>(`/cart/items/${itemId}/`),
  clear: () => http.post<Cart>("/cart/clear/"),
  checkout: (
    body:
      | { address_id: string }
      | {
          shipping_name: string;
          shipping_phone: string;
          shipping_address_line1: string;
          shipping_address_line2?: string;
          shipping_city: string;
          shipping_state: string;
          shipping_zip: string;
          buyer_notes?: string;
        },
  ) => http.post<Order>("/cart/checkout/", body),
};

// ─── Orders ──────────────────────────────────────────────────────────
export const orderService = {
  list: (params?: Record<string, unknown>) =>
    http.get<Order[]>(`/orders/${toQuery(params ?? {})}`),
  get: (id: string) => http.get<Order>(`/orders/${id}/`),
  create: (body: {
    items: { product_id: string; quantity: number }[];
    shipping_name: string;
    shipping_phone: string;
    shipping_address_line1: string;
    shipping_address_line2?: string;
    shipping_city: string;
    shipping_state: string;
    shipping_zip: string;
    buyer_notes?: string;
  }) => http.post<Order>("/orders/", body),
  updateStatus: (id: string, status: OrderStatus) =>
    http.patch<Order>(`/orders/${id}/status/`, { status }),
  invoice: (orderId: string) =>
    http.get<Invoice>(`/orders/${orderId}/invoice`),
};

export const returnService = {
  list: (params?: Record<string, unknown>) =>
    http.get<ReturnRequest[]>(`/returns/${toQuery(params ?? {})}`),
  get: (id: string) => http.get<ReturnRequest>(`/returns/${id}/`),
  create: (body: {
    order_item: string;
    type: ReturnType;
    reason: ReturnReason;
    reason_note?: string;
    quantity?: number;
    exchange_product?: string | null;
  }) => http.post<ReturnRequest>("/returns/", body),
  updateStatus: (
    id: string,
    body: { status: ReturnStatus; note?: string; pickup_scheduled_at?: string },
  ) => http.patch<ReturnRequest>(`/returns/${id}/status/`, body),
};

// ─── Payments ────────────────────────────────────────────────────────
export const paymentService = {
  config: () => http.get<PaymentConfig>("/payments/config"),
  createIntent: (order_id: string) =>
    http.post<PaymentIntentResponse>("/payments/intent", { order_id }),
  /**
   * Reconcile a payment with Stripe after `confirmPayment`. Required in test
   * mode where no webhook is configured — flips the order to Confirmed once the
   * PaymentIntent has succeeded. Idempotent (safe to call more than once).
   */
  sync: (orderId: string) =>
    http.post<PaymentSyncResponse>(`/payments/${orderId}/sync`),
  forOrder: (orderId: string) => http.get<Payment[]>(`/payments/${orderId}`),
  disburse: (order_item_id: string) =>
    http.post<void>("/payments/disburse", { order_item_id }),
  onboardSeller: () =>
    http.post<{ onboarding_url: string }>("/sellers/onboard", {}),
};

// ─── Commissions (admin) ─────────────────────────────────────────────
export const commissionService = {
  list: (params?: { status?: string; seller?: string }) =>
    http.get<Commission[]>(`/commissions/${toQuery(params ?? {})}`),
  summary: () => http.get<CommissionSummary>("/commissions/summary/"),
  rates: () => http.get<CommissionRate[]>("/commissions/rates/"),
  createRate: (body: { category: string; percent: string; min_fee?: string }) =>
    http.post<CommissionRate>("/commissions/rates/", body),
  updateRate: (id: string, body: Partial<CommissionRate>) =>
    http.patch<CommissionRate>(`/commissions/rates/${id}/`, body),
  deleteRate: (id: string) => http.delete<void>(`/commissions/rates/${id}/`),
};

// ─── Jobs ────────────────────────────────────────────────────────────
export const jobService = {
  get: (id: string) => http.get<Job>(`/jobs/${id}/`),
};

// ─── Health (root /api, not /api/v1) ─────────────────────────────────
export const systemService = {
  health: () =>
    fetch(`${API_ROOT_URL}/health/`, { cache: "no-store" }).then((r) =>
      r.json(),
    ),
};
