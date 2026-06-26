"use client";

import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  Boxes,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Package,
  Pencil,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { KpiCard } from "@/components/shared/kpi-card";
import { KpiSkeletonGrid } from "@/components/shared/states";
import { DataTable } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Field } from "@/components/shared/form-field";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useProductsBySeller,
  useUpdateProduct,
} from "@/features/products/use-products";
import { useAuth } from "@/hooks/use-auth";
import { formatCurrency } from "@/lib/utils";
import { isLowStock } from "@/lib/seller-metrics";
import type { Product } from "@/types";

export default function SellerInventoryPage() {
  const { user } = useAuth();
  const sellerId = user?.id ?? "";
  const { data: products, isLoading } = useProductsBySeller(sellerId);
  const update = useUpdateProduct();

  const [search, setSearch] = useState("");
  const [adjusting, setAdjusting] = useState<Product | null>(null);
  const [stockValue, setStockValue] = useState("");

  const stats = useMemo(() => {
    const list = products ?? [];
    const low = list.filter((p) => isLowStock(p) && p.inventory_count > 0);
    const out = list.filter((p) => p.inventory_count === 0);
    return {
      total: list.length,
      inStock: list.filter((p) => p.inventory_count > 0).length,
      lowStock: low.length,
      outOfStock: out.length,
    };
  }, [products]);

  const openAdjust = (p: Product) => {
    setAdjusting(p);
    setStockValue(String(p.inventory_count));
  };

  const saveStock = () => {
    if (!adjusting) return;
    const next = parseInt(stockValue, 10);
    if (Number.isNaN(next) || next < 0) return;
    update.mutate(
      { id: adjusting.id, body: { inventory_count: next } },
      { onSuccess: () => setAdjusting(null) },
    );
  };

  const columns: ColumnDef<Product>[] = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Product",
        cell: ({ row }) => {
          const p = row.original;
          return (
            <div className="flex items-center gap-3">
              <Avatar className="size-9 rounded-lg">
                {p.primary_image_url ? (
                  <img
                    src={p.primary_image_url}
                    alt={p.name}
                    className="size-full rounded-lg object-cover"
                  />
                ) : (
                  <AvatarFallback className="rounded-lg bg-brand/10 text-brand">
                    <Package className="size-4" />
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{p.name}</p>
                <p className="text-xs text-muted-foreground">SKU {p.sku}</p>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "inventory_count",
        header: "In stock",
        cell: ({ row }) => (
          <span className="font-medium tabular-nums">
            {row.original.inventory_count}
          </span>
        ),
      },
      {
        accessorKey: "min_order_qty",
        header: "Min order",
        cell: ({ row }) => (
          <span className="tabular-nums text-muted-foreground">
            {row.original.min_order_qty}
          </span>
        ),
      },
      {
        id: "stockStatus",
        header: "Status",
        cell: ({ row }) => {
          const p = row.original;
          if (p.inventory_count === 0) {
            return <Badge variant="danger" dot>Out of stock</Badge>;
          }
          if (isLowStock(p)) {
            return <Badge variant="warning" dot>Low stock</Badge>;
          }
          return <Badge variant="success" dot>In stock</Badge>;
        },
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => openAdjust(row.original)}
            >
              <Pencil className="size-3.5" /> Adjust
            </Button>
          </div>
        ),
      },
    ],
    [],
  );

  // Highlight low/out rows is handled via badges; sort low-stock first.
  const sorted = useMemo(() => {
    return [...(products ?? [])].sort((a, b) => {
      const av = a.inventory_count === 0 ? 0 : isLowStock(a) ? 1 : 2;
      const bv = b.inventory_count === 0 ? 0 : isLowStock(b) ? 1 : 2;
      return av - bv;
    });
  }, [products]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory"
        description="Monitor stock levels and adjust quantities."
      />

      {isLoading ? (
        <KpiSkeletonGrid />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            index={0}
            label="Total SKUs"
            value={stats.total}
            icon={Boxes}
            accent="brand"
          />
          <KpiCard
            index={1}
            label="In Stock"
            value={stats.inStock}
            icon={CheckCircle2}
            accent="success"
          />
          <KpiCard
            index={2}
            label="Low Stock"
            value={stats.lowStock}
            icon={AlertTriangle}
            accent="warning"
          />
          <KpiCard
            index={3}
            label="Out of Stock"
            value={stats.outOfStock}
            icon={XCircle}
            accent="danger"
          />
        </div>
      )}

      <DataTable
        columns={columns}
        data={sorted}
        loading={isLoading}
        searchable
        searchPlaceholder="Search inventory…"
        globalFilter={search}
        onGlobalFilterChange={setSearch}
        emptyTitle="No products"
        emptyDescription="Add products to start tracking inventory."
      />

      <Dialog
        open={!!adjusting}
        onOpenChange={(o) => !o && setAdjusting(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Adjust stock</DialogTitle>
            <DialogDescription>
              {adjusting
                ? `${adjusting.name} · ${formatCurrency(adjusting.price)}`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <Field label="Inventory count" required>
            <Input
              type="number"
              min={0}
              value={stockValue}
              onChange={(e) => setStockValue(e.target.value)}
              autoFocus
            />
          </Field>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjusting(null)}>
              Cancel
            </Button>
            <Button
              variant="brand"
              loading={update.isPending}
              onClick={saveStock}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
