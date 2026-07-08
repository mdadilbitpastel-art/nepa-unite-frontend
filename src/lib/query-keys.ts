/** Centralized TanStack Query keys for cache consistency. */
export const qk = {
  me: ["me"] as const,
  members: (params?: unknown) => ["members", params] as const,
  member: (id: string) => ["member", id] as const,
  adminMembers: (params?: unknown) => ["admin", "members", params] as const,

  products: (params?: unknown) => ["products", params] as const,
  product: (id: string) => ["product", id] as const,
  productSearch: (params?: unknown) => ["products", "search", params] as const,
  categories: ["categories"] as const,
  brands: ["brands"] as const,
  productsBySeller: (sellerId: string, params?: unknown) =>
    ["products", "by-seller", sellerId, params] as const,
  reviews: (productId: string) => ["reviews", productId] as const,

  wishlist: ["wishlist"] as const,
  cart: ["cart"] as const,

  orders: (params?: unknown) => ["orders", params] as const,
  order: (id: string) => ["order", id] as const,
  invoice: (orderId: string) => ["invoice", orderId] as const,

  returns: (params?: unknown) => ["returns", params] as const,
  return: (id: string) => ["return", id] as const,

  payments: (orderId: string) => ["payments", orderId] as const,
  paymentConfig: ["payment-config"] as const,

  commissions: (params?: unknown) => ["commissions", params] as const,
  commissionSummary: ["commissions", "summary"] as const,
  commissionRates: ["commissions", "rates"] as const,

  addresses: ["addresses"] as const,
  job: (id: string) => ["job", id] as const,
  health: ["health"] as const,
};
