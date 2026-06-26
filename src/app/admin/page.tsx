"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  DollarSign,
  Store,
  Users,
  UserCheck,
  ShoppingCart,
  Percent,
  ArrowRight,
  Activity,
  CheckCircle2,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { KpiCard } from "@/components/shared/kpi-card";
import { DashboardSkeleton, KpiSkeletonGrid } from "@/components/shared/states";
import { ChartCard } from "@/components/charts/chart-card";
import {
  AreaTrendChart,
  BarSeriesChart,
  DonutChart,
} from "@/components/charts/charts";
import { AccountStatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { useAdminMembers, useApproveMember } from "@/features/members/use-members";
import { useCommissionSummary } from "@/features/commissions/use-commissions";
import { useOrders } from "@/features/orders/use-orders";
import { systemService } from "@/services";
import { qk } from "@/lib/query-keys";
import { formatCurrency, formatNumber, titleCase } from "@/lib/utils";
import type { Member, Order } from "@/types";

interface HealthShape {
  status?: string;
  db?: unknown;
  redis?: unknown;
}

function buildRevenueSeries(orders: Order[]) {
  const now = new Date();
  const months = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return {
      label: d.toLocaleString("en-US", { month: "short" }),
      year: d.getFullYear(),
      month: d.getMonth(),
      revenue: 0,
    };
  });
  for (const o of orders) {
    const d = new Date(o.created_at);
    const bucket = months.find(
      (m) => m.month === d.getMonth() && m.year === d.getFullYear(),
    );
    if (bucket) bucket.revenue += parseFloat(o.total_amount || "0");
  }
  return months.map((m) => ({ label: m.label, revenue: Math.round(m.revenue) }));
}

function isToday(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()
  );
}

export default function AdminDashboardPage() {
  const { data: members, isLoading: membersLoading } = useAdminMembers();
  const { data: orders, isLoading: ordersLoading } = useOrders();
  const { data: summary } = useCommissionSummary();
  const { data: health } = useQuery<HealthShape>({
    queryKey: qk.health,
    queryFn: () => systemService.health(),
    refetchInterval: 60_000,
  });

  const approve = useApproveMember();
  const [pendingApprove, setPendingApprove] = useState<Member | null>(null);

  const stats = useMemo(() => {
    const orderList = orders ?? [];
    const memberList = members ?? [];

    const totalRevenue = orderList.reduce(
      (s, o) => s + parseFloat(o.total_amount || "0"),
      0,
    );
    const activeSellers = memberList.filter(
      (m) => m.role === "seller" && m.status === "active",
    ).length;
    const activeBuyers = memberList.filter(
      (m) => m.role === "buyer" && m.status === "active",
    ).length;
    const pending = memberList.filter((m) => m.status === "pending");
    const ordersToday = orderList.filter((o) => isToday(o.created_at)).length;

    const byStatus: Record<string, number> = {};
    for (const o of orderList) byStatus[o.status] = (byStatus[o.status] ?? 0) + 1;

    return {
      totalRevenue,
      activeSellers,
      activeBuyers,
      pendingCount: pending.length,
      pending: pending.slice(0, 6),
      ordersToday,
      donut: Object.entries(byStatus).map(([name, value]) => ({
        name: titleCase(name),
        value,
      })),
      series: buildRevenueSeries(orderList),
    };
  }, [orders, members]);

  const commissionSeries = useMemo(() => {
    if (!summary) return [];
    return [
      {
        label: "Pending",
        amount: Math.round(parseFloat(summary.pending.total || "0")),
      },
      {
        label: "Earned",
        amount: Math.round(parseFloat(summary.earned.total || "0")),
      },
      {
        label: "Reversed",
        amount: Math.round(parseFloat(summary.reversed.total || "0")),
      },
    ];
  }, [summary]);

  const healthStatus = (health?.status ?? "unknown").toLowerCase();
  const healthOk = healthStatus === "ok";
  const loading = membersLoading || ordersLoading;

  if (loading) return <DashboardSkeleton kpis={4} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform Overview"
        description="Marketplace health, revenue, and member activity at a glance."
        actions={
          <Button asChild variant="brand">
            <Link href="/admin/approvals">
              Review approvals <ArrowRight className="size-4" />
            </Link>
          </Button>
        }
      />

      {loading ? (
        <KpiSkeletonGrid count={4} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            index={0}
            label="Total Revenue"
            value={formatCurrency(stats.totalRevenue)}
            icon={DollarSign}
            accent="brand"
            delta={12.4}
            deltaLabel="vs last period"
          />
          <KpiCard
            index={1}
            label="Active Sellers"
            value={formatNumber(stats.activeSellers)}
            icon={Store}
            accent="teal"
            hint="Approved & trading"
          />
          <KpiCard
            index={2}
            label="Active Buyers"
            value={formatNumber(stats.activeBuyers)}
            icon={Users}
            accent="primary"
            hint="Verified accounts"
          />
          <KpiCard
            index={3}
            label="Pending Approvals"
            value={formatNumber(stats.pendingCount)}
            icon={UserCheck}
            accent="warning"
            hint="Awaiting review"
          />
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <KpiCard
          index={0}
          label="Orders Today"
          value={formatNumber(stats.ordersToday)}
          icon={ShoppingCart}
          accent="success"
          hint="Placed in the last 24h"
        />
        <KpiCard
          index={1}
          label="Commission Revenue"
          value={formatCurrency(summary?.earned_total ?? 0)}
          icon={Percent}
          accent="teal"
          hint="Earned to date"
        />
        <Card className="flex items-center justify-between p-6">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">
              System Status
            </p>
            <div className="flex items-center gap-2">
              <span
                className={`relative flex size-2.5 ${
                  healthOk ? "" : "animate-pulse"
                }`}
              >
                <span
                  className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    healthOk ? "bg-success" : "bg-warning"
                  } ${healthOk ? "animate-ping" : ""}`}
                />
                <span
                  className={`relative inline-flex size-2.5 rounded-full ${
                    healthOk ? "bg-success" : "bg-warning"
                  }`}
                />
              </span>
              <span className="text-lg font-semibold tracking-tight">
                {healthOk ? "Operational" : titleCase(healthStatus)}
              </span>
            </div>
            <Link
              href="/admin/system"
              className="text-xs text-brand hover:underline"
            >
              View system health
            </Link>
          </div>
          <div className="flex size-11 items-center justify-center rounded-xl bg-success/10 text-success">
            <Activity className="size-5" />
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <ChartCard
          title="Revenue Trend"
          description="Gross merchandise value over the last 6 months"
          className="lg:col-span-2"
        >
          <AreaTrendChart
            data={stats.series}
            xKey="label"
            series={[
              { key: "revenue", label: "Revenue", color: "hsl(var(--brand))" },
            ]}
          />
        </ChartCard>

        <ChartCard
          title="Order Status"
          description="Distribution across all orders"
        >
          {stats.donut.length ? (
            <DonutChart data={stats.donut} />
          ) : (
            <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
              No orders yet
            </div>
          )}
        </ChartCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <ChartCard
          title="Commission Breakdown"
          description="Booked commission by lifecycle status"
        >
          {commissionSeries.length ? (
            <BarSeriesChart
              data={commissionSeries}
              xKey="label"
              series={[
                {
                  key: "amount",
                  label: "Amount",
                  color: "hsl(var(--teal))",
                },
              ]}
            />
          ) : (
            <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
              No commission data
            </div>
          )}
        </ChartCard>

        {/* Pending approvals quick list */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">Pending Approvals</CardTitle>
              {stats.pendingCount > 0 && (
                <Badge variant="warning">{stats.pendingCount}</Badge>
              )}
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin/approvals">
                View all <ArrowRight className="size-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {stats.pending.length ? (
              <div className="divide-y">
                {stats.pending.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center gap-4 py-3"
                  >
                    <Avatar className="size-10 rounded-lg">
                      <AvatarFallback className="rounded-lg bg-warning/10 text-warning">
                        {(m.tenant?.name ?? m.email).slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {m.tenant?.name ?? m.email}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {titleCase(m.role)} · {m.email}
                      </p>
                    </div>
                    <AccountStatusBadge status={m.status} />
                    <Button
                      size="sm"
                      variant="success"
                      onClick={() => setPendingApprove(m)}
                    >
                      <CheckCircle2 className="size-4" />
                      Approve
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={UserCheck}
                title="All caught up"
                description="There are no members awaiting approval."
                className="border-0"
              />
            )}
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={!!pendingApprove}
        onOpenChange={(o) => !o && setPendingApprove(null)}
        title="Approve member?"
        description={
          pendingApprove
            ? `${pendingApprove.tenant?.name ?? pendingApprove.email} will gain full access to the platform.`
            : undefined
        }
        confirmLabel="Approve"
        loading={approve.isPending}
        onConfirm={() => {
          if (!pendingApprove) return;
          approve.mutate(pendingApprove.id, {
            onSuccess: () => setPendingApprove(null),
          });
        }}
      />
    </div>
  );
}
