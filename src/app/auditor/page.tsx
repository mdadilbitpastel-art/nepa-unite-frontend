"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  ShoppingCart,
  Percent,
  AlertTriangle,
  ShieldCheck,
  ArrowRight,
  FileSearch,
  Activity,
  Eye,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { KpiCard } from "@/components/shared/kpi-card";
import { DashboardSkeleton, KpiSkeletonGrid } from "@/components/shared/states";
import { ChartCard } from "@/components/charts/chart-card";
import { AreaTrendChart, DonutChart } from "@/components/charts/charts";
import { OrderStatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useOrders } from "@/features/orders/use-orders";
import { useCommissions, useCommissionSummary } from "@/features/commissions/use-commissions";
import { formatCurrency, formatNumber, titleCase, timeAgo } from "@/lib/utils";
import type { Commission, Order } from "@/types";

function buildVolumeSeries(orders: Order[]) {
  const now = new Date();
  const months = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return {
      label: d.toLocaleString("en-US", { month: "short" }),
      year: d.getFullYear(),
      month: d.getMonth(),
      orders: 0,
    };
  });
  for (const o of orders) {
    const d = new Date(o.created_at);
    const bucket = months.find(
      (m) => m.month === d.getMonth() && m.year === d.getFullYear(),
    );
    if (bucket) bucket.orders += 1;
  }
  return months.map((m) => ({ label: m.label, orders: m.orders }));
}

export default function AuditorDashboardPage() {
  const { data: orders, isLoading: ordersLoading } = useOrders();
  const { data: commissions } = useCommissions();
  const { data: summary } = useCommissionSummary();

  const stats = useMemo(() => {
    const orderList = orders ?? [];
    const commissionList: Commission[] = commissions ?? [];

    const totalOrders = orderList.length;
    const cancelled = orderList.filter((o) => o.status === "cancelled").length;
    // Reversed commissions act as a proxy for flagged / disputed money flows.
    const flagged = commissionList.filter((c) => c.status === "reversed").length;

    // Compliance score: start at 100, penalise anomalies (cancellations + reversals).
    const anomalyRate = totalOrders
      ? (cancelled + flagged) / (totalOrders + commissionList.length || 1)
      : 0;
    const compliance = Math.max(0, Math.round(100 - anomalyRate * 100));

    const commissionDonut = summary
      ? [
          {
            name: "Pending",
            value: Math.round(parseFloat(summary.pending.total || "0")),
            color: "hsl(var(--warning))",
          },
          {
            name: "Earned",
            value: Math.round(parseFloat(summary.earned.total || "0")),
            color: "hsl(var(--success))",
          },
          {
            name: "Reversed",
            value: Math.round(parseFloat(summary.reversed.total || "0")),
            color: "hsl(var(--muted-foreground))",
          },
        ].filter((d) => d.value > 0)
      : [];

    const recent = [...orderList]
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )
      .slice(0, 6);

    return {
      totalOrders,
      commissionEarned: parseFloat(summary?.earned_total ?? "0"),
      flagged,
      compliance,
      commissionDonut,
      series: buildVolumeSeries(orderList),
      recent,
    };
  }, [orders, commissions, summary]);

  if (ordersLoading) return <DashboardSkeleton kpis={4} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Overview"
        description="Read-only oversight of marketplace orders, commissions and compliance."
        actions={
          <Badge variant="info" className="px-3 py-1.5">
            <Eye className="size-3.5" /> Read-only access
          </Badge>
        }
      />

      {ordersLoading ? (
        <KpiSkeletonGrid count={4} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            index={0}
            label="Total Orders"
            value={formatNumber(stats.totalOrders)}
            icon={ShoppingCart}
            accent="brand"
            hint="Across the marketplace"
          />
          <KpiCard
            index={1}
            label="Commission Earned"
            value={formatCurrency(stats.commissionEarned)}
            icon={Percent}
            accent="teal"
            hint="Booked & earned to date"
          />
          <KpiCard
            index={2}
            label="Flagged / Reversed"
            value={formatNumber(stats.flagged)}
            icon={AlertTriangle}
            accent={stats.flagged > 0 ? "danger" : "success"}
            hint="Reversed commission entries"
          />
          <KpiCard
            index={3}
            label="Compliance Score"
            value={`${stats.compliance}%`}
            icon={ShieldCheck}
            accent={stats.compliance >= 90 ? "success" : "warning"}
            hint="Derived from anomaly rate"
          />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <ChartCard
          title="Order Volume Trend"
          description="Orders placed over the last 6 months"
          className="lg:col-span-2"
        >
          <AreaTrendChart
            data={stats.series}
            xKey="label"
            series={[
              { key: "orders", label: "Orders", color: "hsl(var(--brand))" },
            ]}
          />
        </ChartCard>

        <ChartCard
          title="Commission Status"
          description="Booked value by lifecycle status"
        >
          {stats.commissionDonut.length ? (
            <DonutChart data={stats.commissionDonut} />
          ) : (
            <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
              No commission data
            </div>
          )}
        </ChartCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent activity timeline */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-2">
              <Activity className="size-4 text-brand" />
              <CardTitle className="text-base">Recent Activity</CardTitle>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/auditor/orders">
                View orders <ArrowRight className="size-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {stats.recent.length ? (
              <ol className="relative space-y-5 before:absolute before:left-[15px] before:top-2 before:h-[calc(100%-1rem)] before:w-px before:bg-border">
                {stats.recent.map((o) => (
                  <li key={o.id} className="relative flex gap-4">
                    <span className="z-10 flex size-8 shrink-0 items-center justify-center rounded-full border bg-card text-brand">
                      <ShoppingCart className="size-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/auditor/orders/${o.id}`}
                          className="text-sm font-medium hover:text-brand"
                        >
                          Order #{o.id.slice(0, 8).toUpperCase()}
                        </Link>
                        <OrderStatusBadge status={o.status} />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(o.total_amount)} ·{" "}
                        {o.items?.length ?? 0} item(s) · {timeAgo(o.created_at)}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <EmptyState
                icon={Activity}
                title="No activity yet"
                description="Marketplace orders will appear here as they occur."
                className="border-0"
              />
            )}
          </CardContent>
        </Card>

        {/* Quick audit links */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Oversight Tools</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              {
                href: "/auditor/audit-trail",
                icon: FileSearch,
                label: "Audit Trail",
                desc: "Immutable event log",
              },
              {
                href: "/auditor/commissions",
                icon: Percent,
                label: "Commission Ledger",
                desc: "Booked referral fees",
              },
              {
                href: "/auditor/reports",
                icon: ShieldCheck,
                label: "Compliance Reports",
                desc: "Exportable audit packs",
              },
            ].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-accent/40"
              >
                <Avatar className="size-9 rounded-lg">
                  <AvatarFallback className="rounded-lg bg-brand/10 text-brand">
                    <l.icon className="size-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{l.label}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {l.desc}
                  </p>
                </div>
                <ArrowRight className="size-4 text-muted-foreground" />
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
