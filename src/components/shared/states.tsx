import { Loader2, AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn("size-4 animate-spin", className)} />;
}

export function PageLoader({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-muted-foreground">
      <Spinner className="size-6 text-brand" />
      <span className="text-sm">{label}</span>
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-danger/20 bg-danger/5 px-6 py-12 text-center">
      <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-danger/10 text-danger">
        <AlertTriangle className="size-6" />
      </div>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      {message && (
        <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">{message}</p>
      )}
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-5" onClick={onRetry}>
          <RefreshCw className="size-4" />
          Try again
        </Button>
      )}
    </div>
  );
}

/** Reusable KPI skeleton grid for dashboard loading. */
export function KpiSkeletonGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border bg-card p-6 shadow-card">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="mt-4 h-8 w-32" />
          <Skeleton className="mt-3 h-3 w-20" />
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-3 rounded-xl border bg-card p-4">
      <Skeleton className="h-9 w-full" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}

/** Product detail skeleton — mirrors the gallery + buy box + description/specs
 * layout so the page reflows minimally once data loads. */
export function ProductDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* breadcrumb */}
      <Skeleton className="h-4 w-64" />

      <div className="grid gap-8 lg:grid-cols-[330px_minmax(0,1fr)]">
        {/* gallery */}
        <Skeleton className="mx-auto aspect-square w-full max-w-[330px] rounded-xl" />

        {/* buy box */}
        <div className="space-y-5">
          <div className="space-y-2">
            <Skeleton className="h-5 w-24 rounded-md" />
            <Skeleton className="h-7 w-3/4" />
            <Skeleton className="h-4 w-40" />
          </div>
          <Skeleton className="h-8 w-32" />
          <div className="flex gap-6">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-40 rounded-lg" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-36 rounded-md" />
            <Skeleton className="h-10 w-28 rounded-md" />
          </div>
        </div>
      </div>

      {/* description + specs */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-3 rounded-xl border bg-card p-5 shadow-card lg:col-span-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        <div className="space-y-3 rounded-xl border bg-card p-5 shadow-card">
          <Skeleton className="h-5 w-32" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex justify-between gap-4">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Product/wishlist card grid skeleton — mirrors the real card layout
 * (square image, title, price, action row) and the 2→3→4→5 column grid. */
export function CardGridSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col overflow-hidden rounded-xl border bg-card shadow-card"
        >
          <Skeleton className="aspect-square w-full rounded-none" />
          <div className="flex flex-1 flex-col gap-1.5 p-3">
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="mt-1 h-5 w-1/3" />
            <div className="mt-0.5 flex items-center gap-2">
              <Skeleton className="h-9 flex-1 rounded-md" />
              <Skeleton className="size-9 rounded-md" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/** A card with a title and a large chart placeholder. */
export function ChartCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-xl border bg-card p-6 shadow-card", className)}>
      <Skeleton className="h-5 w-40" />
      <Skeleton className="mt-2 h-3 w-56" />
      <Skeleton className="mt-5 h-[240px] w-full rounded-lg" />
    </div>
  );
}

/** A card with a title and a list of avatar + text + trailing rows. */
export function ListCardSkeleton({
  rows = 5,
  className,
}: {
  rows?: number;
  className?: string;
}) {
  return (
    <div className={cn("rounded-xl border bg-card p-6 shadow-card", className)}>
      <Skeleton className="h-5 w-40" />
      <div className="mt-4 divide-y">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-3">
            <Skeleton className="size-10 shrink-0 rounded-lg" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-1/3" />
            </div>
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Full dashboard skeleton — header + KPI row + chart row + a list card. */
export function DashboardSkeleton({ kpis = 4 }: { kpis?: number }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-7 w-64" />
          <Skeleton className="h-4 w-80" />
        </div>
        <Skeleton className="h-10 w-36 rounded-md" />
      </div>
      <KpiSkeletonGrid count={kpis} />
      <div className="grid gap-6 lg:grid-cols-3">
        <ChartCardSkeleton className="lg:col-span-2" />
        <ChartCardSkeleton />
      </div>
      <ListCardSkeleton />
    </div>
  );
}

/** Detail page skeleton — header row + main column (2/3) + sidebar cards. */
export function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-9 w-24 rounded-md" />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-3 rounded-xl border bg-card p-6 shadow-card lg:col-span-2">
          <Skeleton className="h-5 w-40" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 py-2">
              <Skeleton className="size-12 shrink-0 rounded-lg" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/3" />
              </div>
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
        <div className="space-y-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="space-y-3 rounded-xl border bg-card p-6 shadow-card"
            >
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Cart skeleton — line-item rows card + sticky order-summary card.
 * Render below the (static) PageHeader. */
export function CartSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="divide-y rounded-xl border bg-card shadow-card">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-4">
            <Skeleton className="size-14 shrink-0 rounded-lg" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-1/4" />
            </div>
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-9 w-28 rounded-lg" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="size-8 rounded-md" />
          </div>
        ))}
      </div>
      <div className="space-y-4 rounded-xl border bg-card p-6 shadow-card">
        <Skeleton className="h-5 w-32" />
        <div className="flex justify-between">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="flex justify-between">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="flex justify-between border-t pt-4">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-20" />
        </div>
        <Skeleton className="h-11 w-full rounded-md" />
        <Skeleton className="h-10 w-full rounded-md" />
      </div>
    </div>
  );
}

/** Form skeleton — header + a card of labelled field rows. */
export function FormSkeleton({ fields = 5 }: { fields?: number }) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="space-y-5 rounded-xl border bg-card p-6 shadow-card">
        {Array.from({ length: fields }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
        ))}
        <Skeleton className="h-10 w-32 rounded-md" />
      </div>
    </div>
  );
}
