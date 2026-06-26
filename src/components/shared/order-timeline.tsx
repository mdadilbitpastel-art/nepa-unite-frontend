import { Check } from "lucide-react";
import { ORDER_LIFECYCLE } from "@/lib/constants";
import { cn, titleCase } from "@/lib/utils";
import type { OrderStatus } from "@/types";

/** Elegant horizontal/vertical order lifecycle timeline. */
export function OrderTimeline({ status }: { status: OrderStatus }) {
  if (status === "cancelled") {
    return (
      <div className="rounded-xl border border-danger/20 bg-danger/5 p-4 text-sm font-medium text-danger">
        This order was cancelled.
      </div>
    );
  }
  const currentIndex = ORDER_LIFECYCLE.indexOf(status);

  return (
    <ol className="relative space-y-6">
      {ORDER_LIFECYCLE.map((step, i) => {
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
                  !done && !active && "border-border bg-card text-muted-foreground",
                )}
              >
                {done ? (
                  <Check className="size-4" />
                ) : (
                  <span className="text-xs font-semibold">{i + 1}</span>
                )}
              </span>
              {i < ORDER_LIFECYCLE.length - 1 && (
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
                {titleCase(step)}
              </p>
              <p className="text-xs text-muted-foreground">
                {done
                  ? "Completed"
                  : active
                    ? "In progress"
                    : "Pending"}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
