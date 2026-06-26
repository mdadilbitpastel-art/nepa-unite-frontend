"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Package,
  MapPin,
  Truck,
  CheckCircle2,
  Ban,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { DetailSkeleton, ErrorState } from "@/components/shared/states";
import { OrderTimeline } from "@/components/shared/order-timeline";
import {
  OrderStatusBadge,
  PaymentStatusBadge,
} from "@/components/shared/status-badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  useOrder,
  useUpdateOrderStatus,
} from "@/features/orders/use-orders";
import { useOrderPayments } from "@/features/payments/use-payments";
import { useAuth } from "@/hooks/use-auth";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { sellerOrderTotal } from "@/lib/seller-metrics";
import type { OrderStatus } from "@/types";

/** Seller fulfillment transitions (FRONTEND_API §6). */
const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  confirmed: "fulfillment",
  fulfillment: "shipped",
  shipped: "delivered",
};

const ADVANCE_LABEL: Partial<Record<OrderStatus, string>> = {
  confirmed: "Start fulfillment",
  fulfillment: "Mark as shipped",
  shipped: "Mark as delivered",
};

export default function SellerOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { user } = useAuth();
  const sellerId = user?.id ?? "";
  const { data: order, isLoading, isError, refetch } = useOrder(id);
  const { data: payments } = useOrderPayments(id);
  const advance = useUpdateOrderStatus();

  const [confirmAdvance, setConfirmAdvance] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const nextStatus = order ? NEXT_STATUS[order.status] : undefined;
  const canCancel =
    order &&
    !["delivered", "closed", "cancelled"].includes(order.status);

  const payment = useMemo(() => payments?.[0], [payments]);

  if (isLoading) return <DetailSkeleton />;
  if (isError || !order) {
    return (
      <ErrorState
        message="We couldn't load this order."
        onRetry={() => refetch()}
      />
    );
  }

  const myItems = (order.items ?? []).filter(
    (it) => !sellerId || !it.seller || it.seller === sellerId,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Order #${order.id.slice(0, 8).toUpperCase()}`}
        description={`Placed ${formatDateTime(order.created_at)}`}
        actions={
          <Button asChild variant="ghost">
            <Link href="/seller/orders">
              <ArrowLeft className="size-4" /> All orders
            </Link>
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Fulfillment actions */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Fulfillment</CardTitle>
              <OrderStatusBadge status={order.status} />
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {order.status === "draft"
                  ? "Waiting for buyer payment. The order moves to “confirmed” automatically once payment succeeds."
                  : nextStatus
                    ? "Advance this order through its fulfillment lifecycle."
                    : "This order has reached a terminal state."}
              </p>
              <div className="flex flex-wrap gap-2">
                {nextStatus && (
                  <Button
                    variant="brand"
                    onClick={() => setConfirmAdvance(true)}
                  >
                    {order.status === "shipped" ? (
                      <CheckCircle2 className="size-4" />
                    ) : (
                      <Truck className="size-4" />
                    )}
                    {ADVANCE_LABEL[order.status]}
                  </Button>
                )}
                {canCancel && (
                  <Button
                    variant="outline"
                    className="text-danger hover:text-danger"
                    onClick={() => setConfirmCancel(true)}
                  >
                    <Ban className="size-4" /> Cancel order
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Items */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Your items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="divide-y">
                {myItems.map((it) => (
                  <div key={it.id} className="flex items-center gap-4 py-3">
                    <Avatar className="size-10 rounded-lg">
                      <AvatarFallback className="rounded-lg bg-brand/10 text-brand">
                        <Package className="size-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {it.product_name ??
                          `Product ${it.product.slice(0, 8)}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Qty {it.quantity} · {formatCurrency(it.unit_price)} each
                      </p>
                    </div>
                    <Badge
                      variant={
                        it.fulfillment_status === "fulfilled"
                          ? "success"
                          : it.fulfillment_status === "cancelled"
                            ? "danger"
                            : "warning"
                      }
                    >
                      {it.fulfillment_status}
                    </Badge>
                    <div className="w-24 text-right text-sm font-semibold">
                      {formatCurrency(
                        parseFloat(it.unit_price || "0") * it.quantity,
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between border-t pt-4">
                <span className="text-sm font-medium">Your total</span>
                <span className="text-lg font-semibold">
                  {formatCurrency(sellerOrderTotal(order, sellerId))}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Lifecycle</CardTitle>
            </CardHeader>
            <CardContent>
              <OrderTimeline status={order.status} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Payment</CardTitle>
              {payment && <PaymentStatusBadge status={payment.status} />}
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {payment ? (
                <>
                  <Row label="Amount" value={formatCurrency(payment.amount)} />
                  <Row
                    label="Platform fee"
                    value={formatCurrency(payment.platform_fee)}
                  />
                  <Row
                    label="Disbursed"
                    value={
                      payment.disbursed_at
                        ? formatDateTime(payment.disbursed_at)
                        : "Pending"
                    }
                  />
                </>
              ) : (
                <p className="text-muted-foreground">
                  No payment recorded yet.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPin className="size-4 text-muted-foreground" /> Shipping
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p className="font-medium">{order.shipping_name}</p>
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
                <p className="mt-2 rounded-lg bg-muted/40 p-2 text-xs text-muted-foreground">
                  “{order.buyer_notes}”
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={confirmAdvance}
        onOpenChange={setConfirmAdvance}
        title={ADVANCE_LABEL[order.status] ?? "Advance order"}
        description={
          nextStatus
            ? `This will move the order to "${nextStatus}".`
            : undefined
        }
        confirmLabel="Confirm"
        loading={advance.isPending}
        onConfirm={() => {
          if (!nextStatus) return;
          advance.mutate(
            { id: order.id, status: nextStatus },
            { onSettled: () => setConfirmAdvance(false) },
          );
        }}
      />

      <ConfirmDialog
        open={confirmCancel}
        onOpenChange={setConfirmCancel}
        title="Cancel this order?"
        description="The order will be marked as cancelled. This cannot be undone."
        confirmLabel="Cancel order"
        destructive
        loading={advance.isPending}
        onConfirm={() =>
          advance.mutate(
            { id: order.id, status: "cancelled" },
            { onSettled: () => setConfirmCancel(false) },
          )
        }
      />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
