"use client";

import { useMemo } from "react";
import { Boxes, ShoppingBag, TrendingUp, Layers } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { KpiCard } from "@/components/shared/kpi-card";
import { KpiSkeletonGrid } from "@/components/shared/states";
import { ChartCard } from "@/components/charts/chart-card";
import { BarSeriesChart, DonutChart } from "@/components/charts/charts";
import { EmptyState } from "@/components/shared/empty-state";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useOrders } from "@/features/orders/use-orders";
import { useProductsBySeller } from "@/features/products/use-products";
import { useAuth } from "@/hooks/use-auth";
import { formatCurrency, formatPercent, titleCase } from "@/lib/utils";
import { sellerRevenueFromOrders } from "@/lib/seller-metrics";
import type { Order, Product } from "@/types";

export default function SellerAnalyticsPage() {
  const { user } = useAuth();
  const sellerId = user?.id ?? "";
  const { data: orders, isLoading: ordersLoading } = useOrders();
  const { data: products, isLoading: productsLoading } =
    useProductsBySeller(sellerId);
  const isLoading = ordersLoading || productsLoading;

  const stats = useMemo(() => {
    const orderList: Order[] = orders ?? [];
    const productList: Product[] = products ?? [];

    const unitsByProduct = new Map<string, number>();
    const revenueByProduct = new Map<string, number>();
    for (const o of orderList) {
      for (const it of o.items ?? []) {
        if (it.seller && it.seller !== sellerId) continue;
        unitsByProduct.set(
          it.product,
          (unitsByProduct.get(it.product) ?? 0) + it.quantity,
        );
        revenueByProduct.set(
          it.product,
          (revenueByProduct.get(it.product) ?? 0) +
            parseFloat(it.unit_price || "0") * it.quantity,
        );
      }
    }

    const byUnits = productList
      .map((p) => ({
        label:
          p.name.length > 16 ? `${p.name.slice(0, 16)}…` : p.name,
        units: unitsByProduct.get(p.id) ?? 0,
        revenue: Math.round(revenueByProduct.get(p.id) ?? 0),
      }))
      .filter((x) => x.units > 0)
      .sort((a, b) => b.units - a.units)
      .slice(0, 6);

    // Category mix (from attributes.category) by revenue.
    const catRevenue = new Map<string, number>();
    for (const p of productList) {
      const cat =
        typeof p.attributes?.category === "string" && p.attributes.category
          ? (p.attributes.category as string)
          : "Uncategorized";
      catRevenue.set(
        cat,
        (catRevenue.get(cat) ?? 0) + (revenueByProduct.get(p.id) ?? 0),
      );
    }
    const categoryMix = Array.from(catRevenue.entries())
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({ name, value: Math.round(value) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    const totalRevenue = sellerRevenueFromOrders(orderList, sellerId);
    const totalUnits = Array.from(unitsByProduct.values()).reduce(
      (s, v) => s + v,
      0,
    );
    const fulfilled = orderList.filter((o) =>
      ["delivered", "closed"].includes(o.status),
    ).length;
    const conversion =
      orderList.length > 0 ? (fulfilled / orderList.length) * 100 : 0;
    const avgOrder = orderList.length ? totalRevenue / orderList.length : 0;

    return {
      byUnits,
      categoryMix,
      totalUnits,
      avgOrder,
      conversion,
      productCount: productList.length,
      // funnel-ish counts by status
      funnel: ["confirmed", "fulfillment", "shipped", "delivered"].map(
        (s) => ({
          label: titleCase(s),
          count: orderList.filter((o) => o.status === s).length,
        }),
      ),
    };
  }, [orders, products, sellerId]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Deep dive into product performance and order flow."
      />

      {isLoading ? (
        <KpiSkeletonGrid />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            index={0}
            label="Units Sold"
            value={stats.totalUnits}
            icon={ShoppingBag}
            accent="brand"
          />
          <KpiCard
            index={1}
            label="Avg Order Value"
            value={formatCurrency(stats.avgOrder)}
            icon={TrendingUp}
            accent="teal"
          />
          <KpiCard
            index={2}
            label="Fulfilment Rate"
            value={formatPercent(stats.conversion)}
            icon={Layers}
            accent="success"
            hint="Delivered / total orders"
          />
          <KpiCard
            index={3}
            label="Catalog Size"
            value={stats.productCount}
            icon={Boxes}
            accent="primary"
          />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <ChartCard
          title="Top Products by Units"
          description="Best sellers by quantity"
          className="lg:col-span-2"
        >
          {stats.byUnits.length ? (
            <BarSeriesChart
              data={stats.byUnits}
              xKey="label"
              series={[
                { key: "units", label: "Units", color: "hsl(var(--brand))" },
              ]}
            />
          ) : (
            <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
              No sales data yet
            </div>
          )}
        </ChartCard>

        <ChartCard
          title="Category Mix"
          description="Revenue share by category"
        >
          {stats.categoryMix.length ? (
            <DonutChart data={stats.categoryMix} />
          ) : (
            <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
              No revenue yet
            </div>
          )}
        </ChartCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard
          title="Top Products by Revenue"
          description="Highest grossing listings"
        >
          {stats.byUnits.length ? (
            <BarSeriesChart
              data={stats.byUnits}
              xKey="label"
              series={[
                {
                  key: "revenue",
                  label: "Revenue",
                  color: "hsl(var(--teal))",
                },
              ]}
            />
          ) : (
            <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
              No revenue yet
            </div>
          )}
        </ChartCard>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Order Pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.funnel.some((f) => f.count > 0) ? (
              <div className="space-y-4">
                {stats.funnel.map((f) => {
                  const max = Math.max(
                    1,
                    ...stats.funnel.map((x) => x.count),
                  );
                  return (
                    <div key={f.label} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {f.label}
                        </span>
                        <span className="font-medium tabular-nums">
                          {f.count}
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-brand transition-all"
                          style={{ width: `${(f.count / max) * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                icon={Layers}
                title="No active orders"
                description="Your fulfillment pipeline will show here."
                className="border-0"
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
