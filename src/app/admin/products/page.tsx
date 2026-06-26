"use client";

import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/shared/data-table";
import { TableSkeleton, ErrorState } from "@/components/shared/states";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProducts } from "@/features/products/use-products";
import { formatCurrency, formatNumber, titleCase } from "@/lib/utils";
import type { Product, ProductStatus } from "@/types";

const LOW_STOCK_THRESHOLD = 10;

const PRODUCT_STATUS_VARIANT: Record<
  ProductStatus,
  "success" | "muted" | "danger"
> = {
  active: "success",
  inactive: "muted",
  deleted: "danger",
};

export default function AdminProductsPage() {
  const { data, isLoading, isError, refetch } = useProducts();
  const [statusFilter, setStatusFilter] = useState<ProductStatus | "all">(
    "all",
  );
  const [lowStockOnly, setLowStockOnly] = useState(false);

  const rows = useMemo(() => {
    let list = data ?? [];
    if (statusFilter !== "all")
      list = list.filter((p) => p.status === statusFilter);
    if (lowStockOnly)
      list = list.filter((p) => p.inventory_count <= LOW_STOCK_THRESHOLD);
    return list;
  }, [data, statusFilter, lowStockOnly]);

  const columns = useMemo<ColumnDef<Product>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Product",
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate font-medium">{row.original.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {row.original.description}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "sku",
        header: "SKU",
        cell: ({ row }) => (
          <span className="font-mono text-xs text-muted-foreground">
            {row.original.sku}
          </span>
        ),
      },
      {
        id: "seller",
        header: "Seller",
        accessorFn: (p) => p.seller,
        cell: ({ row }) => (
          <span className="font-mono text-xs text-muted-foreground">
            {row.original.seller.slice(0, 8)}
          </span>
        ),
      },
      {
        accessorKey: "price",
        header: "Price",
        cell: ({ row }) => (
          <span className="font-medium">
            {formatCurrency(row.original.price)}
          </span>
        ),
      },
      {
        accessorKey: "inventory_count",
        header: "Inventory",
        cell: ({ row }) => {
          const count = row.original.inventory_count;
          const low = count <= LOW_STOCK_THRESHOLD;
          return (
            <div className="flex items-center gap-2">
              <span className="tabular-nums">{formatNumber(count)}</span>
              {low && (
                <Badge variant={count === 0 ? "danger" : "warning"}>
                  {count === 0 ? "Out of stock" : "Low"}
                </Badge>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge variant={PRODUCT_STATUS_VARIANT[row.original.status]} dot>
            {titleCase(row.original.status)}
          </Badge>
        ),
      },
    ],
    [],
  );

  if (isError) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Products"
          description="Catalog oversight across all sellers."
        />
        <ErrorState
          message="Could not load products."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products"
        description="Marketplace-wide catalog oversight across all sellers."
      />

      {isLoading ? (
        <TableSkeleton rows={8} />
      ) : (
        <DataTable
          columns={columns}
          data={rows}
          searchable
          searchPlaceholder="Search by name, SKU, or description…"
          emptyTitle="No products found"
          emptyDescription="Try adjusting the status or stock filters."
          toolbar={
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-1.5">
                <Switch
                  id="low-stock"
                  checked={lowStockOnly}
                  onCheckedChange={setLowStockOnly}
                />
                <Label htmlFor="low-stock" className="cursor-pointer text-sm">
                  Low stock only
                </Label>
              </div>
              <Select
                value={statusFilter}
                onValueChange={(v) =>
                  setStatusFilter(v as ProductStatus | "all")
                }
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="deleted">Deleted</SelectItem>
                </SelectContent>
              </Select>
            </div>
          }
        />
      )}
    </div>
  );
}
