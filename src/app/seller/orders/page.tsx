"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { Receipt } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/shared/data-table";
import { OrderStatusBadge } from "@/components/shared/status-badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useOrders } from "@/features/orders/use-orders";
import { useAuth } from "@/hooks/use-auth";
import { formatCurrency, formatDate, titleCase } from "@/lib/utils";
import { sellerOrderTotal, sellerItemCount } from "@/lib/seller-metrics";
import { ORDER_LIFECYCLE } from "@/lib/constants";
import type { Order } from "@/types";

export default function SellerOrdersPage() {
  const { user } = useAuth();
  const sellerId = user?.id ?? "";
  const router = useRouter();
  const { data: orders, isLoading } = useOrders();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = useMemo(() => {
    let list = orders ?? [];
    if (statusFilter !== "all") {
      list = list.filter((o) => o.status === statusFilter);
    }
    return [...list].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  }, [orders, statusFilter]);

  const columns: ColumnDef<Order>[] = useMemo(
    () => [
      {
        accessorKey: "id",
        header: "Order",
        cell: ({ row }) => (
          <span className="font-medium">
            #{row.original.id.slice(0, 8).toUpperCase()}
          </span>
        ),
      },
      {
        id: "items",
        header: "Your items",
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {sellerItemCount(row.original, sellerId)} item(s)
          </span>
        ),
      },
      {
        id: "total",
        header: "Your total",
        cell: ({ row }) => (
          <span className="font-medium">
            {formatCurrency(sellerOrderTotal(row.original, sellerId))}
          </span>
        ),
      },
      {
        accessorKey: "created_at",
        header: "Date",
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {formatDate(row.original.created_at)}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <OrderStatusBadge status={row.original.status} />,
      },
    ],
    [sellerId],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Orders"
        description="Orders containing your products — advance fulfillment here."
      />

      <DataTable
        columns={columns}
        data={filtered}
        loading={isLoading}
        searchable
        searchPlaceholder="Search by order ID…"
        globalFilter={search}
        onGlobalFilterChange={setSearch}
        onRowClick={(o) => router.push(`/seller/orders/${o.id}`)}
        emptyTitle="No orders yet"
        emptyDescription="Orders containing your products will appear here."
        toolbar={
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {[...ORDER_LIFECYCLE, "cancelled"].map((s) => (
                <SelectItem key={s} value={s}>
                  {titleCase(s)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />
    </div>
  );
}
