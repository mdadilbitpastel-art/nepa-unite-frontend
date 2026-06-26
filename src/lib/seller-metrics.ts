/**
 * Seller-side derived metrics. The backend scopes a seller's orders to those
 * that contain at least one of their order items, but an order's
 * `total_amount` may include other sellers' lines. These helpers compute a
 * seller's share strictly from their own `order.items` lines.
 */
import type { Order, Product } from "@/types";

/** A product is "low stock" when it is at/under its min order qty or below 5. */
export function isLowStock(p: Product): boolean {
  return p.inventory_count <= p.min_order_qty || p.inventory_count < 5;
}

/** Sum of a seller's own line items (unit_price × quantity) across orders. */
export function sellerRevenueFromOrders(
  orders: Order[],
  sellerId: string,
): number {
  let total = 0;
  for (const o of orders) {
    for (const it of o.items ?? []) {
      if (sellerId && it.seller && it.seller !== sellerId) continue;
      total += parseFloat(it.unit_price || "0") * it.quantity;
    }
  }
  return total;
}

/** Revenue contributed by a single order for this seller. */
export function sellerOrderTotal(order: Order, sellerId: string): number {
  let total = 0;
  for (const it of order.items ?? []) {
    if (sellerId && it.seller && it.seller !== sellerId) continue;
    total += parseFloat(it.unit_price || "0") * it.quantity;
  }
  return total;
}

/** Count of this seller's items in an order. */
export function sellerItemCount(order: Order, sellerId: string): number {
  return (order.items ?? []).filter(
    (it) => !sellerId || !it.seller || it.seller === sellerId,
  ).length;
}

export interface SellerSeriesPoint {
  label: string;
  revenue: number;
  orders: number;
  [key: string]: string | number;
}

/** Last 6 months of revenue + order counts, bucketed by created_at. */
export function buildSellerSeries(
  orders: Order[],
  sellerId: string,
): SellerSeriesPoint[] {
  const now = new Date();
  const months = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return {
      key: d.toLocaleString("en-US", { month: "short" }),
      year: d.getFullYear(),
      month: d.getMonth(),
      revenue: 0,
      orders: 0,
    };
  });
  for (const o of orders) {
    const d = new Date(o.created_at);
    const bucket = months.find(
      (m) => m.month === d.getMonth() && m.year === d.getFullYear(),
    );
    if (bucket) {
      bucket.revenue += sellerOrderTotal(o, sellerId);
      bucket.orders += 1;
    }
  }
  return months.map((m) => ({
    label: m.key,
    revenue: Math.round(m.revenue),
    orders: m.orders,
  }));
}
