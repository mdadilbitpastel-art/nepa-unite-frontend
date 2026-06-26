"use client";

import { useMemo } from "react";
import {
  DollarSign,
  Wallet,
  Percent,
  Info,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { KpiCard } from "@/components/shared/kpi-card";
import { KpiSkeletonGrid } from "@/components/shared/states";
import { ChartCard } from "@/components/charts/chart-card";
import { AreaTrendChart } from "@/components/charts/charts";
import { OrderStatusBadge } from "@/components/shared/status-badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { useOrders } from "@/features/orders/use-orders";
import { usePaymentConfig } from "@/features/payments/use-payments";
import { useAuth } from "@/hooks/use-auth";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  sellerRevenueFromOrders,
  sellerOrderTotal,
  buildSellerSeries,
} from "@/lib/seller-metrics";
import type { Order } from "@/types";

export default function SellerRevenuePage() {
  const { user } = useAuth();
  const sellerId = user?.id ?? "";
  const { data: orders, isLoading } = useOrders();
  const { data: config } = usePaymentConfig();
  const feePercent = config?.platform_fee_percent ?? 5;

  const stats = useMemo(() => {
    const list: Order[] = orders ?? [];
    const gross = sellerRevenueFromOrders(list, sellerId);
    const commission = (gross * feePercent) / 100;
    const series = buildSellerSeries(list, sellerId).map((p) => ({
      label: p.label,
      revenue: p.revenue,
      net: Math.round(p.revenue * (1 - feePercent / 100)),
    }));
    const rows = [...list]
      .filter((o) => sellerOrderTotal(o, sellerId) > 0)
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )
      .slice(0, 12);
    return {
      gross,
      commission,
      net: gross - commission,
      series,
      rows,
    };
  }, [orders, sellerId, feePercent]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Revenue"
        description="Gross sales, platform fees, and net earnings over time."
      />

      {isLoading ? (
        <KpiSkeletonGrid count={3} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          <KpiCard
            index={0}
            label="Gross Revenue"
            value={formatCurrency(stats.gross)}
            icon={DollarSign}
            accent="brand"
          />
          <KpiCard
            index={1}
            label="Platform Fees"
            value={formatCurrency(stats.commission)}
            icon={Percent}
            accent="warning"
            hint={`${feePercent}% commission`}
          />
          <KpiCard
            index={2}
            label="Net Earnings"
            value={formatCurrency(stats.net)}
            icon={Wallet}
            accent="success"
          />
        </div>
      )}

      <ChartCard
        title="Revenue vs Net"
        description="Gross revenue and net earnings across the last 6 months"
      >
        <AreaTrendChart
          data={stats.series}
          xKey="label"
          series={[
            { key: "revenue", label: "Gross", color: "hsl(var(--brand))" },
            { key: "net", label: "Net", color: "hsl(var(--success))" },
          ]}
        />
      </ChartCard>

      <Card className="border-brand/20 bg-brand/5">
        <CardContent className="flex items-start gap-3 p-4 text-sm">
          <Info className="mt-0.5 size-4 shrink-0 text-brand" />
          <p className="text-muted-foreground">
            Payouts are settled to your connected Stripe account after delivery.
            Connect or review your payout account under{" "}
            <span className="font-medium text-foreground">Stripe Connect</span>.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Revenue by order</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.rows.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Gross</TableHead>
                  <TableHead className="text-right">Fee</TableHead>
                  <TableHead className="text-right">Net</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.rows.map((o) => {
                  const g = sellerOrderTotal(o, sellerId);
                  const fee = (g * feePercent) / 100;
                  return (
                    <TableRow key={o.id}>
                      <TableCell className="font-medium">
                        #{o.id.slice(0, 8).toUpperCase()}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(o.created_at)}
                      </TableCell>
                      <TableCell>
                        <OrderStatusBadge status={o.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(g)}
                      </TableCell>
                      <TableCell className="text-right text-danger">
                        −{formatCurrency(fee)}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-success">
                        {formatCurrency(g - fee)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <EmptyState
              icon={DollarSign}
              title="No revenue yet"
              description="Earnings will appear here once you make sales."
              className="border-0"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
