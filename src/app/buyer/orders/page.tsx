"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { ShoppingBag } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/shared/data-table";
import { TableSkeleton, ErrorState } from "@/components/shared/states";
import { EmptyState } from "@/components/shared/empty-state";
import { OrderStatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useOrders } from "@/features/orders/use-orders";
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

export default function BuyerOrdersPage() {
  const router = useRouter();
  const { data, isLoading, isError, refetch } = useOrders();
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");

  const rows = useMemo(() => {
    const list = data ?? [];
    return statusFilter === "all"
      ? list
      : list.filter((o) => o.status === statusFilter);
  }, [data, statusFilter]);

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
        id: "items",
        header: "Items",
        accessorFn: (o) => o.items?.length ?? 0,
        cell: ({ row }) => (
          <span className="tabular-nums">{row.original.items?.length ?? 0}</span>
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

  if (isError) {
    return (
      <div className="space-y-6">
        <PageHeader title="Orders" description="Track your purchases." />
        <ErrorState message="Could not load your orders." onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Orders"
        description="Track and manage your purchases."
        actions={
          <Button asChild variant="outline">
            <Link href="/buyer/products">Browse products</Link>
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
            <SelectTrigger className="w-[180px]">
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
        {statusFilter !== "all" && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setStatusFilter("all")}
          >
            Clear
          </Button>
        )}
      </div>

      {isLoading ? (
        <TableSkeleton rows={8} />
      ) : (data ?? []).length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="No orders yet"
          description="Browse the marketplace and place your first order."
          action={
            <Button asChild variant="brand">
              <Link href="/buyer/products">Start shopping</Link>
            </Button>
          }
        />
      ) : (
        <DataTable
          columns={columns}
          data={rows}
          searchable
          searchPlaceholder="Search by order id…"
          onRowClick={(o) => router.push(`/buyer/orders/${o.id}`)}
          emptyTitle="No orders found"
          emptyDescription="Try adjusting the status filter."
        />
      )}
    </div>
  );
}
