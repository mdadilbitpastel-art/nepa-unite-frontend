"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  DollarSign,
  Wallet,
  ShoppingBag,
  Boxes,
  AlertTriangle,
  ArrowRight,
  Package,
  TrendingUp,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { KpiCard } from "@/components/shared/kpi-card";
import { DashboardSkeleton, KpiSkeletonGrid } from "@/components/shared/states";
import { ChartCard } from "@/components/charts/chart-card";
import { AreaTrendChart, DonutChart } from "@/components/charts/charts";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useOrders } from "@/features/orders/use-orders";
import { useProductsBySeller } from "@/features/products/use-products";
import { usePaymentConfig } from "@/features/payments/use-payments";
import { useAuth } from "@/hooks/use-auth";
import { formatCurrency, titleCase } from "@/lib/utils";
import {
  isLowStock,
  sellerRevenueFromOrders,
  buildSellerSeries,
} from "@/lib/seller-metrics";
import type { Order, Product } from "@/types";

export default function SellerDashboardPage() {
  const { user } = useAuth();
  const sellerId = user?.id ?? "";
  const { data: orders, isLoading: ordersLoading } = useOrders();
  const { data: products, isLoading: productsLoading } =
    useProductsBySeller(sellerId);
  const { data: config } = usePaymentConfig();

  const feePercent = config?.platform_fee_percent ?? 5;
  const isLoading = ordersLoading || productsLoading;

  const stats = useMemo(() => {
    const orderList: Order[] = orders ?? [];
    const productList: Product[] = products ?? [];
    const revenue = sellerRevenueFromOrders(orderList, sellerId);
    const commission = (revenue * feePercent) / 100;
    const lowStock = productList.filter(isLowStock);
    const active = productList.filter((p) => p.status === "active");

    const byStatus: Record<string, number> = {};
    for (const o of orderList) byStatus[o.status] = (byStatus[o.status] ?? 0) + 1;

    // Top products by units sold from order items.
    const unitsByProduct = new Map<string, number>();
    for (const o of orderList) {
      for (const it of o.items ?? []) {
        if (it.seller && it.seller !== sellerId) continue;
        unitsByProduct.set(
          it.product,
          (unitsByProduct.get(it.product) ?? 0) + it.quantity,
        );
      }
    }
    const top = productList
      .map((p) => ({ product: p, units: unitsByProduct.get(p.id) ?? 0 }))
      .sort((a, b) => b.units - a.units)
      .slice(0, 5);

    return {
      revenue,
      commission,
      netEarnings: revenue - commission,
      orderCount: orderList.length,
      activeCount: active.length,
      lowStock,
      donut: Object.entries(byStatus).map(([name, value]) => ({
        name: titleCase(name),
        value,
      })),
      series: buildSellerSeries(orderList, sellerId),
      top,
    };
  }, [orders, products, sellerId, feePercent]);

  const greeting = user?.email?.split("@")[0] ?? "seller";

  if (isLoading) return <DashboardSkeleton kpis={5} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back, ${titleCase(greeting)} 👋`}
        description="Track your sales performance, inventory, and earnings."
        actions={
          <Button asChild variant="brand">
            <Link href="/seller/products/new">
              Add product <ArrowRight className="size-4" />
            </Link>
          </Button>
        }
      />

      {isLoading ? (
        <KpiSkeletonGrid count={5} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <KpiCard
            index={0}
            label="Revenue"
            value={formatCurrency(stats.revenue)}
            icon={DollarSign}
            accent="brand"
            delta={9.4}
            deltaLabel="vs last period"
          />
          <KpiCard
            index={1}
            label="Net Earnings"
            value={formatCurrency(stats.netEarnings)}
            icon={Wallet}
            accent="success"
            hint={`After ${feePercent}% platform fee`}
          />
          <KpiCard
            index={2}
            label="Total Orders"
            value={stats.orderCount}
            icon={ShoppingBag}
            accent="teal"
            delta={4.1}
            deltaLabel="vs last period"
          />
          <KpiCard
            index={3}
            label="Active Products"
            value={stats.activeCount}
            icon={Boxes}
            accent="primary"
            hint="Live in the catalog"
          />
          <KpiCard
            index={4}
            label="Low Stock"
            value={stats.lowStock.length}
            icon={AlertTriangle}
            accent="warning"
            hint="Needs restocking"
          />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <ChartCard
          title="Revenue & Orders"
          description="Monthly performance across the last 6 months"
          className="lg:col-span-2"
        >
          <AreaTrendChart
            data={stats.series}
            xKey="label"
            series={[
              {
                key: "revenue",
                label: "Revenue",
                color: "hsl(var(--brand))",
              },
              { key: "orders", label: "Orders", color: "hsl(var(--teal))" },
            ]}
          />
        </ChartCard>

        <ChartCard title="Order Status" description="Distribution of your orders">
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
        {/* Inventory alerts */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Inventory Alerts</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href="/seller/inventory">
                Manage <ArrowRight className="size-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {stats.lowStock.length ? (
              <div className="divide-y">
                {stats.lowStock.slice(0, 5).map((p) => (
                  <Link
                    key={p.id}
                    href={`/seller/products/${p.id}/edit`}
                    className="flex items-center gap-4 py-3 transition-colors hover:bg-accent/40"
                  >
                    <Avatar className="size-10 rounded-lg">
                      <AvatarFallback className="rounded-lg bg-warning/10 text-warning">
                        <Package className="size-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{p.name}</p>
                      <p className="text-xs text-muted-foreground">
                        SKU {p.sku}
                      </p>
                    </div>
                    <Badge variant={p.inventory_count === 0 ? "danger" : "warning"}>
                      {p.inventory_count} left
                    </Badge>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Boxes}
                title="Inventory looks healthy"
                description="No products are running low on stock right now."
                className="border-0"
              />
            )}
          </CardContent>
        </Card>

        {/* Commission breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Earnings Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Gross revenue</span>
              <span className="font-semibold">
                {formatCurrency(stats.revenue)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Platform fee ({feePercent}%)
              </span>
              <span className="font-medium text-danger">
                −{formatCurrency(stats.commission)}
              </span>
            </div>
            <div className="border-t pt-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Net earnings</span>
                <span className="text-lg font-semibold text-success">
                  {formatCurrency(stats.netEarnings)}
                </span>
              </div>
            </div>
            <Button asChild variant="outline" className="w-full">
              <Link href="/seller/revenue">
                <TrendingUp className="size-4" /> View revenue
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Top products */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Top Products</CardTitle>
          <Button asChild variant="ghost" size="sm">
            <Link href="/seller/analytics">
              Analytics <ArrowRight className="size-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {stats.top.length ? (
            <div className="divide-y">
              {stats.top.map(({ product, units }) => (
                <div
                  key={product.id}
                  className="flex items-center gap-4 py-3"
                >
                  <Avatar className="size-10 rounded-lg">
                    {product.primary_image_url ? (
                      <img
                        src={product.primary_image_url}
                        alt={product.name}
                        className="size-full rounded-lg object-cover"
                      />
                    ) : (
                      <AvatarFallback className="rounded-lg bg-brand/10 text-brand">
                        <Package className="size-4" />
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {product.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(product.price)} · SKU {product.sku}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{units} sold</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Boxes}
              title="No products yet"
              description="Add your first product to start selling."
              action={
                <Button asChild variant="brand">
                  <Link href="/seller/products/new">Add product</Link>
                </Button>
              }
              className="border-0"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
