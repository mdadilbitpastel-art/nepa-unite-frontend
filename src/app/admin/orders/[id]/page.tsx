"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Package,
  Truck,
  CreditCard,
  Banknote,
  User,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { DetailSkeleton, ErrorState } from "@/components/shared/states";
import { OrderTimeline } from "@/components/shared/order-timeline";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/shared/status-badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useOrder, useUpdateOrderStatus } from "@/features/orders/use-orders";
import {
  useOrderPayments,
  useDisburse,
} from "@/features/payments/use-payments";
import { formatCurrency, formatDateTime, titleCase } from "@/lib/utils";
import type { OrderStatus } from "@/types";

const ORDER_STATUSES: OrderStatus[] = [
  "draft",
  "confirmed",
  "fulfillment",
  "shipped",
  "delivered",
  "closed",
  "cancelled",
];

export default function AdminOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { data: order, isLoading, isError, refetch } = useOrder(id);
  const { data: payments } = useOrderPayments(id, !!id);
  const updateStatus = useUpdateOrderStatus();
  const disburse = useDisburse(id);

  const [statusOverride, setStatusOverride] = useState<OrderStatus | "">("");
  const [confirmStatus, setConfirmStatus] = useState(false);
  const [disburseItem, setDisburseItem] = useState<string | null>(null);

  if (isLoading) return <DetailSkeleton />;
  if (isError || !order) {
    return (
      <div className="space-y-6">
        <PageHeader title="Order" />
        <ErrorState message="Could not load this order." onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="w-fit">
        <Link href="/admin/orders">
          <ArrowLeft className="size-4" />
          Back to orders
        </Link>
      </Button>

      <PageHeader
        title={`Order #${order.id.slice(0, 8).toUpperCase()}`}
        description={`Placed ${formatDateTime(order.created_at)}`}
        actions={<OrderStatusBadge status={order.status} />}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Items */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Items ({order.items?.length ?? 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {order.items?.length ? (
                <div className="divide-y">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-wrap items-center gap-4 py-3"
                    >
                      <div className="flex size-10 items-center justify-center rounded-lg bg-brand/10 text-brand">
                        <Package className="size-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {item.product_name ??
                            `Product ${item.product.slice(0, 8)}`}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          Seller {item.seller.slice(0, 8)} · Qty {item.quantity}
                        </p>
                      </div>
                      <Badge
                        variant={
                          item.fulfillment_status === "fulfilled"
                            ? "success"
                            : item.fulfillment_status === "cancelled"
                              ? "danger"
                              : "warning"
                        }
                      >
                        {titleCase(item.fulfillment_status)}
                      </Badge>
                      <div className="text-right">
                        <p className="text-sm font-semibold">
                          {formatCurrency(
                            parseFloat(item.unit_price) * item.quantity,
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(item.unit_price)} ea
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setDisburseItem(item.id)}
                      >
                        <Banknote className="size-4" />
                        Disburse
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Package}
                  title="No items"
                  className="border-0"
                />
              )}
              <div className="mt-4 flex items-center justify-between border-t pt-4">
                <span className="text-sm font-medium text-muted-foreground">
                  Order total
                </span>
                <span className="text-lg font-semibold">
                  {formatCurrency(order.total_amount)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Payments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CreditCard className="size-4 text-muted-foreground" />
                Payments
              </CardTitle>
            </CardHeader>
            <CardContent>
              {payments?.length ? (
                <div className="divide-y">
                  {payments.map((p) => (
                    <div
                      key={p.id}
                      className="flex flex-wrap items-center justify-between gap-3 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-mono text-xs text-muted-foreground">
                          {p.stripe_payment_intent_id || p.id.slice(0, 12)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Fee {formatCurrency(p.platform_fee)} ·{" "}
                          {p.disbursed_at
                            ? `Disbursed ${formatDateTime(p.disbursed_at)}`
                            : "Not disbursed"}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold">
                          {formatCurrency(p.amount)}
                        </span>
                        <PaymentStatusBadge status={p.status} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={CreditCard}
                  title="No payments yet"
                  description="This order has not been paid."
                  className="border-0"
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status override */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Status Override</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Select
                value={statusOverride}
                onValueChange={(v) => setStatusOverride(v as OrderStatus)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Move to status…" />
                </SelectTrigger>
                <SelectContent>
                  {ORDER_STATUSES.filter((s) => s !== order.status).map((s) => (
                    <SelectItem key={s} value={s}>
                      {titleCase(s)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="brand"
                className="w-full"
                disabled={!statusOverride}
                onClick={() => setConfirmStatus(true)}
              >
                Apply override
              </Button>
              <p className="text-xs text-muted-foreground">
                Admin override bypasses normal transition checks.
              </p>
            </CardContent>
          </Card>

          {/* Lifecycle */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Lifecycle</CardTitle>
            </CardHeader>
            <CardContent>
              <OrderTimeline status={order.status} />
            </CardContent>
          </Card>

          {/* Shipping */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Truck className="size-4 text-muted-foreground" />
                Shipping
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p className="flex items-center gap-2 font-medium">
                <User className="size-4 text-muted-foreground" />
                {order.shipping_name}
              </p>
              <p className="text-muted-foreground">{order.shipping_phone}</p>
              <p className="text-muted-foreground">
                {order.shipping_address_line1}
                {order.shipping_address_line2
                  ? `, ${order.shipping_address_line2}`
                  : ""}
              </p>
              <p className="text-muted-foreground">
                {order.shipping_city}, {order.shipping_state}{" "}
                {order.shipping_zip}
              </p>
              {order.buyer_notes && (
                <p className="mt-3 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
                  “{order.buyer_notes}”
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Disburse confirm */}
      <ConfirmDialog
        open={!!disburseItem}
        onOpenChange={(o) => !o && setDisburseItem(null)}
        title="Disburse payout?"
        description="The seller's share of this item will be paid out via Stripe Connect. This cannot be undone."
        confirmLabel="Disburse"
        loading={disburse.isPending}
        onConfirm={() => {
          if (!disburseItem) return;
          disburse.mutate(disburseItem, {
            onSuccess: () => setDisburseItem(null),
          });
        }}
      />

      {/* Status override confirm */}
      <ConfirmDialog
        open={confirmStatus}
        onOpenChange={setConfirmStatus}
        title="Override order status?"
        description={
          statusOverride
            ? `This order will be moved to "${titleCase(statusOverride)}".`
            : undefined
        }
        confirmLabel="Apply"
        destructive={statusOverride === "cancelled"}
        loading={updateStatus.isPending}
        onConfirm={() => {
          if (!statusOverride) return;
          updateStatus.mutate(
            { id: order.id, status: statusOverride },
            {
              onSuccess: () => {
                setConfirmStatus(false);
                setStatusOverride("");
              },
            },
          );
        }}
      />
    </div>
  );
}
