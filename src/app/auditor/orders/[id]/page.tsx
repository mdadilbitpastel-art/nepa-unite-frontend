"use client";

import { use } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Package, Truck, CreditCard, Eye } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { OrderTimeline } from "@/components/shared/order-timeline";
import { PaymentStatusBadge } from "@/components/shared/status-badge";
import { DetailSkeleton, ErrorState } from "@/components/shared/states";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useOrder } from "@/features/orders/use-orders";
import { paymentService } from "@/services";
import { qk } from "@/lib/query-keys";
import { formatCurrency, formatDateTime, titleCase } from "@/lib/utils";

export default function AuditorOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: order, isLoading, isError, refetch } = useOrder(id);
  const { data: payments } = useQuery({
    queryKey: qk.payments(id),
    queryFn: () => paymentService.forOrder(id),
    enabled: !!id,
  });

  if (isLoading) return <DetailSkeleton />;
  if (isError || !order)
    return (
      <ErrorState message="This order could not be loaded." onRetry={() => refetch()} />
    );

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Order #${order.id.slice(0, 8).toUpperCase()}`}
        description={`Placed ${formatDateTime(order.created_at)}`}
        actions={
          <div className="flex items-center gap-2">
            <Badge variant="info" className="px-3 py-1.5">
              <Eye className="size-3.5" /> Read-only
            </Badge>
            <Button asChild variant="outline" size="sm">
              <Link href="/auditor/orders">
                <ArrowLeft className="size-4" /> Back
              </Link>
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Items */}
          <Card>
            <CardHeader className="flex flex-row items-center gap-2 space-y-0">
              <Package className="size-4 text-brand" />
              <CardTitle className="text-base">
                Line Items ({order.items?.length ?? 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {order.items?.length ? (
                <div className="divide-y">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 py-3"
                    >
                      <div className="flex size-10 items-center justify-center rounded-lg bg-brand/10 text-brand">
                        <Package className="size-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {item.product_name ??
                            `Product ${item.product.slice(0, 8)}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Qty {item.quantity} ·{" "}
                          {formatCurrency(item.unit_price)} each
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">
                          {formatCurrency(
                            parseFloat(item.unit_price) * item.quantity,
                          )}
                        </p>
                        <Badge variant="muted">
                          {titleCase(item.fulfillment_status)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No items"
                  description="This order has no line items."
                  className="border-0"
                />
              )}
              <div className="mt-4 flex items-center justify-between border-t pt-4">
                <span className="text-sm text-muted-foreground">Order total</span>
                <span className="text-lg font-semibold">
                  {formatCurrency(order.total_amount)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Payments */}
          <Card>
            <CardHeader className="flex flex-row items-center gap-2 space-y-0">
              <CreditCard className="size-4 text-teal" />
              <CardTitle className="text-base">Payments</CardTitle>
            </CardHeader>
            <CardContent>
              {payments?.length ? (
                <div className="divide-y">
                  {payments.map((p) => (
                    <div key={p.id} className="flex items-center gap-4 py-3">
                      <div className="flex size-10 items-center justify-center rounded-lg bg-teal/10 text-teal">
                        <CreditCard className="size-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-mono text-xs text-muted-foreground">
                          {p.stripe_payment_intent_id || "—"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Fee {formatCurrency(p.platform_fee)} ·{" "}
                          {formatDateTime(p.created_at)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">
                          {formatCurrency(p.amount)}
                        </p>
                        <PaymentStatusBadge status={p.status} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={CreditCard}
                  title="No payments recorded"
                  description="No payment activity has been captured for this order."
                  className="border-0"
                />
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
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
            <CardHeader className="flex flex-row items-center gap-2 space-y-0">
              <Truck className="size-4 text-brand" />
              <CardTitle className="text-base">Shipping</CardTitle>
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
                <p className="mt-3 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
                  “{order.buyer_notes}”
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
