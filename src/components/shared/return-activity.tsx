"use client";

import { RotateCcw, RefreshCw, PackageCheck, ChevronRight } from "lucide-react";
import { ReturnStatusBadge } from "@/components/shared/status-badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Order } from "@/types";

/**
 * Returns & exchanges activity for an order — the full history across every
 * item (how many were raised, and how each ended up). Sits beside the order
 * timeline on the detail page; each entry opens its live tracking.
 */
export function ReturnActivityPanel({
  order,
  onTrack,
}: {
  order: Order;
  onTrack: (returnId: string) => void;
}) {
  const entries = (order.items ?? [])
    .flatMap((item) =>
      (item.return_history ?? []).map((r) => ({
        ...r,
        product_name:
          item.product_name ?? `Product ${item.product.slice(0, 8)}`,
      })),
    )
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));

  return (
    <div>
      <p className="mb-4 text-sm font-semibold text-foreground">
        Returns &amp; Exchanges
      </p>

      {entries.length === 0 ? (
        <EmptyState order={order} />
      ) : (
        <ol className="space-y-2.5">
          {entries.map((e) => {
            const isExchange = e.type === "exchange";
            return (
              <li key={e.id}>
                <button
                  type="button"
                  onClick={() => onTrack(e.id)}
                  className="group flex w-full items-center gap-3 rounded-xl border bg-card p-3 text-left transition-colors hover:border-brand/40 hover:bg-brand/[0.02]"
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    {isExchange ? (
                      <RefreshCw className="size-4" />
                    ) : (
                      <RotateCcw className="size-4" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {isExchange ? "Exchange" : "Return"} ·{" "}
                      {e.product_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(e.created_at)}
                      {e.type === "return" &&
                        parseFloat(e.refund_amount) > 0 &&
                        ` · Refund ${formatCurrency(e.refund_amount)}`}
                    </p>
                  </div>
                  <ReturnStatusBadge
                    status={e.status}
                    label={e.status_display}
                  />
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5" />
                </button>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

function EmptyState({ order }: { order: Order }) {
  const delivered = Boolean(order.delivered_at);
  const eligible = (order.items ?? []).some((i) => i.return_eligible);

  const message = eligible
    ? "Eligible items can still be returned or exchanged from the list below."
    : delivered
      ? "The return / exchange window for this order has closed."
      : "Returns and exchanges will appear here once your order is delivered.";

  return (
    <div className="flex h-full min-h-[180px] flex-col items-center justify-center rounded-xl border border-dashed bg-muted/20 px-4 py-8 text-center">
      <span className="mb-3 flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <PackageCheck className="size-5" />
      </span>
      <p className="text-sm font-medium text-foreground">
        No returns or exchanges
      </p>
      <p className="mt-1 max-w-[16rem] text-xs text-muted-foreground">
        {message}
      </p>
    </div>
  );
}
