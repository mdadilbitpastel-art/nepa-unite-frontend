"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ListCardSkeleton, ErrorState } from "@/components/shared/states";
import {
  ReturnStatusBadge,
  OrderEffectiveBadge,
} from "@/components/shared/status-badge";
import { ReturnManageDialog } from "@/components/shared/return-manage-dialog";
import { ProductThumb } from "@/components/shop/product-thumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useOrders } from "@/features/orders/use-orders";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import type { Order, OrderItem } from "@/types";

export default function SellerOrdersPage() {
  const { data, isLoading, isError, refetch } = useOrders();
  const [tab, setTab] = useState<"returns" | "all">("returns");
  const [manageId, setManageId] = useState<string | null>(null);

  // The API already scopes each order's items to this seller, so use them all.
  const myItems = (o: Order): OrderItem[] => o.items ?? [];
  const orderHasReturn = (o: Order) =>
    myItems(o).some((i) => i.active_return);

  const orders = data ?? [];
  const returnOrders = orders.filter(orderHasReturn);
  const rows = tab === "returns" ? returnOrders : orders;
  const actionNeeded = returnOrders.filter((o) =>
    myItems(o).some((i) => i.active_return?.status === "requested"),
  ).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Orders"
        description="Your sales, with any return / exchange requests to action."
      />

      <div className="flex flex-wrap gap-1 rounded-xl border bg-card p-1">
        {(
          [
            { key: "returns", label: "Return requests" },
            { key: "all", label: "All orders" },
          ] as const
        ).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              tab === t.key
                ? "bg-brand text-brand-foreground"
                : "text-muted-foreground hover:bg-muted",
            )}
          >
            {t.label}
            {t.key === "returns" && actionNeeded > 0 && (
              <span
                className={cn(
                  "grid min-w-5 place-items-center rounded-full px-1 text-xs font-bold",
                  tab === t.key ? "bg-white/20" : "bg-warning/15 text-warning",
                )}
              >
                {actionNeeded}
              </span>
            )}
          </button>
        ))}
      </div>

      {isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : isLoading ? (
        <ListCardSkeleton />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={RotateCcw}
          title={
            tab === "returns" ? "No return requests" : "No orders yet"
          }
          description={
            tab === "returns"
              ? "When a buyer raises a return or exchange, it shows up here to approve."
              : "Your orders will appear here."
          }
        />
      ) : (
        <div className="space-y-4">
          {rows.map((order) => (
            <SellerOrderCard
              key={order.id}
              order={order}
              items={myItems(order)}
              onManage={setManageId}
            />
          ))}
        </div>
      )}

      {manageId && (
        <ReturnManageDialog
          returnId={manageId}
          open={!!manageId}
          onOpenChange={(o) => !o && setManageId(null)}
        />
      )}
    </div>
  );
}

function SellerOrderCard({
  order,
  items,
  onManage,
}: {
  order: Order;
  items: OrderItem[];
  onManage: (id: string) => void;
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-3 space-y-0 border-b py-4">
        <div>
          <p className="text-sm font-semibold text-foreground">
            Order #{order.id.slice(0, 8).toUpperCase()}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatDate(order.created_at)}
            {order.shipping_name ? ` · ${order.shipping_name}` : ""}
          </p>
        </div>
        <OrderEffectiveBadge order={order} />
      </CardHeader>
      <CardContent className="divide-y pt-0">
        {items.map((item) => {
          const rr = item.active_return;
          const requested = rr?.status === "requested";
          return (
            <div
              key={item.id}
              className={cn(
                "flex items-center gap-4 py-3",
                requested && "-mx-2 rounded-lg bg-warning/5 px-2",
              )}
            >
              <ProductThumb
                productId={item.product}
                alt={item.product_name}
                className="size-11 rounded-lg ring-1 ring-border"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {item.product_name ?? `Product ${item.product.slice(0, 8)}`}
                </p>
                <p className="text-xs text-muted-foreground">
                  Qty {item.quantity} · {formatCurrency(item.unit_price)} each
                </p>
              </div>

              {rr ? (
                <div className="flex items-center gap-3">
                  <div className="hidden text-right sm:block">
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      {rr.type === "exchange" ? "Exchange" : "Return"}
                    </p>
                    <ReturnStatusBadge
                      status={rr.status}
                      label={rr.status_display}
                    />
                  </div>
                  <Button
                    size="sm"
                    variant={requested ? "brand" : "outline"}
                    onClick={() => onManage(rr.id)}
                  >
                    {requested ? "Review" : "Manage"}
                  </Button>
                </div>
              ) : (
                <span className="text-xs capitalize text-muted-foreground">
                  {item.fulfillment_status}
                </span>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
