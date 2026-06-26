"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import {
  PlusCircle,
  Upload,
  Pencil,
  Trash2,
  Package,
  FileUp,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/shared/data-table";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  useDeleteProduct,
} from "@/features/products/use-products";
import { productService, jobService } from "@/services";
import { useAuth } from "@/hooks/use-auth";
import { ApiError } from "@/lib/axios";
import { formatCurrency, titleCase } from "@/lib/utils";
import { isLowStock } from "@/lib/seller-metrics";
import type { Product, Job } from "@/types";

export default function SellerProductsPage() {
  const { user } = useAuth();
  const sellerId = user?.id ?? "";
  const router = useRouter();
  const qc = useQueryClient();
  const { data: products, isLoading } = useProductsBySeller(sellerId);
  const del = useDeleteProduct();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [toDelete, setToDelete] = useState<Product | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);

  const filtered = useMemo(() => {
    let list = products ?? [];
    if (statusFilter !== "all") {
      list = list.filter((p) => p.status === statusFilter);
    }
    return list;
  }, [products, statusFilter]);

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
          const p = row.original;
          return (
            <div className="flex items-center gap-2">
              <span className="tabular-nums">{p.inventory_count}</span>
              {isLowStock(p) && (
                <Badge variant={p.inventory_count === 0 ? "danger" : "warning"}>
                  {p.inventory_count === 0 ? "Out" : "Low"}
                </Badge>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const s = row.original.status;
          return (
            <Badge
              variant={
                s === "active" ? "success" : s === "inactive" ? "muted" : "danger"
              }
              dot
            >
              {titleCase(s)}
            </Badge>
          );
        },
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const p = row.original;
          return (
            <div className="flex items-center justify-end gap-1">
              <Button
                asChild
                variant="ghost"
                size="icon-sm"
                aria-label="Edit product"
              >
                <Link href={`/seller/products/${p.id}/edit`}>
                  <Pencil className="size-4" />
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Delete product"
                onClick={() => setToDelete(p)}
                className="text-danger hover:text-danger"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          );
        },
      },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products"
        description="Manage your catalog, pricing, and stock."
        actions={
          <>
            <Button variant="outline" onClick={() => setBulkOpen(true)}>
              <Upload className="size-4" /> Bulk upload
            </Button>
            <Button asChild variant="brand">
              <Link href="/seller/products/new">
                <PlusCircle className="size-4" /> Add product
              </Link>
            </Button>
          </>
        }
      />

      <DataTable
        columns={columns}
        data={filtered}
        loading={isLoading}
        searchable
        searchPlaceholder="Search products…"
        globalFilter={search}
        onGlobalFilterChange={setSearch}
        onRowClick={(p) => router.push(`/seller/products/${p.id}/edit`)}
        emptyTitle="No products yet"
        emptyDescription="Add a product or bulk-upload a CSV to get started."
        toolbar={
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="deleted">Deleted</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Delete product?"
        description={
          toDelete
            ? `"${toDelete.name}" will be removed from your catalog. This cannot be undone.`
            : undefined
        }
        confirmLabel="Delete"
        destructive
        loading={del.isPending}
        onConfirm={() => {
          if (!toDelete) return;
          del.mutate(toDelete.id, { onSettled: () => setToDelete(null) });
        }}
      />

      <BulkUploadDialog
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        onDone={() =>
          qc.invalidateQueries({ queryKey: ["products"] })
        }
      />
    </div>
  );
}

function BulkUploadDialog({
  open,
  onOpenChange,
  onDone,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onDone: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [job, setJob] = useState<Job | null>(null);
  const [uploading, setUploading] = useState(false);

  const terminal = (s: Job["status"]) =>
    s === "success" || s === "done" || s === "failed";

  const reset = () => {
    setFile(null);
    setJob(null);
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  const poll = async (jobId: string) => {
    // Poll until terminal or ~30s.
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 1000));
      try {
        const j = await jobService.get(jobId);
        setJob(j);
        if (terminal(j.status)) {
          if (j.status === "failed") {
            toast.error("Bulk upload failed");
          } else {
            toast.success("Bulk upload complete");
            onDone();
          }
          return;
        }
      } catch {
        // keep polling
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const created = await productService.bulkUpload(file);
      setJob(created);
      await poll(created.id);
    } catch (e) {
      toast.error((e as ApiError).message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Bulk upload products</DialogTitle>
          <DialogDescription>
            Upload a CSV file (≤10&nbsp;MB) to import multiple products at once.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-muted/30 px-6 py-10 text-center transition-colors hover:border-brand/40 hover:bg-accent/40"
          >
            <FileUp className="size-7 text-brand" />
            <span className="text-sm font-medium">
              {file ? file.name : "Choose a CSV file"}
            </span>
            <span className="text-xs text-muted-foreground">
              {file
                ? `${(file.size / 1024).toFixed(0)} KB`
                : "Click to browse"}
            </span>
          </button>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              setFile(e.target.files?.[0] ?? null);
              setJob(null);
            }}
          />

          {job && (
            <div className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2 text-sm">
              {!terminal(job.status) ? (
                <Loader2 className="size-4 animate-spin text-brand" />
              ) : null}
              <span className="text-muted-foreground">Job status:</span>
              <Badge
                variant={
                  job.status === "failed"
                    ? "danger"
                    : job.status === "success" || job.status === "done"
                      ? "success"
                      : "info"
                }
              >
                {titleCase(job.status)}
              </Badge>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button
            variant="brand"
            disabled={!file}
            loading={uploading}
            onClick={handleUpload}
          >
            <Upload className="size-4" /> Upload
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
