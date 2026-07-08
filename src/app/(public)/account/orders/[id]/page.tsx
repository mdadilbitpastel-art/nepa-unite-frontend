"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft,
  Download,
  CreditCard,
  MapPin,
  XCircle,
  RefreshCw,
  CheckCircle2,
  Store,
  RotateCcw,
} from "lucide-react";
import { ProductThumb } from "@/components/shop/product-thumb";
import { PageHeader } from "@/components/shared/page-header";
import { DetailSkeleton, ErrorState, Spinner } from "@/components/shared/states";
import { OrderTimeline } from "@/components/shared/order-timeline";
import {
  OrderStatusBadge,
  PaymentStatusBadge,
  ReturnStatusBadge,
} from "@/components/shared/status-badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ReturnRequestDialog } from "@/components/shared/return-request-dialog";
import { ReturnTrackingDialog } from "@/components/shared/return-tracking-dialog";
import { ReturnActivityPanel } from "@/components/shared/return-activity";
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
import { StripePayment } from "@/components/shop/stripe-payment";
import { useSyncPayment } from "@/features/payments/use-payments";
import { paymentService } from "@/services";
import { qk } from "@/lib/query-keys";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { downloadOrderInvoicePdf } from "@/lib/invoice-pdf";
import type { OrderItem, Payment } from "@/types";

const TERMINAL_STATUSES = ["delivered", "closed", "cancelled"];

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const { data: order, isLoading, isError, refetch } = useOrder(id);
  const updateStatus = useUpdateOrderStatus();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [returnItem, setReturnItem] = useState<OrderItem | null>(null);
  const [trackReturnId, setTrackReturnId] = useState<string | null>(null);
  const [invoiceEnabled, setInvoiceEnabled] = useState(false);
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);
  // True when we've just returned from a completed payment and are waiting for
  // the server to confirm the order — avoids flashing the pay form again.
  const [confirming, setConfirming] = useState(() => {
    if (typeof window === "undefined") return false;
    const p = new URLSearchParams(window.location.search);
    return !!(p.get("paid") || p.get("payment_intent"));
  });

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

  // Reconcile with Stripe when returning from a redirect-based payment method
  // (test-mode has no webhook). Reads params off the URL to avoid needing a
  // useSearchParams Suspense boundary, then cleans the query string.
  const sync = useSyncPayment();
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("paid") || params.get("payment_intent")) {
      window.history.replaceState({}, "", `/account/orders/${id}`);
      sync.mutate(id, {
        onSettled: () => {
          paymentsQuery.refetch();
          refetch();
          setConfirming(false);
        },
      });
    } else {
      setConfirming(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const invoiceQuery = useInvoice(id, invoiceEnabled);

  const handleInvoice = async () => {
    setDownloadingInvoice(true);
    try {
      // 1) Prefer the official backend invoice (an S3-hosted PDF). The query is
      //    lazy, so enable + fetch it on first click.
      let invoice = invoiceQuery.data;
      if (!invoice?.pre_signed_url) {
        setInvoiceEnabled(true);
        invoice = (await invoiceQuery.refetch()).data;
      }

      if (invoice?.pre_signed_url) {
        const filename = `invoice-${
          invoice.invoice_number || order?.id.slice(0, 8) || "download"
        }.pdf`;
        // Pull the PDF bytes and save them to disk with a proper filename.
        const res = await fetch(invoice.pre_signed_url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        return;
      }

      // 2) No official invoice available (e.g. object storage isn't configured
      //    in this environment) — generate one client-side from the order so
      //    the download always works.
      if (order) downloadOrderInvoicePdf(order);
      else toast.error("Invoice is not available yet.");
    } catch {
      // Backend error, network, or CORS on the storage host — fall back to a
      // client-side PDF built from the order data.
      if (order) downloadOrderInvoicePdf(order);
      else toast.error("Couldn't generate the invoice.");
    } finally {
      setDownloadingInvoice(false);
    }
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

  // Prefer the API's authoritative flag (cancel is allowed only before
  // delivery); fall back to the local check for older payloads.
  const canCancel = order.can_cancel ?? !TERMINAL_STATUSES.includes(order.status);
  const isDraft = order.status === "draft";

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Order #${order.id.slice(0, 8).toUpperCase()}`}
        description={`Placed ${formatDateTime(order.created_at)}`}
        actions={
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/account/orders">
                <ArrowLeft className="size-4" /> Back
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleInvoice}
              loading={invoiceQuery.isFetching || downloadingInvoice}
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

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Order
          </span>
          <OrderStatusBadge status={order.status} />
        </div>
        {latestPayment && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Payment
            </span>
            <PaymentStatusBadge status={latestPayment.status} />
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: timeline + items */}
        <div className="space-y-6 lg:col-span-2">
          {/* Confirming a just-completed payment (returned with ?paid). */}
          {confirming && !isPaid && (
            <Card className="border-brand/30 bg-brand/[0.03]">
              <CardContent className="flex items-center gap-3 p-5">
                <Spinner className="text-brand" />
                <div>
                  <p className="text-sm font-semibold">Confirming your payment…</p>
                  <p className="text-xs text-muted-foreground">
                    This only takes a moment.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pay now panel (draft only, not yet paid, not mid-confirmation) */}
          {isDraft && !isPaid && !confirming && (
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

                <StripePayment
                  orderId={id}
                  amount={order.total_amount}
                  returnUrl={
                    typeof window !== "undefined"
                      ? `${window.location.origin}/account/orders/${id}?paid=1`
                      : undefined
                  }
                  onPaid={() => {
                    paymentsQuery.refetch();
                    refetch();
                  }}
                />
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
              <div className="grid gap-8 sm:grid-cols-2">
                <OrderTimeline status={order.status} />
                <div className="sm:border-l sm:pl-8">
                  <ReturnActivityPanel
                    order={order}
                    onTrack={(rid) => setTrackReturnId(rid)}
                  />
                </div>
              </div>
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
                    className="flex items-start gap-4 py-3 first:pt-0"
                  >
                    <ProductThumb
                      productId={item.product}
                      alt={item.product_name}
                      className="size-11 rounded-lg ring-1 ring-border"
                    />
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/products/${item.product}`}
                        className="line-clamp-1 text-sm font-medium hover:text-brand"
                      >
                        {item.product_name ??
                          `Product ${item.product.slice(0, 8)}`}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        Qty {item.quantity} ·{" "}
                        {formatCurrency(item.unit_price)} each
                      </p>
                      {item.seller_name && (
                        <Link
                          href={`/products?brand=${encodeURIComponent(item.seller_name)}`}
                          className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-brand"
                        >
                          <Store className="size-3" />
                          Sold by {item.seller_name}
                        </Link>
                      )}

                      {/* Return / exchange action or live tracking */}
                      {item.return_eligible ? (
                        <button
                          type="button"
                          onClick={() => setReturnItem(item)}
                          className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-brand/30 px-2.5 py-1 text-xs font-semibold text-brand transition-colors hover:bg-brand/5"
                        >
                          <RotateCcw className="size-3" />
                          Return / Exchange
                        </button>
                      ) : item.active_return ? (
                        <button
                          type="button"
                          onClick={() =>
                            setTrackReturnId(item.active_return!.id)
                          }
                          className="mt-2 inline-flex items-center gap-2"
                        >
                          <ReturnStatusBadge
                            status={item.active_return.status}
                            label={item.active_return.status_display}
                          />
                          <span className="text-xs font-medium text-brand hover:underline">
                            View tracking
                          </span>
                        </button>
                      ) : null}
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

      {returnItem && (
        <ReturnRequestDialog
          item={returnItem}
          open={!!returnItem}
          onOpenChange={(o) => !o && setReturnItem(null)}
        />
      )}
      {trackReturnId && (
        <ReturnTrackingDialog
          returnId={trackReturnId}
          open={!!trackReturnId}
          onOpenChange={(o) => !o && setTrackReturnId(null)}
        />
      )}
    </div>
  );
}
