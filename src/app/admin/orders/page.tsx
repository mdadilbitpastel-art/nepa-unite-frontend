"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { Download } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/shared/data-table";
import { TableSkeleton, ErrorState } from "@/components/shared/states";
import { OrderStatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useOrders } from "@/features/orders/use-orders";
import { exportToCsv } from "@/lib/csv";
import { formatCurrency, formatDate, titleCase } from "@/lib/utils";
import type { Order, OrderStatus } from "@/types";

const ORDER_STATUSES: OrderStatus[] = [
  "draft",
  "confirmed",
  "fulfillment",
  "shipped",
  "delivered",
  "closed",
  "cancelled",
];

export default function AdminOrdersPage() {
  const router = useRouter();
  const { data, isLoading, isError, refetch } = useOrders();

  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const rows = useMemo(() => {
    let list = data ?? [];
    if (statusFilter !== "all")
      list = list.filter((o) => o.status === statusFilter);
    if (from) {
      const fromTs = new Date(from).getTime();
      list = list.filter((o) => new Date(o.created_at).getTime() >= fromTs);
    }
    if (to) {
      const toTs = new Date(to).getTime() + 24 * 60 * 60 * 1000 - 1;
      list = list.filter((o) => new Date(o.created_at).getTime() <= toTs);
    }
    return list;
  }, [data, statusFilter, from, to]);

  const columns = useMemo<ColumnDef<Order>[]>(
    () => [
      {
        accessorKey: "id",
        header: "Order",
        cell: ({ row }) => (
          <span className="font-mono text-sm font-medium">
            #{row.original.id.slice(0, 8).toUpperCase()}
          </span>
        ),
      },
      {
        id: "buyer",
        header: "Buyer",
        accessorFn: (o) => o.buyer,
        cell: ({ row }) => (
          <span className="font-mono text-xs text-muted-foreground">
            {row.original.buyer.slice(0, 8)}
          </span>
        ),
      },
      {
        id: "items",
        header: "Items",
        accessorFn: (o) => o.items?.length ?? 0,
        cell: ({ row }) => (
          <span className="tabular-nums">
            {row.original.items?.length ?? 0}
          </span>
        ),
      },
      {
        accessorKey: "total_amount",
        header: "Total",
        cell: ({ row }) => (
          <span className="font-medium">
            {formatCurrency(row.original.total_amount)}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <OrderStatusBadge status={row.original.status} />,
      },
      {
        accessorKey: "created_at",
        header: "Date",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {formatDate(row.original.created_at)}
          </span>
        ),
      },
    ],
    [],
  );

  function handleExport() {
    exportToCsv("orders.csv", rows, [
      { header: "Order ID", accessor: (o) => o.id },
      { header: "Buyer", accessor: (o) => o.buyer },
      { header: "Items", accessor: (o) => o.items?.length ?? 0 },
      { header: "Total", accessor: (o) => o.total_amount },
      { header: "Status", accessor: (o) => o.status },
      { header: "Date", accessor: (o) => formatDate(o.created_at) },
    ]);
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <PageHeader title="Orders" description="All marketplace orders." />
        <ErrorState message="Could not load orders." onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Orders"
        description="Every order placed across the marketplace."
        actions={
          <Button variant="outline" onClick={handleExport}>
            <Download className="size-4" />
            Export CSV
          </Button>
        }
      />

      <div className="flex flex-wrap items-end gap-3 rounded-xl border bg-card p-4 shadow-card">
        <div className="space-y-1.5">
          <Label className="text-xs">Status</Label>
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as OrderStatus | "all")}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {ORDER_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {titleCase(s)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs" htmlFor="from">
            From
          </Label>
          <Input
            id="from"
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="w-[160px]"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs" htmlFor="to">
            To
          </Label>
          <Input
            id="to"
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-[160px]"
          />
        </div>
        {(statusFilter !== "all" || from || to) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setStatusFilter("all");
              setFrom("");
              setTo("");
            }}
          >
            Clear
          </Button>
        )}
      </div>

      {isLoading ? (
        <TableSkeleton rows={8} />
      ) : (
        <DataTable
          columns={columns}
          data={rows}
          searchable
          searchPlaceholder="Search by order or buyer id…"
          onRowClick={(o) => router.push(`/admin/orders/${o.id}`)}
          emptyTitle="No orders found"
          emptyDescription="Try adjusting the status or date filters."
        />
      )}
    </div>
  );
}
