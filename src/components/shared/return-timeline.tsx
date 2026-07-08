import { Check, X } from "lucide-react";
import {
  RETURN_LIFECYCLE_RETURN,
  RETURN_LIFECYCLE_EXCHANGE,
} from "@/lib/constants";
import { cn, titleCase } from "@/lib/utils";
import type { ReturnStatus, ReturnType } from "@/types";

/** Human labels for the tracker steps (Flipkart/Amazon style). */
const STEP_LABEL: Record<string, string> = {
  requested: "Requested",
  approved: "Approved",
  pickup_scheduled: "Pickup scheduled",
  picked_up: "Picked up",
  received: "Received & inspected",
  refunded: "Refunded",
  exchange_shipped: "Replacement shipped",
  exchange_completed: "Exchange completed",
};

/**
 * Vertical return/exchange status tracker. Renders a terminal notice when the
 * request was rejected or cancelled, otherwise a stepper over the lifecycle.
 */
export function ReturnTimeline({
  status,
  type,
}: {
  status: ReturnStatus;
  type: ReturnType;
}) {
  if (status === "rejected" || status === "cancelled") {
    const rejected = status === "rejected";
    return (
      <div
        className={cn(
          "flex items-center gap-2 rounded-xl border p-4 text-sm font-medium",
          rejected
            ? "border-danger/20 bg-danger/5 text-danger"
            : "border-border bg-muted/40 text-muted-foreground",
        )}
      >
        <X className="size-4" />
        {rejected
          ? "This request was rejected by the seller."
          : "This request was cancelled."}
      </div>
    );
  }

  const steps =
    type === "exchange" ? RETURN_LIFECYCLE_EXCHANGE : RETURN_LIFECYCLE_RETURN;
  const currentIndex = steps.indexOf(status);

  return (
    <ol className="relative space-y-6">
      {steps.map((step, i) => {
        const done = i < currentIndex;
        const active = i === currentIndex;
        return (
          <li key={step} className="flex gap-4">
            <div className="relative flex flex-col items-center">
              <span
                className={cn(
                  "flex size-8 items-center justify-center rounded-full border-2 transition-colors",
                  done && "border-success bg-success text-success-foreground",
                  active &&
                    "border-brand bg-brand text-brand-foreground animate-pulse-ring",
                  !done &&
                    !active &&
                    "border-border bg-card text-muted-foreground",
                )}
              >
                {done ? (
                  <Check className="size-4" />
                ) : (
                  <span className="text-xs font-semibold">{i + 1}</span>
                )}
              </span>
              {i < steps.length - 1 && (
                <span
                  className={cn(
                    "absolute top-8 h-[calc(100%+0.5rem)] w-0.5",
                    done ? "bg-success" : "bg-border",
                  )}
                />
              )}
            </div>
            <div className="pb-1">
              <p
                className={cn(
                  "text-sm font-medium",
                  active ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {STEP_LABEL[step] ?? titleCase(step)}
              </p>
              <p className="text-xs text-muted-foreground">
                {done ? "Completed" : active ? "In progress" : "Pending"}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
