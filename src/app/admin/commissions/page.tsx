"use client";

import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import {
  Plus,
  Pencil,
  Trash2,
  Percent,
  TrendingUp,
  RotateCcw,
  Wallet,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { KpiCard } from "@/components/shared/kpi-card";
import { KpiSkeletonGrid, TableSkeleton } from "@/components/shared/states";
import { DataTable } from "@/components/shared/data-table";
import { CommissionStatusBadge } from "@/components/shared/status-badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Field } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  useCommissionRates,
  useCreateCommissionRate,
  useUpdateCommissionRate,
  useDeleteCommissionRate,
} from "@/features/commissions/use-commissions";
import { commissionRateSchema } from "@/lib/validations";
import { formatCurrency, formatDate, formatPercent } from "@/lib/utils";
import type {
  Commission,
  CommissionRate,
  CommissionStatus,
} from "@/types";

type RateForm = z.infer<typeof commissionRateSchema>;

function LedgerTab() {
  const [statusFilter, setStatusFilter] = useState<CommissionStatus | "all">(
    "all",
  );
  const [seller, setSeller] = useState("");

  const params = useMemo(
    () => ({
      ...(statusFilter !== "all" ? { status: statusFilter } : {}),
      ...(seller ? { seller } : {}),
    }),
    [statusFilter, seller],
  );

  const { data, isLoading } = useCommissions(params);

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
          <Badge variant="muted">{row.original.category}</Badge>
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
        cell: ({ row }) => formatPercent(row.original.rate_percent),
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
    <div className="space-y-4">
      {isLoading ? (
        <TableSkeleton rows={8} />
      ) : (
        <DataTable
          columns={columns}
          data={data ?? []}
          searchable
          searchPlaceholder="Search by seller or category…"
          emptyTitle="No commissions"
          emptyDescription="No ledger entries match these filters."
          toolbar={
            <div className="flex gap-2">
              <Input
                value={seller}
                onChange={(e) => setSeller(e.target.value)}
                placeholder="Seller ID…"
                className="w-[180px]"
              />
              <Select
                value={statusFilter}
                onValueChange={(v) =>
                  setStatusFilter(v as CommissionStatus | "all")
                }
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="earned">Earned</SelectItem>
                  <SelectItem value="reversed">Reversed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          }
        />
      )}
    </div>
  );
}

function RateScheduleTab() {
  const { data: rates, isLoading } = useCommissionRates();
  const create = useCreateCommissionRate();
  const update = useUpdateCommissionRate();
  const remove = useDeleteCommissionRate();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CommissionRate | null>(null);
  const [deleting, setDeleting] = useState<CommissionRate | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RateForm>({ resolver: zodResolver(commissionRateSchema) });

  function openCreate() {
    setEditing(null);
    reset({ category: "", percent: "", min_fee: "" });
    setDialogOpen(true);
  }

  function openEdit(rate: CommissionRate) {
    setEditing(rate);
    reset({
      category: rate.category,
      percent: rate.percent,
      min_fee: rate.min_fee,
    });
    setDialogOpen(true);
  }

  function onSubmit(values: RateForm) {
    if (editing) {
      update.mutate(
        { id: editing.id, body: values },
        { onSuccess: () => setDialogOpen(false) },
      );
    } else {
      create.mutate(values, { onSuccess: () => setDialogOpen(false) });
    }
  }

  const columns = useMemo<ColumnDef<CommissionRate>[]>(
    () => [
      {
        accessorKey: "category",
        header: "Category",
        cell: ({ row }) => (
          <span className="font-medium">{row.original.category}</span>
        ),
      },
      {
        accessorKey: "percent",
        header: "Rate",
        cell: ({ row }) => formatPercent(row.original.percent),
      },
      {
        accessorKey: "min_fee",
        header: "Min Fee",
        cell: ({ row }) => formatCurrency(row.original.min_fee),
      },
      {
        accessorKey: "is_active",
        header: "Status",
        cell: ({ row }) => (
          <Badge variant={row.original.is_active ? "success" : "muted"} dot>
            {row.original.is_active ? "Active" : "Inactive"}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex justify-end gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => openEdit(row.original)}
            >
              <Pencil className="size-4" />
              <span className="sr-only">Edit</span>
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-danger hover:text-danger"
              onClick={() => setDeleting(row.original)}
            >
              <Trash2 className="size-4" />
              <span className="sr-only">Delete</span>
            </Button>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="brand" onClick={openCreate}>
          <Plus className="size-4" />
          Add rate
        </Button>
      </div>

      {isLoading ? (
        <TableSkeleton rows={6} />
      ) : (
        <DataTable
          columns={columns}
          data={rates ?? []}
          emptyTitle="No rates configured"
          emptyDescription="Categories without a rate are commission-free."
        />
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit rate" : "Add category rate"}
            </DialogTitle>
          </DialogHeader>
          <form
            id="rate-form"
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <Field label="Category" required error={errors.category?.message}>
              <Input
                placeholder="e.g. Lighting"
                {...register("category")}
                disabled={!!editing}
              />
            </Field>
            <Field
              label="Rate percent"
              required
              error={errors.percent?.message}
              hint="Snapshotted on each ledger row; affects future orders only."
            >
              <Input placeholder="8.00" {...register("percent")} />
            </Field>
            <Field label="Minimum fee" error={errors.min_fee?.message}>
              <Input placeholder="0.00" {...register("min_fee")} />
            </Field>
          </form>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="rate-form"
              variant="brand"
              loading={create.isPending || update.isPending}
            >
              {editing ? "Save changes" : "Create rate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete rate?"
        description={
          deleting
            ? `"${deleting.category}" will become commission-free for future orders.`
            : undefined
        }
        confirmLabel="Delete"
        destructive
        loading={remove.isPending}
        onConfirm={() => {
          if (!deleting) return;
          remove.mutate(deleting.id, { onSuccess: () => setDeleting(null) });
        }}
      />
    </div>
  );
}

export default function AdminCommissionsPage() {
  const { data: summary, isLoading } = useCommissionSummary();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Commissions"
        description="Category-based referral fee ledger and rate schedule."
      />

      {isLoading ? (
        <KpiSkeletonGrid count={4} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            index={0}
            label="Earned to date"
            value={formatCurrency(summary?.earned_total ?? 0)}
            icon={Wallet}
            accent="success"
            hint="Realized platform revenue"
          />
          <KpiCard
            index={1}
            label="Pending"
            value={formatCurrency(summary?.pending.total ?? 0)}
            icon={Percent}
            accent="warning"
            hint={`${summary?.pending.count ?? 0} booked`}
          />
          <KpiCard
            index={2}
            label="Earned"
            value={formatCurrency(summary?.earned.total ?? 0)}
            icon={TrendingUp}
            accent="teal"
            hint={`${summary?.earned.count ?? 0} delivered`}
          />
          <KpiCard
            index={3}
            label="Reversed"
            value={formatCurrency(summary?.reversed.total ?? 0)}
            icon={RotateCcw}
            accent="danger"
            hint={`${summary?.reversed.count ?? 0} refunded`}
          />
        </div>
      )}

      <Tabs defaultValue="ledger">
        <TabsList>
          <TabsTrigger value="ledger">Ledger</TabsTrigger>
          <TabsTrigger value="rates">Rate Schedule</TabsTrigger>
        </TabsList>
        <TabsContent value="ledger">
          <LedgerTab />
        </TabsContent>
        <TabsContent value="rates">
          <RateScheduleTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
