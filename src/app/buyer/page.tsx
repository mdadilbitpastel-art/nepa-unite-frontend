"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  ShoppingBag,
  Wallet,
  Heart,
  Package,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { KpiCard } from "@/components/shared/kpi-card";
import { DashboardSkeleton, KpiSkeletonGrid } from "@/components/shared/states";
import { ChartCard } from "@/components/charts/chart-card";
import { AreaTrendChart, DonutChart } from "@/components/charts/charts";
import { OrderStatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useOrders } from "@/features/orders/use-orders";
import { useWishlist } from "@/features/wishlist/use-wishlist";
import { useAuth } from "@/hooks/use-auth";
import { formatCurrency, formatDate, titleCase } from "@/lib/utils";
import type { Order } from "@/types";

function buildSpendSeries(orders: Order[]) {
  // Last 6 months spend buckets
  const now = new Date();
  const months = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return {
      key: d.toLocaleString("en-US", { month: "short" }),
      year: d.getFullYear(),
      month: d.getMonth(),
      spend: 0,
    };
  });
  for (const o of orders) {
    const d = new Date(o.created_at);
    const bucket = months.find(
      (m) => m.month === d.getMonth() && m.year === d.getFullYear(),
    );
    if (bucket) bucket.spend += parseFloat(o.total_amount || "0");
  }
  return months.map((m) => ({ label: m.key, spend: Math.round(m.spend) }));
}

export default function BuyerDashboardPage() {
  const { user } = useAuth();
  const { data: orders, isLoading } = useOrders();
  const { data: wishlist } = useWishlist();

  const stats = useMemo(() => {
    const list = orders ?? [];
    const totalSpend = list.reduce(
      (s, o) => s + parseFloat(o.total_amount || "0"),
      0,
    );
    const active = list.filter(
      (o) => !["delivered", "closed", "cancelled"].includes(o.status),
    ).length;
    const byStatus: Record<string, number> = {};
    for (const o of list) byStatus[o.status] = (byStatus[o.status] ?? 0) + 1;
    return {
      totalSpend,
      orderCount: list.length,
      active,
      donut: Object.entries(byStatus).map(([name, value]) => ({
        name: titleCase(name),
        value,
      })),
      series: buildSpendSeries(list),
      recent: [...list]
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        )
        .slice(0, 5),
    };
  }, [orders]);

  const greeting = user?.email?.split("@")[0] ?? "there";

  if (isLoading) return <DashboardSkeleton kpis={4} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back, ${titleCase(greeting)} 👋`}
        description="Here's a snapshot of your purchasing activity."
        actions={
          <Button asChild variant="brand">
            <Link href="/buyer/products">
              Browse marketplace <ArrowRight className="size-4" />
            </Link>
          </Button>
        }
      />

      {isLoading ? (
        <KpiSkeletonGrid />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            index={0}
            label="Total Spend"
            value={formatCurrency(stats.totalSpend)}
            icon={Wallet}
            accent="brand"
            delta={8.2}
            deltaLabel="vs last period"
          />
          <KpiCard
            index={1}
            label="Total Orders"
            value={stats.orderCount}
            icon={ShoppingBag}
            accent="teal"
            delta={3.1}
            deltaLabel="vs last period"
          />
          <KpiCard
            index={2}
            label="Active Orders"
            value={stats.active}
            icon={Package}
            accent="warning"
            hint="In progress right now"
          />
          <KpiCard
            index={3}
            label="Wishlist Items"
            value={wishlist?.length ?? 0}
            icon={Heart}
            accent="danger"
            hint="Saved for later"
          />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <ChartCard
          title="Spending Summary"
          description="Monthly spend across the last 6 months"
          className="lg:col-span-2"
        >
          <AreaTrendChart
            data={stats.series}
            xKey="label"
            series={[{ key: "spend", label: "Spend", color: "hsl(var(--brand))" }]}
          />
        </ChartCard>

        <ChartCard
          title="Order Status"
          description="Distribution of your orders"
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

      {/* Recent orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Recent Orders</CardTitle>
          <Button asChild variant="ghost" size="sm">
            <Link href="/buyer/orders">
              View all <ArrowRight className="size-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {stats.recent.length ? (
            <div className="divide-y">
              {stats.recent.map((o) => (
                <Link
                  key={o.id}
                  href={`/buyer/orders/${o.id}`}
                  className="flex items-center gap-4 py-3 transition-colors hover:bg-accent/40"
                >
                  <Avatar className="size-10 rounded-lg">
                    <AvatarFallback className="rounded-lg bg-brand/10 text-brand">
                      <Package className="size-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      Order #{o.id.slice(0, 8).toUpperCase()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {o.items?.length ?? 0} item(s) · {formatDate(o.created_at)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">
                      {formatCurrency(o.total_amount)}
                    </p>
                  </div>
                  <OrderStatusBadge status={o.status} />
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={ShoppingBag}
              title="No orders yet"
              description="Browse the marketplace and place your first order."
              action={
                <Button asChild variant="brand">
                  <Link href="/buyer/products">Start shopping</Link>
                </Button>
              }
              className="border-0"
            />
          )}
        </CardContent>
      </Card>

      {/* Recommended */}
      <Card className="overflow-hidden border-brand/20 bg-brand-gradient text-white">
        <CardContent className="flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-xl bg-white/15">
              <Sparkles className="size-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Discover new suppliers</h3>
              <p className="text-sm text-white/80">
                Explore verified B2B sellers across NEPA with contract pricing.
              </p>
            </div>
          </div>
          <Button asChild variant="secondary">
            <Link href="/buyer/products">Explore now</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
