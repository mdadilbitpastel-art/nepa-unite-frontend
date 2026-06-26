"use client";

import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  MoreHorizontal,
  CheckCircle2,
  Ban,
  Download,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/shared/data-table";
import { TableSkeleton } from "@/components/shared/states";
import { ErrorState } from "@/components/shared/states";
import { AccountStatusBadge } from "@/components/shared/status-badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useAdminMembers,
  useApproveMember,
  useSuspendMember,
} from "@/features/members/use-members";
import { formatDate, titleCase } from "@/lib/utils";
import { exportToCsv } from "@/lib/csv";
import type { Member, Role, AccountStatus } from "@/types";

const ROLE_VARIANT: Record<Role, "info" | "teal" | "default" | "muted"> = {
  buyer: "info",
  seller: "teal",
  admin: "default",
  auditor: "muted",
};

type BulkAction = "approve" | "suspend";

export default function AdminUsersPage() {
  const { data, isLoading, isError, refetch } = useAdminMembers();
  const approve = useApproveMember();
  const suspend = useSuspendMember();

  const [roleFilter, setRoleFilter] = useState<Role | "all">("all");
  const [statusFilter, setStatusFilter] = useState<AccountStatus | "all">("all");
  const [selected, setSelected] = useState<Member[]>([]);

  // single-row action confirm
  const [confirm, setConfirm] = useState<{
    member: Member;
    action: BulkAction;
  } | null>(null);
  // bulk action confirm
  const [bulkConfirm, setBulkConfirm] = useState<BulkAction | null>(null);

  const rows = useMemo(() => {
    let list = data ?? [];
    if (roleFilter !== "all") list = list.filter((m) => m.role === roleFilter);
    if (statusFilter !== "all")
      list = list.filter((m) => m.status === statusFilter);
    return list;
  }, [data, roleFilter, statusFilter]);

  const columns = useMemo<ColumnDef<Member>[]>(
    () => [
      {
        accessorKey: "email",
        header: "Member",
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate font-medium">{row.original.email}</p>
            <p className="truncate text-xs text-muted-foreground">
              {row.original.id.slice(0, 8)}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "role",
        header: "Role",
        cell: ({ row }) => (
          <Badge variant={ROLE_VARIANT[row.original.role]}>
            {titleCase(row.original.role)}
          </Badge>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <AccountStatusBadge status={row.original.status} />,
      },
      {
        id: "tenant",
        header: "Organization",
        accessorFn: (m) => m.tenant?.name ?? "",
        cell: ({ row }) => (
          <span className="text-sm">
            {row.original.tenant?.name ?? (
              <span className="text-muted-foreground">—</span>
            )}
          </span>
        ),
      },
      {
        accessorKey: "created_at",
        header: "Joined",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {formatDate(row.original.created_at)}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => {
          const m = row.original;
          return (
            <div className="flex justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon-sm">
                    <MoreHorizontal className="size-4" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    disabled={m.status === "active"}
                    onClick={() => setConfirm({ member: m, action: "approve" })}
                  >
                    <CheckCircle2 className="size-4" />
                    Approve
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    disabled={m.status === "suspended"}
                    className="text-danger focus:text-danger"
                    onClick={() => setConfirm({ member: m, action: "suspend" })}
                  >
                    <Ban className="size-4" />
                    Suspend
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    [],
  );

  function handleExport() {
    exportToCsv("members.csv", rows, [
      { header: "ID", accessor: (m) => m.id },
      { header: "Email", accessor: (m) => m.email },
      { header: "Role", accessor: (m) => m.role },
      { header: "Status", accessor: (m) => m.status },
      { header: "Organization", accessor: (m) => m.tenant?.name ?? "" },
      { header: "Joined", accessor: (m) => formatDate(m.created_at) },
    ]);
  }

  function runBulk(action: BulkAction) {
    const targets = selected.filter((m) =>
      action === "approve" ? m.status !== "active" : m.status !== "suspended",
    );
    for (const m of targets) {
      if (action === "approve") approve.mutate(m.id);
      else suspend.mutate(m.id);
    }
    setBulkConfirm(null);
  }

  const isBusy = approve.isPending || suspend.isPending;

  if (isError) {
    return (
      <div className="space-y-6">
        <PageHeader title="Members" description="Manage all platform accounts." />
        <ErrorState
          message="Could not load members."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Members"
        description="Manage all buyer, seller, and staff accounts."
        actions={
          <Button variant="outline" onClick={handleExport}>
            <Download className="size-4" />
            Export CSV
          </Button>
        }
      />

      {selected.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4 shadow-card">
          <p className="text-sm font-medium">
            {selected.length} selected
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="success"
              onClick={() => setBulkConfirm("approve")}
            >
              <CheckCircle2 className="size-4" />
              Approve selected
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => setBulkConfirm("suspend")}
            >
              <Ban className="size-4" />
              Suspend selected
            </Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <TableSkeleton rows={8} />
      ) : (
        <DataTable
          columns={columns}
          data={rows}
          searchable
          searchPlaceholder="Search by email or organization…"
          enableRowSelection
          onSelectionChange={setSelected}
          emptyTitle="No members found"
          emptyDescription="Try adjusting the role or status filters."
          toolbar={
            <div className="flex gap-2">
              <Select
                value={roleFilter}
                onValueChange={(v) => setRoleFilter(v as Role | "all")}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All roles</SelectItem>
                  <SelectItem value="buyer">Buyer</SelectItem>
                  <SelectItem value="seller">Seller</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="auditor">Auditor</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={statusFilter}
                onValueChange={(v) =>
                  setStatusFilter(v as AccountStatus | "all")
                }
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          }
        />
      )}

      {/* Single-row confirm */}
      <ConfirmDialog
        open={!!confirm}
        onOpenChange={(o) => !o && setConfirm(null)}
        title={
          confirm?.action === "suspend"
            ? "Suspend member?"
            : "Approve member?"
        }
        description={
          confirm
            ? confirm.action === "suspend"
              ? `${confirm.member.email} will lose access to the platform immediately.`
              : `${confirm.member.email} will gain full access to the platform.`
            : undefined
        }
        confirmLabel={confirm?.action === "suspend" ? "Suspend" : "Approve"}
        destructive={confirm?.action === "suspend"}
        loading={isBusy}
        onConfirm={() => {
          if (!confirm) return;
          const mut = confirm.action === "approve" ? approve : suspend;
          mut.mutate(confirm.member.id, {
            onSuccess: () => setConfirm(null),
          });
        }}
      />

      {/* Bulk confirm */}
      <ConfirmDialog
        open={!!bulkConfirm}
        onOpenChange={(o) => !o && setBulkConfirm(null)}
        title={
          bulkConfirm === "suspend"
            ? `Suspend ${selected.length} members?`
            : `Approve ${selected.length} members?`
        }
        description={
          bulkConfirm === "suspend"
            ? "Selected members will lose access immediately. Already-suspended members are skipped."
            : "Selected members will gain full access. Already-active members are skipped."
        }
        confirmLabel={bulkConfirm === "suspend" ? "Suspend all" : "Approve all"}
        destructive={bulkConfirm === "suspend"}
        loading={isBusy}
        onConfirm={() => bulkConfirm && runBulk(bulkConfirm)}
      />
    </div>
  );
}
