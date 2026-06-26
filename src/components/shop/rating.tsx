import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

/** Five-star rating with optional review count. */
export function Rating({
  value,
  count,
  size = 14,
  showValue = false,
  className,
}: {
  value: number;
  count?: number;
  size?: number;
  showValue?: boolean;
  className?: string;
}) {
  const rounded = Math.round(value);
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span className="inline-flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            style={{ width: size, height: size }}
            className={cn(
              i < rounded
                ? "fill-amber-400 text-amber-400"
                : "fill-muted text-muted-foreground/30",
            )}
          />
        ))}
      </span>
      {showValue && value > 0 && (
        <span className="text-xs font-semibold text-foreground tabular-nums">
          {value.toFixed(1)}
        </span>
      )}
      {count !== undefined && (
        <span className="text-xs text-muted-foreground tabular-nums">
          ({count})
        </span>
      )}
    </span>
  );
}
