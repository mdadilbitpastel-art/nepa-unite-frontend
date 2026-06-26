"use client";

import { useMemo, useState } from "react";
import {
  ShieldCheck,
  UserCheck,
  Ban,
  Percent,
  Package,
  CreditCard,
  Settings,
  LogIn,
  type LucideIcon,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDateTime } from "@/lib/utils";

// ── Typed audit-log shape ────────────────────────────────────────────
// TODO: wire to /audit-logs when backend exposes it. The API contract has
// no audit endpoint yet, so this view runs against realistic seed data.
type AuditAction =
  | "member.approve"
  | "member.suspend"
  | "commission.rate.update"
  | "order.status.override"
  | "payment.disburse"
  | "product.delete"
  | "settings.update"
  | "auth.login";

interface AuditLog {
  id: string;
  actor: string;
  action: AuditAction;
  entity: string;
  metadata?: string;
  ip?: string;
  timestamp: string;
}

const ACTION_META: Record<
  AuditAction,
  { label: string; icon: LucideIcon; variant: "info" | "success" | "danger" | "warning" | "teal" | "muted" }
> = {
  "member.approve": { label: "Member approved", icon: UserCheck, variant: "success" },
  "member.suspend": { label: "Member suspended", icon: Ban, variant: "danger" },
  "commission.rate.update": { label: "Rate updated", icon: Percent, variant: "teal" },
  "order.status.override": { label: "Order override", icon: Package, variant: "warning" },
  "payment.disburse": { label: "Payout disbursed", icon: CreditCard, variant: "info" },
  "product.delete": { label: "Product deleted", icon: Package, variant: "danger" },
  "settings.update": { label: "Settings changed", icon: Settings, variant: "muted" },
  "auth.login": { label: "Admin sign-in", icon: LogIn, variant: "muted" },
};

function hoursAgo(h: number) {
  return new Date(Date.now() - h * 60 * 60 * 1000).toISOString();
}

// Seed data — replace with API results once /audit-logs ships.
const SEED_LOGS: AuditLog[] = [
  {
    id: "log-1",
    actor: "admin@nepaunite.com",
    action: "member.approve",
    entity: "Cascade Lighting Co.",
    metadata: "Seller account activated",
    ip: "10.0.4.21",
    timestamp: hoursAgo(0.5),
  },
  {
    id: "log-2",
    actor: "admin@nepaunite.com",
    action: "commission.rate.update",
    entity: "Lighting · 8.00% → 9.50%",
    metadata: "Effective on future orders",
    ip: "10.0.4.21",
    timestamp: hoursAgo(2),
  },
  {
    id: "log-3",
    actor: "ops@nepaunite.com",
    action: "payment.disburse",
    entity: "Order #A1B2C3D4",
    metadata: "$225.00 to seller acct_19fK",
    ip: "10.0.4.33",
    timestamp: hoursAgo(5),
  },
  {
    id: "log-4",
    actor: "admin@nepaunite.com",
    action: "order.status.override",
    entity: "Order #9F8E7D6C → Shipped",
    metadata: "Manual override (support ticket #4821)",
    ip: "10.0.4.21",
    timestamp: hoursAgo(9),
  },
  {
    id: "log-5",
    actor: "admin@nepaunite.com",
    action: "member.suspend",
    entity: "Northern Supply LLC",
    metadata: "Policy violation — chargeback fraud",
    ip: "10.0.4.21",
    timestamp: hoursAgo(26),
  },
  {
    id: "log-6",
    actor: "ops@nepaunite.com",
    action: "product.delete",
    entity: "SKU CL-220 (Cascade Lighting)",
    metadata: "Counterfeit listing removed",
    ip: "10.0.4.33",
    timestamp: hoursAgo(30),
  },
  {
    id: "log-7",
    actor: "admin@nepaunite.com",
    action: "settings.update",
    entity: "Platform fee · 5.0% → 5.5%",
    ip: "10.0.4.21",
    timestamp: hoursAgo(48),
  },
  {
    id: "log-8",
    actor: "admin@nepaunite.com",
    action: "auth.login",
    entity: "Admin console",
    metadata: "MFA verified",
    ip: "10.0.4.21",
    timestamp: hoursAgo(49),
  },
];

const ACTIONS = Object.keys(ACTION_META) as AuditAction[];

export default function AdminAuditLogsPage() {
  const [query, setQuery] = useState("");
  const [actionFilter, setActionFilter] = useState<AuditAction | "all">("all");

  const logs = useMemo(() => {
    let list = SEED_LOGS;
    if (actionFilter !== "all")
      list = list.filter((l) => l.action === actionFilter);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (l) =>
          l.actor.toLowerCase().includes(q) ||
          l.entity.toLowerCase().includes(q) ||
          (l.metadata ?? "").toLowerCase().includes(q),
      );
    }
    return list;
  }, [query, actionFilter]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Logs"
        description="Immutable trail of privileged actions across the platform."
        actions={
          <Badge variant="muted" className="gap-1.5">
            <ShieldCheck className="size-3.5" />
            Tamper-evident
          </Badge>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search actor, entity, or detail…"
          className="sm:max-w-xs"
        />
        <Select
          value={actionFilter}
          onValueChange={(v) => setActionFilter(v as AuditAction | "all")}
        >
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Action type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All actions</SelectItem>
            {ACTIONS.map((a) => (
              <SelectItem key={a} value={a}>
                {ACTION_META[a].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {logs.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="No matching events"
          description="Adjust your search or action filter."
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <ol className="relative divide-y">
              {logs.map((log) => {
                const meta = ACTION_META[log.action];
                const Icon = meta.icon;
                return (
                  <li
                    key={log.id}
                    className="flex items-start gap-4 p-4 transition-colors hover:bg-accent/30"
                  >
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                      <Icon className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={meta.variant}>{meta.label}</Badge>
                        <span className="truncate text-sm font-medium">
                          {log.entity}
                        </span>
                      </div>
                      {log.metadata && (
                        <p className="mt-1 truncate text-xs text-muted-foreground">
                          {log.metadata}
                        </p>
                      )}
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <Avatar className="size-5">
                          <AvatarFallback className="text-[10px]">
                            {log.actor.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span>{log.actor}</span>
                        {log.ip && (
                          <>
                            <span aria-hidden>·</span>
                            <span className="font-mono">{log.ip}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <time className="shrink-0 text-xs text-muted-foreground">
                      {formatDateTime(log.timestamp)}
                    </time>
                  </li>
                );
              })}
            </ol>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
