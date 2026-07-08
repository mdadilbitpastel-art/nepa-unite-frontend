"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ReturnTimeline } from "@/components/shared/return-timeline";
import { ReturnStatusBadge } from "@/components/shared/status-badge";
import { Spinner } from "@/components/shared/states";
import { useReturn } from "@/features/returns/use-returns";
import { formatCurrency, formatDateTime, titleCase } from "@/lib/utils";

export function ReturnTrackingDialog({
  returnId,
  open,
  onOpenChange,
}: {
  returnId: string;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const { data: rr, isLoading } = useReturn(open ? returnId : "");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-[min(92vw,44rem)] max-w-none overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Return tracking</DialogTitle>
        </DialogHeader>

        {isLoading || !rr ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : (
          <div className="space-y-5">
            {/* Product + current status */}
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {rr.product_name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {titleCase(rr.type)} · Qty {rr.quantity} · {titleCase(
                    rr.reason.replace(/_/g, " "),
                  )}
                </p>
              </div>
              <ReturnStatusBadge status={rr.status} label={rr.status_display} />
            </div>

            {/* Two columns so even a long history fits one screen without
                scrolling: progress on the left, real activity on the right. */}
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-4">
                {rr.type === "return" && (
                  <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-3 text-sm">
                    <span className="text-muted-foreground">Refund amount</span>
                    <span className="font-semibold text-foreground">
                      {formatCurrency(rr.refund_amount)}
                    </span>
                  </div>
                )}
                <ReturnTimeline status={rr.status} type={rr.type} />
              </div>

              {/* Actual activity log — every status change with who/when, so
                  the buyer sees exactly when it was approved, rejected, etc. */}
              {rr.events && rr.events.length > 0 && (
                <div className="sm:border-l sm:pl-6">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Activity
                  </p>
                  <ol className="space-y-3">
                    {rr.events.map((ev) => (
                      <li key={ev.id} className="flex gap-3">
                        <span className="mt-1.5 size-2 shrink-0 rounded-full bg-brand/60" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground">
                            {titleCase(ev.to_status.replace(/_/g, " "))}
                            {ev.actor_role && (
                              <span className="font-normal text-muted-foreground">
                                {" "}· by {titleCase(ev.actor_role)}
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDateTime(ev.created_at)}
                          </p>
                          {ev.note && (
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              “{ev.note}”
                            </p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>

            {rr.resolution_note && (
              <p className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Seller note:</span>{" "}
                {rr.resolution_note}
              </p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
