import { Check, X, ChevronRight } from "lucide-react";
import {
  RETURN_LIFECYCLE_RETURN,
  RETURN_LIFECYCLE_EXCHANGE,
} from "@/lib/constants";
import { cn, titleCase } from "@/lib/utils";
import type { OrderStatus, ReturnStatus, ReturnType } from "@/types";

/** Core order lifecycle up to delivery; "closed" is appended after any
 *  return/exchange leg so the progression reads Delivered → … → Closed. */
const BASE_ORDER: OrderStatus[] = [
  "draft",
  "confirmed",
  "fulfillment",
  "shipped",
  "delivered",
];

const RET_STEP_LABEL: Record<string, string> = {
  requested: "Requested",
  approved: "Approved",
  pickup_scheduled: "Pickup scheduled",
  picked_up: "Picked up",
  received: "Received",
  refunded: "Refunded",
  exchange_shipped: "Replacement shipped",
  exchange_completed: "Exchange completed",
};

type StepState = "done" | "active" | "pending" | "rejected";
type Node = { key: string; label: string; state: StepState; ret?: boolean };

/**
 * Order lifecycle timeline. Once a delivered order has a return/exchange in
 * flight, that request's steps are woven in after "Delivered" and before
 * "Closed" — pass the relevant return's `returnKind` + `returnStatus`.
 */
export function OrderTimeline({
  status,
  returnKind,
  returnStatus,
}: {
  status: OrderStatus;
  returnKind?: ReturnType;
  returnStatus?: ReturnStatus;
}) {
  if (status === "cancelled") {
    return (
      <div className="rounded-xl border border-danger/20 bg-danger/5 p-4 text-sm font-medium text-danger">
        This order was cancelled.
      </div>
    );
  }

  const isClosed = status === "closed";
  const hasReturn = Boolean(
    returnKind &&
      returnStatus &&
      (status === "delivered" || status === "closed"),
  );
  const retActive =
    hasReturn && returnStatus !== "rejected" && returnStatus !== "cancelled";
  const retRejected = hasReturn && returnStatus === "rejected";
  const orderIdx = BASE_ORDER.indexOf(status); // -1 when closed

  const nodes: Node[] = [];

  BASE_ORDER.forEach((s, i) => {
    let state: StepState;
    if (isClosed || hasReturn) state = "done"; // delivery reached; current is on the return leg
    else if (i < orderIdx) state = "done";
    else if (i === orderIdx) state = "active";
    else state = "pending";
    nodes.push({ key: s, label: titleCase(s), state });
  });

  if (retActive) {
    const flow =
      returnKind === "exchange"
        ? RETURN_LIFECYCLE_EXCHANGE
        : RETURN_LIFECYCLE_RETURN;
    const retIdx = flow.indexOf(returnStatus!);
    const typeLabel = returnKind === "exchange" ? "Exchange" : "Return";
    flow.forEach((rs, j) => {
      let state: StepState;
      if (isClosed || j < retIdx) state = "done";
      else if (j === retIdx) state = "active";
      else state = "pending";
      const base = RET_STEP_LABEL[rs] ?? titleCase(rs);
      nodes.push({
        key: `ret-${rs}`,
        label: rs === "requested" ? `${typeLabel} requested` : base,
        state,
        ret: true,
      });
    });
  } else if (retRejected) {
    nodes.push({
      key: "ret-rejected",
      label: `${returnKind === "exchange" ? "Exchange" : "Return"} rejected`,
      state: "rejected",
      ret: true,
    });
  }

  nodes.push({
    key: "closed",
    label: "Closed",
    state: isClosed ? "done" : "pending",
  });

  return (
    // Horizontal, wrapping stepper — stays compact and fills the width instead
    // of running down one tall column (steps flow onto a second line as needed).
    <ol className="flex flex-wrap items-start gap-x-1.5 gap-y-4">
      {nodes.map((node, i) => (
        <li key={node.key} className="flex items-start gap-1.5">
          <div className="flex w-20 flex-col items-center gap-1.5 text-center">
            <span
              className={cn(
                "flex size-8 items-center justify-center rounded-full border-2 transition-colors",
                node.state === "done" &&
                  "border-success bg-success text-success-foreground",
                node.state === "active" &&
                  "border-brand bg-brand text-brand-foreground animate-pulse-ring",
                node.state === "rejected" &&
                  "border-danger bg-danger text-danger-foreground",
                node.state === "pending" &&
                  "border-border bg-card text-muted-foreground",
              )}
            >
              {node.state === "done" ? (
                <Check className="size-4" />
              ) : node.state === "rejected" ? (
                <X className="size-4" />
              ) : (
                <span className="text-xs font-semibold">{i + 1}</span>
              )}
            </span>
            <div className="leading-tight">
              <p
                className={cn(
                  "text-xs font-medium",
                  node.state === "active"
                    ? "text-foreground"
                    : node.state === "rejected"
                      ? "text-danger"
                      : node.state === "done"
                        ? "text-foreground"
                        : "text-muted-foreground",
                )}
              >
                {node.label}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {node.state === "done"
                  ? "Done"
                  : node.state === "active"
                    ? "In progress"
                    : node.state === "rejected"
                      ? "Rejected"
                      : "Pending"}
              </p>
            </div>
          </div>
          {i < nodes.length - 1 && (
            <ChevronRight className="mt-2 size-4 shrink-0 text-muted-foreground/30" />
          )}
        </li>
      ))}
    </ol>
  );
}
