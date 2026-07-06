"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ShoppingBag, Package, ChevronRight, Search } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { ListCardSkeleton, ErrorState } from "@/components/shared/states";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { startNavProgress } from "@/components/shared/navigation-progress";
import { ProductThumb } from "@/components/shop/product-thumb";
import { useOrders } from "@/features/orders/use-orders";
import { formatCurrency, formatDate, titleCase, cn } from "@/lib/utils";
import type { Order, OrderStatus } from "@/types";

/**
 * Status indicator — not a pill/button: a glowing colour dot (relevant per
 * status) beside an uppercase, colour-matched label. Theme tokens only.
 */
const STATUS_STYLE: Record<
  OrderStatus,
  { text: string; dot: string; ring: string }
> = {
  draft: {
    text: "text-muted-foreground",
    dot: "bg-muted-foreground",
    ring: "ring-muted-foreground/20",
  },
  confirmed: { text: "text-brand", dot: "bg-brand", ring: "ring-brand/20" },
  fulfillment: {
    text: "text-warning",
    dot: "bg-warning",
    ring: "ring-warning/25",
  },
  shipped: { text: "text-teal", dot: "bg-teal", ring: "ring-teal/20" },
  delivered: {
    text: "text-success",
    dot: "bg-success",
    ring: "ring-success/20",
  },
  closed: {
    text: "text-foreground",
    dot: "bg-foreground",
    ring: "ring-foreground/15",
  },
  cancelled: { text: "text-danger", dot: "bg-danger", ring: "ring-danger/20" },
};

function StatusPill({ status }: { status: OrderStatus }) {
  const s = STATUS_STYLE[status];
  return (
    <span className="inline-flex items-center gap-2">
      <span className={cn("size-2 rounded-full ring-[3px]", s.dot, s.ring)} />
      <span
        className={cn(
          "text-[11px] font-bold uppercase tracking-[0.08em]",
          s.text,
        )}
      >
        {titleCase(status)}
      </span>
    </span>
  );
}

/** Shopper-facing groupings that hide backend status jargon. */
const TABS: { key: string; label: string; match: (s: OrderStatus) => boolean }[] =
  [
    { key: "all", label: "All", match: () => true },
    {
      key: "active",
      label: "Active",
      match: (s) =>
        s === "draft" ||
        s === "confirmed" ||
        s === "fulfillment" ||
        s === "shipped",
    },
    {
      key: "delivered",
      label: "Delivered",
      match: (s) => s === "delivered" || s === "closed",
    },
    { key: "cancelled", label: "Cancelled", match: (s) => s === "cancelled" },
  ];

export default function BuyerOrdersPage() {
  const { data, isLoading, isError, refetch } = useOrders();
  const [tab, setTab] = useState("all");
  const [query, setQuery] = useState("");

  const orders = useMemo(() => data ?? [], [data]);

  const rows = useMemo(() => {
    const active = TABS.find((t) => t.key === tab) ?? TABS[0];
    const q = query.trim().toLowerCase();
    return orders.filter((o) => {
      if (!active.match(o.status)) return false;
      if (q && !o.id.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [orders, tab, query]);

  if (isError) {
    return (
      <div className="space-y-6">
        <PageHeader title="Your orders" description="Track your purchases." />
        <ErrorState
          message="Could not load your orders."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 px-[10px]">
      <PageHeader
        title="Your orders"
        description="Track, review and reorder your purchases."
        actions={
          <Button asChild variant="outline">
            <Link href="/products">
              <ShoppingBag className="size-4" /> Continue shopping
            </Link>
          </Button>
        }
      />

      {isLoading ? (
        <ListCardSkeleton rows={5} />
      ) : orders.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="No orders yet"
          description="Browse the marketplace and place your first order."
          action={
            <Button asChild variant="brand">
              <Link href="/products">Start shopping</Link>
            </Button>
          }
        />
      ) : (
        <>
          {/* Toolbar: segmented tabs + search */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="inline-flex w-fit rounded-lg border bg-muted/40 p-1">
              {TABS.map((t) => {
                const active = tab === t.key;
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setTab(t.key)}
                    className={cn(
                      "rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors",
                      active
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
            <div className="relative sm:w-60">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search order id…"
                className="pl-9"
              />
            </div>
          </div>

          {/* Ticket list — separated by a stylish wide divider */}
          {rows.length === 0 ? (
            <div className="rounded-xl border border-dashed bg-card/50 px-6 py-16 text-center">
              <div className="mx-auto grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
                <Package className="size-6" />
              </div>
              <p className="mt-3 text-sm font-medium">No orders here</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Try a different tab or search term.
              </p>
            </div>
          ) : (
            // Borderless rows, each separated by a full-bleed line that runs
            // wider than the order content.
            <div className="-mx-[5px] divide-y-2 divide-foreground/15 border-y-2 border-foreground/15">
              {rows.map((o) => (
                <OrderRow key={o.id} order={o} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function OrderRow({ order }: { order: Order }) {
  const itemCount = order.items?.length ?? 0;
  const href = `/account/orders/${order.id}`;

  return (
    <Link
      href={href}
      onClick={() => startNavProgress()}
      className="group flex items-center gap-4 px-[5px] py-4 transition-colors hover:bg-muted/40"
    >
      {/* Leading product image (first item), fallback glyph */}
      <ProductThumb
        productId={order.items?.[0]?.product}
        alt={order.items?.[0]?.product_name}
        className="size-12 rounded-xl ring-1 ring-border"
      />

      {/* Identity, date and status */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">
          Order #{order.id.slice(0, 8).toUpperCase()}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {formatDate(order.created_at)} · {itemCount}{" "}
          {itemCount === 1 ? "item" : "items"}
        </p>
        <div className="mt-2">
          <StatusPill status={order.status} />
        </div>
      </div>

      {/* Amount */}
      <div className="shrink-0 text-right">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
          Total
        </p>
        <p className="text-base font-bold tabular-nums text-foreground">
          {formatCurrency(order.total_amount)}
        </p>
      </div>

      <ChevronRight className="size-5 shrink-0 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}
