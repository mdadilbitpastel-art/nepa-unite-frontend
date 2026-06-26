import { cn, formatCurrency } from "@/lib/utils";

const SIZES = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-xl",
  xl: "text-3xl",
} as const;

/** Typographic price. `compareAt` (if higher) renders a strike + savings %. */
export function Price({
  value,
  compareAt,
  size = "md",
  className,
}: {
  value: string | number;
  compareAt?: string | number | null;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const v = typeof value === "string" ? parseFloat(value) : value;
  const c = compareAt == null ? null : typeof compareAt === "string" ? parseFloat(compareAt) : compareAt;
  const hasDeal = c != null && !Number.isNaN(c) && c > v;
  const off = hasDeal ? Math.round(((c! - v) / c!) * 100) : 0;

  return (
    <span className={cn("inline-flex flex-wrap items-baseline gap-x-2", className)}>
      <span className={cn("font-bold tracking-tight tabular-nums text-foreground", SIZES[size])}>
        {formatCurrency(v)}
      </span>
      {hasDeal && (
        <>
          <span className="text-sm text-muted-foreground line-through tabular-nums">
            {formatCurrency(c!)}
          </span>
          <span className="text-sm font-semibold text-success">{off}% off</span>
        </>
      )}
    </span>
  );
}
