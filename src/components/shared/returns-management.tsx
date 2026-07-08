"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Package, RotateCcw } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ListCardSkeleton, ErrorState } from "@/components/shared/states";
import { ReturnStatusBadge } from "@/components/shared/status-badge";
import { ReturnManageDialog } from "@/components/shared/return-manage-dialog";
import { Button } from "@/components/ui/button";
import { useReturns } from "@/features/returns/use-returns";
import { cn, formatCurrency, formatDate, titleCase } from "@/lib/utils";
import type { ReturnRequest, ReturnStatus } from "@/types";

const OPEN: ReturnStatus[] = [
  "requested",
  "approved",
  "pickup_scheduled",
  "picked_up",
  "received",
  "exchange_shipped",
];
const CLOSED: ReturnStatus[] = [
  "refunded",
  "exchange_completed",
  "rejected",
  "cancelled",
];

type Tab = "action" | "open" | "closed" | "all";
const TABS: { key: Tab; label: string }[] = [
  { key: "action", label: "Action needed" },
  { key: "open", label: "In progress" },
  { key: "closed", label: "Closed" },
  { key: "all", label: "All" },
];

export function ReturnsManagement({
  title = "Returns & exchanges",
  description = "Approve, arrange pickup, and refund returns.",
}: {
  title?: string;
  description?: string;
}) {
  const { data, isLoading, isError, refetch } = useReturns();
  const [tab, setTab] = useState<Tab>("action");
  const [manageId, setManageId] = useState<string | null>(null);

  const rows = useMemo(() => {
    const all = data ?? [];
    if (tab === "all") return all;
    if (tab === "closed") return all.filter((r) => CLOSED.includes(r.status));
    if (tab === "action") return all.filter((r) => r.status === "requested");
    return all.filter(
      (r) => OPEN.includes(r.status) && r.status !== "requested",
    );
  }, [data, tab]);

  const actionCount = (data ?? []).filter(
    (r) => r.status === "requested",
  ).length;

  return (
    <div className="space-y-6">
      <PageHeader title={title} description={description} />

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-1 rounded-xl border bg-card p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              tab === t.key
                ? "bg-brand text-brand-foreground"
                : "text-muted-foreground hover:bg-muted",
            )}
          >
            {t.label}
            {t.key === "action" && actionCount > 0 && (
              <span
                className={cn(
                  "grid min-w-5 place-items-center rounded-full px-1 text-xs font-bold",
                  tab === t.key
                    ? "bg-white/20"
                    : "bg-warning/15 text-warning",
                )}
              >
                {actionCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : isLoading ? (
        <ListCardSkeleton />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={RotateCcw}
          title="Nothing here"
          description="Returns and exchanges will appear here as buyers raise them."
        />
      ) : (
        <div className="divide-y rounded-xl border bg-card">
          {rows.map((r) => (
            <ReturnRow key={r.id} r={r} onManage={() => setManageId(r.id)} />
          ))}
        </div>
      )}

      {manageId && (
        <ReturnManageDialog
          returnId={manageId}
          open={!!manageId}
          onOpenChange={(o) => !o && setManageId(null)}
        />
      )}
    </div>
  );
}

function ReturnRow({
  r,
  onManage,
}: {
  r: ReturnRequest;
  onManage: () => void;
}) {
  const actionable = r.status === "requested";
  return (
    <div className="flex items-center gap-4 p-4">
      <div className="relative size-12 shrink-0 overflow-hidden rounded-lg border bg-muted">
        {r.product_image_url ? (
          <Image
            src={r.product_image_url}
            alt=""
            fill
            sizes="48px"
            className="object-cover"
          />
        ) : (
          <div className="grid h-full place-items-center text-muted-foreground">
            <Package className="size-5" />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">
          {r.product_name}
        </p>
        <p className="text-xs text-muted-foreground">
          {titleCase(r.type)} · Qty {r.quantity} ·{" "}
          {titleCase(r.reason.replace(/_/g, " "))} · {formatDate(r.created_at)}
        </p>
        <div className="mt-1.5">
          <ReturnStatusBadge status={r.status} label={r.status_display} />
        </div>
      </div>
      <div className="hidden text-right sm:block">
        {r.type === "return" && (
          <p className="text-sm font-semibold text-foreground">
            {formatCurrency(r.refund_amount)}
          </p>
        )}
      </div>
      <Button
        size="sm"
        variant={actionable ? "brand" : "outline"}
        onClick={onManage}
      >
        {actionable ? "Review" : "Manage"}
      </Button>
    </div>
  );
}
