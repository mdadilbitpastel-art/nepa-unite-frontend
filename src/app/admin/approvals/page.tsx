"use client";

import { useMemo, useState } from "react";
import {
  CheckCircle2,
  XCircle,
  UserCheck,
  Building2,
  Mail,
  Calendar,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/states";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { CardGridSkeleton } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
import type { Member, Role } from "@/types";

type Decision = "approve" | "reject";

export default function AdminApprovalsPage() {
  const { data, isLoading, isError, refetch } = useAdminMembers();
  const approve = useApproveMember();
  const suspend = useSuspendMember();

  const [roleFilter, setRoleFilter] = useState<Role | "all">("all");
  const [decision, setDecision] = useState<{
    member: Member;
    action: Decision;
  } | null>(null);

  const pending = useMemo(() => {
    let list = (data ?? []).filter((m) => m.status === "pending");
    if (roleFilter !== "all") list = list.filter((m) => m.role === roleFilter);
    return list;
  }, [data, roleFilter]);

  const isBusy = approve.isPending || suspend.isPending;

  if (isError) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Approval Queue"
          description="Review and onboard new sellers and buyers."
        />
        <ErrorState
          message="Could not load the approval queue."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Approval Queue"
        description="Review and onboard new sellers and buyers awaiting access."
        actions={
          <Select
            value={roleFilter}
            onValueChange={(v) => setRoleFilter(v as Role | "all")}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              <SelectItem value="seller">Sellers</SelectItem>
              <SelectItem value="buyer">Buyers</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      {isLoading ? (
        <CardGridSkeleton count={6} />
      ) : pending.length === 0 ? (
        <EmptyState
          icon={UserCheck}
          title="Nothing to review"
          description="There are no members awaiting approval right now."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {pending.map((m) => (
            <Card key={m.id} className="flex flex-col p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex size-11 items-center justify-center rounded-xl bg-brand/10 text-brand">
                  <Building2 className="size-5" />
                </div>
                <Badge variant="warning" dot>
                  Pending
                </Badge>
              </div>

              <div className="mt-4 space-y-1">
                <h3 className="font-semibold leading-tight">
                  {m.tenant?.name ?? "Unnamed organization"}
                </h3>
                <Badge variant={m.role === "seller" ? "teal" : "info"}>
                  {titleCase(m.role)}
                </Badge>
              </div>

              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="size-4 shrink-0" />
                  <span className="truncate">{m.email}</span>
                </div>
                {m.tenant?.vertical_type && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Building2 className="size-4 shrink-0" />
                    <span className="truncate">
                      {titleCase(m.tenant.vertical_type)}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="size-4 shrink-0" />
                  <span>Applied {formatDate(m.created_at)}</span>
                </div>
              </dl>

              <div className="mt-5 flex gap-2 border-t pt-4">
                <Button
                  size="sm"
                  variant="success"
                  className="flex-1"
                  onClick={() => setDecision({ member: m, action: "approve" })}
                >
                  <CheckCircle2 className="size-4" />
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setDecision({ member: m, action: "reject" })}
                >
                  <XCircle className="size-4" />
                  Reject
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!decision}
        onOpenChange={(o) => !o && setDecision(null)}
        title={
          decision?.action === "reject"
            ? "Reject application?"
            : "Approve application?"
        }
        description={
          decision
            ? decision.action === "reject"
              ? `${decision.member.tenant?.name ?? decision.member.email} will be suspended and denied access.`
              : `${decision.member.tenant?.name ?? decision.member.email} will be activated with full access.`
            : undefined
        }
        confirmLabel={decision?.action === "reject" ? "Reject" : "Approve"}
        destructive={decision?.action === "reject"}
        loading={isBusy}
        onConfirm={() => {
          if (!decision) return;
          const mut = decision.action === "approve" ? approve : suspend;
          mut.mutate(decision.member.id, {
            onSuccess: () => setDecision(null),
          });
        }}
      />
    </div>
  );
}
