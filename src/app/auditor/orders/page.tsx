"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { ClipboardList } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/shared/data-table";
import { OrderStatusBadge } from "@/components/shared/status-badge";
import { ErrorState } from "@/components/shared/states";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useOrders } from "@/features/orders/use-orders";
import { ORDER_LIFECYCLE } from "@/lib/constants";
import { formatCurrency, formatDate, titleCase } from "@/lib/utils";
import type { Order, OrderStatus } from "@/types";

const ALL_STATUSES: OrderStatus[] = [...ORDER_LIFECYCLE, "cancelled"];

export default function AuditorOrdersPage() {
  const router = useRouter();
  const { data: orders, isLoading, isError, refetch } = useOrders();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");

  const filtered = useMemo(() => {
    const list = orders ?? [];
    return status === "all" ? list : list.filter((o) => o.status === status);
  }, [orders, status]);

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
        accessorKey: "buyer",
        header: "Buyer",
        cell: ({ row }) => (
          <span className="font-mono text-xs text-muted-foreground">
            {row.original.buyer.slice(0, 8)}…
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Order Tracking"
        description="Read-only view of every order moving through the marketplace."
        actions={
          <Badge variant="muted" className="px-3 py-1.5">
            <ClipboardList className="size-3.5" /> {filtered.length} orders
          </Badge>
        }
      />

      {isError ? (
        <ErrorState
          message="Could not load orders."
          onRetry={() => refetch()}
        />
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          loading={isLoading}
          searchable
          searchPlaceholder="Search by order or buyer id…"
          globalFilter={search}
          onGlobalFilterChange={setSearch}
          onRowClick={(o) => router.push(`/auditor/orders/${o.id}`)}
          toolbar={
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[170px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {ALL_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {titleCase(s)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          }
          emptyTitle="No orders"
          emptyDescription="No orders match the selected filters."
        />
      )}
    </div>
  );
}
