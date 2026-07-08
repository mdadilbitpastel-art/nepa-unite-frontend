"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ReturnTimeline } from "@/components/shared/return-timeline";
import { ReturnStatusBadge } from "@/components/shared/status-badge";
import { Spinner } from "@/components/shared/states";
import { useReturn, useUpdateReturnStatus } from "@/features/returns/use-returns";
import { formatCurrency, formatDateTime, titleCase } from "@/lib/utils";
import type { ReturnRequest, ReturnStatus } from "@/types";

interface Action {
  status: ReturnStatus;
  label: string;
  variant?: "brand" | "outline";
  destructive?: boolean;
}

/** Contextual next-step actions for the seller/admin, by current status. */
function nextActions(rr: ReturnRequest): Action[] {
  switch (rr.status) {
    case "requested":
      return [
        { status: "approved", label: "Approve", variant: "brand" },
        { status: "rejected", label: "Reject", destructive: true },
      ];
    case "approved":
      return [
        { status: "pickup_scheduled", label: "Schedule pickup", variant: "brand" },
        { status: "rejected", label: "Reject", destructive: true },
      ];
    case "pickup_scheduled":
      return [{ status: "picked_up", label: "Mark picked up", variant: "brand" }];
    case "picked_up":
      return [{ status: "received", label: "Mark received", variant: "brand" }];
    case "received":
      return rr.type === "return"
        ? [
            { status: "refunded", label: "Issue refund", variant: "brand" },
            { status: "rejected", label: "Reject", destructive: true },
          ]
        : [
            {
              status: "exchange_shipped",
              label: "Ship replacement",
              variant: "brand",
            },
            { status: "rejected", label: "Reject", destructive: true },
          ];
    case "exchange_shipped":
      return [
        { status: "exchange_completed", label: "Mark completed", variant: "brand" },
      ];
    default:
      return [];
  }
}

export function ReturnManageDialog({
  returnId,
  open,
  onOpenChange,
}: {
  returnId: string;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const { data: rr, isLoading } = useReturn(open ? returnId : "");
  const update = useUpdateReturnStatus();

  const act = (status: ReturnStatus) =>
    update.mutate({ id: returnId, status });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Manage return</DialogTitle>
          {rr && (
            <DialogDescription className="truncate">
              {rr.product_name} · {titleCase(rr.type)}
            </DialogDescription>
          )}
        </DialogHeader>

        {isLoading || !rr ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {/* Left: details + actions */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <ReturnStatusBadge
                  status={rr.status}
                  label={rr.status_display}
                />
                <span className="text-xs text-muted-foreground">
                  #{rr.id.slice(0, 8)}
                </span>
              </div>

              <dl className="space-y-1.5 rounded-lg border bg-muted/30 p-3 text-sm">
                <Row label="Type" value={titleCase(rr.type)} />
                <Row label="Quantity" value={String(rr.quantity)} />
                <Row
                  label="Reason"
                  value={titleCase(rr.reason.replace(/_/g, " "))}
                />
                {rr.type === "return" && (
                  <Row
                    label="Refund"
                    value={formatCurrency(rr.refund_amount)}
                    strong
                  />
                )}
                {rr.seller_name && (
                  <Row label="Seller" value={rr.seller_name} />
                )}
              </dl>

              {rr.reason_note && (
                <p className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">
                    Buyer note:
                  </span>{" "}
                  {rr.reason_note}
                </p>
              )}

              {nextActions(rr).length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {nextActions(rr).map((a) => (
                    <Button
                      key={a.status}
                      size="sm"
                      variant={
                        a.destructive
                          ? "outline"
                          : (a.variant ?? "outline")
                      }
                      className={
                        a.destructive
                          ? "border-danger/40 text-danger hover:bg-danger/10"
                          : undefined
                      }
                      loading={update.isPending}
                      onClick={() => act(a.status)}
                    >
                      {a.label}
                    </Button>
                  ))}
                </div>
              )}
            </div>

            {/* Right: tracker + history */}
            <div className="space-y-4">
              <ReturnTimeline status={rr.status} type={rr.type} />
              {rr.events.length > 0 && (
                <div className="border-t pt-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    History
                  </p>
                  <ul className="space-y-1.5">
                    {rr.events.map((e) => (
                      <li
                        key={e.id}
                        className="flex items-center justify-between gap-2 text-xs"
                      >
                        <span className="text-foreground">
                          {titleCase(e.to_status.replace(/_/g, " "))}
                        </span>
                        <span className="text-muted-foreground">
                          {formatDateTime(e.created_at)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Row({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={strong ? "font-semibold text-foreground" : "text-foreground"}>
        {value}
      </dd>
    </div>
  );
}
