"use client";

import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  FileSearch,
  ShoppingCart,
  CreditCard,
  UserCog,
  Package,
  Percent,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/shared/data-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDateTime, titleCase, timeAgo } from "@/lib/utils";

// TODO: wire to /audit-logs
type AuditAction =
  | "created"
  | "updated"
  | "status_changed"
  | "approved"
  | "suspended"
  | "payment_captured"
  | "payment_disbursed"
  | "commission_booked"
  | "commission_reversed"
  | "login";

type AuditEntity =
  | "order"
  | "payment"
  | "member"
  | "product"
  | "commission"
  | "session";

interface AuditLog {
  id: string;
  actor: string;
  actor_role: "buyer" | "seller" | "admin" | "auditor" | "system";
  action: AuditAction;
  entity_type: AuditEntity;
  entity_id: string;
  summary: string;
  timestamp: string;
}

const ENTITY_ICON: Record<AuditEntity, LucideIcon> = {
  order: ShoppingCart,
  payment: CreditCard,
  member: UserCog,
  product: Package,
  commission: Percent,
  session: ShieldCheck,
};

const ACTION_VARIANT: Record<
  AuditAction,
  "info" | "success" | "warning" | "danger" | "muted" | "teal"
> = {
  created: "info",
  updated: "muted",
  status_changed: "info",
  approved: "success",
  suspended: "danger",
  payment_captured: "success",
  payment_disbursed: "teal",
  commission_booked: "info",
  commission_reversed: "warning",
  login: "muted",
};

function uid(prefix: string, n: number) {
  return `${prefix}-${(n * 1357 + 4096).toString(16).padStart(8, "0")}`;
}

// Seeded, realistic placeholder rows (no audit endpoint exists yet).
const SEED_SOURCE: Omit<AuditLog, "id" | "entity_id" | "timestamp">[] = [
  {
    action: "commission_reversed",
    entity_type: "commission",
    actor: "system@nepa-unite.com",
    actor_role: "system",
    summary: "Commission reversed after order refund",
  },
  {
    action: "payment_disbursed",
    entity_type: "payment",
    actor: "admin@nepa-unite.com",
    actor_role: "admin",
    summary: "Seller payout disbursed via Stripe Connect",
  },
  {
    action: "status_changed",
    entity_type: "order",
    actor: "seller@summit-supply.com",
    actor_role: "seller",
    summary: "Order advanced fulfillment → shipped",
  },
  {
    action: "payment_captured",
    entity_type: "payment",
    actor: "buyer@keystone-dental.com",
    actor_role: "buyer",
    summary: "Payment captured, order confirmed",
  },
  {
    action: "approved",
    entity_type: "member",
    actor: "admin@nepa-unite.com",
    actor_role: "admin",
    summary: "Seller account approved",
  },
  {
    action: "commission_booked",
    entity_type: "commission",
    actor: "system@nepa-unite.com",
    actor_role: "system",
    summary: "Referral fee booked on sold line item",
  },
  {
    action: "created",
    entity_type: "product",
    actor: "seller@valley-architectural.com",
    actor_role: "seller",
    summary: "New product listed in catalog",
  },
  {
    action: "suspended",
    entity_type: "member",
    actor: "admin@nepa-unite.com",
    actor_role: "admin",
    summary: "Member suspended pending compliance review",
  },
  {
    action: "status_changed",
    entity_type: "order",
    actor: "buyer@scranton-retail.com",
    actor_role: "buyer",
    summary: "Order cancelled by buyer",
  },
  {
    action: "login",
    entity_type: "session",
    actor: "auditor@nepa-unite.com",
    actor_role: "auditor",
    summary: "Auditor signed in for read-only review",
  },
  {
    action: "updated",
    entity_type: "product",
    actor: "seller@summit-supply.com",
    actor_role: "seller",
    summary: "Inventory count adjusted",
  },
  {
    action: "created",
    entity_type: "order",
    actor: "buyer@keystone-dental.com",
    actor_role: "buyer",
    summary: "Draft order created from cart checkout",
  },
];

const SEED: AuditLog[] = SEED_SOURCE.map((row, i) => ({
  ...row,
  id: uid("log", i + 1),
  entity_id: uid(row.entity_type, i + 7),
  timestamp: new Date(Date.now() - i * 3.2 * 3600 * 1000).toISOString(),
}));

export default function AuditTrailPage() {
  const [search, setSearch] = useState("");
  const [entity, setEntity] = useState<string>("all");
  const [action, setAction] = useState<string>("all");

  const filtered = useMemo(() => {
    return SEED.filter((row) => {
      if (entity !== "all" && row.entity_type !== entity) return false;
      if (action !== "all" && row.action !== action) return false;
      if (search) {
        const hay =
          `${row.actor} ${row.summary} ${row.entity_id} ${row.action}`.toLowerCase();
        if (!hay.includes(search.toLowerCase())) return false;
      }
      return true;
    });
  }, [search, entity, action]);

  const columns = useMemo<ColumnDef<AuditLog>[]>(
    () => [
      {
        accessorKey: "action",
        header: "Event",
        cell: ({ row }) => {
          const Icon = ENTITY_ICON[row.original.entity_type];
          return (
            <div className="flex items-center gap-3">
              <span className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <Icon className="size-4" />
              </span>
              <div>
                <Badge variant={ACTION_VARIANT[row.original.action]}>
                  {titleCase(row.original.action)}
                </Badge>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {row.original.summary}
                </p>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "actor",
        header: "Actor",
        cell: ({ row }) => (
          <div>
            <p className="text-sm font-medium">{row.original.actor}</p>
            <p className="text-xs text-muted-foreground">
              {titleCase(row.original.actor_role)}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "entity_type",
        header: "Entity",
        cell: ({ row }) => (
          <div>
            <p className="text-sm font-medium">
              {titleCase(row.original.entity_type)}
            </p>
            <p className="font-mono text-xs text-muted-foreground">
              {row.original.entity_id}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "timestamp",
        header: "Timestamp",
        cell: ({ row }) => (
          <div>
            <p className="text-sm">{formatDateTime(row.original.timestamp)}</p>
            <p className="text-xs text-muted-foreground">
              {timeAgo(row.original.timestamp)}
            </p>
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Trail"
        description="Immutable, searchable record of every system event."
        actions={
          <Badge variant="muted" className="px-3 py-1.5">
            <FileSearch className="size-3.5" /> {filtered.length} events
          </Badge>
        }
      />

      {/* Compact activity timeline of the latest 5 events */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Latest Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="relative space-y-5 before:absolute before:left-[15px] before:top-2 before:h-[calc(100%-1rem)] before:w-px before:bg-border">
            {SEED.slice(0, 5).map((log) => {
              const Icon = ENTITY_ICON[log.entity_type];
              return (
                <li key={log.id} className="relative flex gap-4">
                  <span className="z-10 flex size-8 shrink-0 items-center justify-center rounded-full border bg-card text-brand">
                    <Icon className="size-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={ACTION_VARIANT[log.action]}>
                        {titleCase(log.action)}
                      </Badge>
                      <span className="text-sm font-medium">{log.summary}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {log.actor} · {formatDateTime(log.timestamp)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        </CardContent>
      </Card>

      <DataTable
        columns={columns}
        data={filtered}
        searchable
        searchPlaceholder="Search actor, summary, entity…"
        globalFilter={search}
        onGlobalFilterChange={setSearch}
        toolbar={
          <div className="flex items-center gap-2">
            <Select value={entity} onValueChange={setEntity}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Entity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All entities</SelectItem>
                {(
                  ["order", "payment", "member", "product", "commission", "session"] as AuditEntity[]
                ).map((e) => (
                  <SelectItem key={e} value={e}>
                    {titleCase(e)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={action} onValueChange={setAction}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All actions</SelectItem>
                {(Object.keys(ACTION_VARIANT) as AuditAction[]).map((a) => (
                  <SelectItem key={a} value={a}>
                    {titleCase(a)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
        emptyTitle="No audit events"
        emptyDescription="No events match your current filters."
      />
    </div>
  );
}
