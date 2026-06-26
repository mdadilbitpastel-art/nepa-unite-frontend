"use client";

import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Percent, TrendingUp, Clock, RotateCcw } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { KpiCard } from "@/components/shared/kpi-card";
import { KpiSkeletonGrid, ErrorState } from "@/components/shared/states";
import { DataTable } from "@/components/shared/data-table";
import { CommissionStatusBadge } from "@/components/shared/status-badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useCommissions,
  useCommissionSummary,
} from "@/features/commissions/use-commissions";
import { formatCurrency, formatDate, formatPercent, titleCase } from "@/lib/utils";
import type { Commission, CommissionStatus } from "@/types";

const STATUSES: CommissionStatus[] = ["pending", "earned", "reversed"];

export default function AuditorCommissionsPage() {
  const [status, setStatus] = useState<string>("all");
  const [search, setSearch] = useState("");
  const {
    data: commissions,
    isLoading,
    isError,
    refetch,
  } = useCommissions(status === "all" ? undefined : { status });
  const { data: summary } = useCommissionSummary();

  const columns = useMemo<ColumnDef<Commission>[]>(
    () => [
      {
        accessorKey: "seller_email",
        header: "Seller",
        cell: ({ row }) => (
          <span className="text-sm font-medium">
            {row.original.seller_email}
          </span>
        ),
      },
      {
        accessorKey: "category",
        header: "Category",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.category || "—"}
          </span>
        ),
      },
      {
        accessorKey: "base_amount",
        header: "Base",
        cell: ({ row }) => formatCurrency(row.original.base_amount),
      },
      {
        accessorKey: "rate_percent",
        header: "Rate",
        cell: ({ row }) => (
          <span className="text-sm">
            {formatPercent(row.original.rate_percent)}
          </span>
        ),
      },
      {
        accessorKey: "commission_amount",
        header: "Commission",
        cell: ({ row }) => (
          <span className="font-medium">
            {formatCurrency(row.original.commission_amount)}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <CommissionStatusBadge status={row.original.status} />
        ),
      },
      {
        accessorKey: "created_at",
        header: "Booked",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {formatDate(row.original.created_at)}
          </span>
        ),
      },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Commission Ledger"
        description="Read-only ledger of category-based referral fees."
      />

      {!summary ? (
        <KpiSkeletonGrid count={4} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            index={0}
            label="Earned to Date"
            value={formatCurrency(summary.earned_total)}
            icon={TrendingUp}
            accent="success"
            hint="Realised commission"
          />
          <KpiCard
            index={1}
            label="Pending"
            value={formatCurrency(summary.pending.total)}
            icon={Clock}
            accent="warning"
            hint={`${summary.pending.count} entries`}
          />
          <KpiCard
            index={2}
            label="Earned"
            value={formatCurrency(summary.earned.total)}
            icon={Percent}
            accent="teal"
            hint={`${summary.earned.count} entries`}
          />
          <KpiCard
            index={3}
            label="Reversed"
            value={formatCurrency(summary.reversed.total)}
            icon={RotateCcw}
            accent="danger"
            hint={`${summary.reversed.count} entries`}
          />
        </div>
      )}

      {isError ? (
        <ErrorState
          message="Could not load the commission ledger."
          onRetry={() => refetch()}
        />
      ) : (
        <DataTable
          columns={columns}
          data={commissions ?? []}
          loading={isLoading}
          searchable
          searchPlaceholder="Search seller or category…"
          globalFilter={search}
          onGlobalFilterChange={setSearch}
          toolbar={
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {titleCase(s)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          }
          emptyTitle="No commission entries"
          emptyDescription="No ledger rows match the selected filters."
        />
      )}
    </div>
  );
}
