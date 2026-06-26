"use client";

import Link from "next/link";
import { useState } from "react";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft,
  Package,
  Download,
  CreditCard,
  MapPin,
  XCircle,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { DetailSkeleton, ErrorState, Spinner } from "@/components/shared/states";
import { OrderTimeline } from "@/components/shared/order-timeline";
import {
  OrderStatusBadge,
  PaymentStatusBadge,
} from "@/components/shared/status-badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  useOrder,
  useUpdateOrderStatus,
  useInvoice,
} from "@/features/orders/use-orders";
import { paymentService } from "@/services";
import { qk } from "@/lib/query-keys";
import { ApiError } from "@/lib/axios";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import type { Payment } from "@/types";

const TERMINAL_STATUSES = ["delivered", "closed", "cancelled"];

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const { data: order, isLoading, isError, refetch } = useOrder(id);
  const updateStatus = useUpdateOrderStatus();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [invoiceEnabled, setInvoiceEnabled] = useState(false);

  const qc = useQueryClient();

  // Poll payments to reflect status (every 5s while order exists).
  const paymentsQuery = useQuery({
    queryKey: qk.payments(id),
    queryFn: () => paymentService.forOrder(id),
    enabled: !!id,
    refetchInterval: (query) => {
      const data = query.state.data as Payment[] | undefined;
      const settled = data?.some((p) =>
        ["completed", "refunded"].includes(p.status),
      );
      return settled ? false : 5000;
    },
  });
  const payments = paymentsQuery.data ?? [];
  const latestPayment = payments[0];
  const isPaid = payments.some((p) => p.status === "completed");

  const createIntent = useMutation({
    mutationFn: () => paymentService.createIntent(id),
    onSuccess: () => {
      toast.success("Payment initialized — complete it below.");
      qc.invalidateQueries({ queryKey: qk.payments(id) });
      paymentsQuery.refetch();
    },
    onError: (e: ApiError) => toast.error(e.message),
  });

  const invoiceQuery = useInvoice(id, invoiceEnabled);

  const handleInvoice = () => {
    if (invoiceQuery.data?.pre_signed_url) {
      window.open(invoiceQuery.data.pre_signed_url, "_blank", "noopener");
      return;
    }
    setInvoiceEnabled(true);
    invoiceQuery.refetch().then((res) => {
      if (res.data?.pre_signed_url) {
        window.open(res.data.pre_signed_url, "_blank", "noopener");
      } else {
        toast.error("Invoice is not available yet.");
      }
    });
  };

  if (isLoading) return <DetailSkeleton />;
  if (isError || !order)
    return (
      <ErrorState
        title="Order not found"
        message="This order may not exist or you don't have access."
        onRetry={() => refetch()}
      />
    );

  const canCancel = !TERMINAL_STATUSES.includes(order.status);
  const isDraft = order.status === "draft";

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Order #${order.id.slice(0, 8).toUpperCase()}`}
        description={`Placed ${formatDateTime(order.created_at)}`}
        actions={
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/buyer/orders">
                <ArrowLeft className="size-4" /> Back
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleInvoice}
              loading={invoiceQuery.isFetching}
            >
              <Download className="size-4" /> Invoice
            </Button>
            {canCancel && (
              <Button
                variant="ghost"
                size="sm"
                className="text-danger hover:text-danger"
                onClick={() => setCancelOpen(true)}
              >
                <XCircle className="size-4" /> Cancel
              </Button>
            )}
          </div>
        }
      />

      <div className="flex items-center gap-3">
        <OrderStatusBadge status={order.status} />
        {latestPayment && <PaymentStatusBadge status={latestPayment.status} />}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: timeline + items */}
        <div className="space-y-6 lg:col-span-2">
          {/* Pay now panel (draft only, not yet paid) */}
          {isDraft && !isPaid && (
            <Card className="border-brand/30 bg-brand/[0.03]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <CreditCard className="size-4 text-brand" />
                  Complete payment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Your order is a draft. Pay{" "}
                  <span className="font-semibold text-foreground">
                    {formatCurrency(order.total_amount)}
                  </span>{" "}
                  to confirm it. Once payment succeeds, the order moves to
                  Confirmed automatically.
                </p>

                {createIntent.data ? (
                  <div className="rounded-lg border bg-card p-4 text-sm">
                    <p className="font-medium">Payment intent created</p>
                    <p className="mt-1 break-all font-mono text-xs text-muted-foreground">
                      {createIntent.data.payment_intent_id}
                    </p>
                    <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Spinner className="text-brand" />
                      Waiting for payment confirmation…
                    </p>
                  </div>
                ) : (
                  <Button
                    variant="brand"
                    loading={createIntent.isPending}
                    onClick={() => createIntent.mutate()}
                  >
                    <CreditCard className="size-4" /> Pay{" "}
                    {formatCurrency(order.total_amount)}
                  </Button>
                )}

                <p className="text-xs text-muted-foreground">
                  Test card: 4242 4242 4242 4242, any future expiry, any CVC.
                </p>
              </CardContent>
            </Card>
          )}

          {isPaid && (
            <Card className="border-success/30 bg-success/[0.04]">
              <CardContent className="flex items-center gap-3 p-5">
                <CheckCircle2 className="size-6 text-success" />
                <div>
                  <p className="text-sm font-semibold">Payment received</p>
                  <p className="text-xs text-muted-foreground">
                    Your payment was captured successfully.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Order Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <OrderTimeline status={order.status} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Items ({order.items?.length ?? 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="divide-y">
                {order.items?.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 py-3 first:pt-0"
                  >
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                      <Package className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/buyer/products/${item.product}`}
                        className="line-clamp-1 text-sm font-medium hover:text-brand"
                      >
                        {item.product_name ??
                          `Product ${item.product.slice(0, 8)}`}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        Qty {item.quantity} ·{" "}
                        {formatCurrency(item.unit_price)} each
                      </p>
                    </div>
                    <p className="text-sm font-semibold">
                      {formatCurrency(
                        parseFloat(item.unit_price) * item.quantity,
                      )}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: summary + shipping + payments */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Items</span>
                <span className="font-medium">
                  {order.items?.length ?? 0}
                </span>
              </div>
              <div className="flex items-center justify-between border-t pt-3">
                <span className="font-semibold">Total</span>
                <span className="text-lg font-semibold">
                  {formatCurrency(order.total_amount)}
                </span>
              </div>
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

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Payments</CardTitle>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Refresh payments"
                onClick={() => paymentsQuery.refetch()}
              >
                <RefreshCw
                  className={paymentsQuery.isFetching ? "animate-spin" : ""}
                />
              </Button>
            </CardHeader>
            <CardContent>
              {payments.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No payments recorded yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {payments.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between gap-2 text-sm"
                    >
                      <div>
                        <p className="font-medium">
                          {formatCurrency(p.amount)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(p.created_at)}
                        </p>
                      </div>
                      <PaymentStatusBadge status={p.status} />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="Cancel this order?"
        description="This will cancel the order. This action can't be undone."
        confirmLabel="Cancel order"
        destructive
        loading={updateStatus.isPending}
        onConfirm={() =>
          updateStatus.mutate(
            { id: order.id, status: "cancelled" },
            { onSuccess: () => setCancelOpen(false) },
          )
        }
      />
    </div>
  );
}
