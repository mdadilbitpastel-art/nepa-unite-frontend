"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Percent,
  ClipboardList,
  CreditCard,
  AlertTriangle,
  Download,
  ShieldCheck,
  FileText,
  type LucideIcon,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useOrders } from "@/features/orders/use-orders";
import { useCommissions } from "@/features/commissions/use-commissions";
import { downloadCsv } from "@/lib/export";
import { formatCurrency, formatDate, titleCase } from "@/lib/utils";
import type { Commission, Order } from "@/types";

type ReportId = "commission" | "order-audit" | "payment-recon" | "dispute-log";

interface ReportDef {
  id: ReportId;
  title: string;
  description: string;
  icon: LucideIcon;
  accent: string;
}

const REPORTS: ReportDef[] = [
  {
    id: "commission",
    title: "Commission Report",
    description: "Full ledger of category-based referral fees with status.",
    icon: Percent,
    accent: "bg-teal/10 text-teal",
  },
  {
    id: "order-audit",
    title: "Order Audit",
    description: "Every order with totals, status and timestamps.",
    icon: ClipboardList,
    accent: "bg-brand/10 text-brand",
  },
  {
    id: "payment-recon",
    title: "Payment Reconciliation",
    description: "Order totals matched against booked commission.",
    icon: CreditCard,
    accent: "bg-success/10 text-success",
  },
  {
    id: "dispute-log",
    title: "Dispute Log",
    description: "Cancelled orders and reversed commission entries.",
    icon: AlertTriangle,
    accent: "bg-danger/10 text-danger",
  },
];

function inRange(iso: string, from: string, to: string): boolean {
  const t = new Date(iso).getTime();
  if (from && t < new Date(from).getTime()) return false;
  // include the whole "to" day
  if (to && t > new Date(to).getTime() + 86_400_000 - 1) return false;
  return true;
}

export default function ComplianceReportsPage() {
  const { data: orders } = useOrders();
  const { data: commissions } = useCommissions();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const orderList = useMemo<Order[]>(() => orders ?? [], [orders]);
  const commissionList = useMemo<Commission[]>(
    () => commissions ?? [],
    [commissions],
  );

  const summary = useMemo(() => {
    const gmv = orderList.reduce(
      (s, o) => s + parseFloat(o.total_amount || "0"),
      0,
    );
    const cancelled = orderList.filter((o) => o.status === "cancelled").length;
    const reversed = commissionList.filter(
      (c) => c.status === "reversed",
    ).length;
    const commissionTotal = commissionList.reduce(
      (s, c) => s + parseFloat(c.commission_amount || "0"),
      0,
    );
    return {
      gmv,
      orders: orderList.length,
      commissionTotal,
      disputes: cancelled + reversed,
    };
  }, [orderList, commissionList]);

  function generate(report: ReportDef) {
    const stamp = new Date().toISOString().slice(0, 10);
    const suffix = from || to ? `_${from || "start"}_${to || stamp}` : `_${stamp}`;
    let rows: Record<string, unknown>[] = [];

    if (report.id === "commission") {
      rows = commissionList
        .filter((c) => inRange(c.created_at, from, to))
        .map((c) => ({
          commission_id: c.id,
          order_id: c.order,
          seller: c.seller_email,
          category: c.category,
          base_amount: c.base_amount,
          rate_percent: c.rate_percent,
          commission_amount: c.commission_amount,
          status: c.status,
          booked_at: c.created_at,
          earned_at: c.earned_at ?? "",
          reversed_at: c.reversed_at ?? "",
        }));
    } else if (report.id === "order-audit") {
      rows = orderList
        .filter((o) => inRange(o.created_at, from, to))
        .map((o) => ({
          order_id: o.id,
          buyer: o.buyer,
          status: o.status,
          items: o.items?.length ?? 0,
          total_amount: o.total_amount,
          shipping_city: o.shipping_city,
          shipping_state: o.shipping_state,
          created_at: o.created_at,
        }));
    } else if (report.id === "payment-recon") {
      const commByOrder = new Map<string, number>();
      for (const c of commissionList) {
        commByOrder.set(
          c.order,
          (commByOrder.get(c.order) ?? 0) +
            parseFloat(c.commission_amount || "0"),
        );
      }
      rows = orderList
        .filter((o) => inRange(o.created_at, from, to))
        .map((o) => ({
          order_id: o.id,
          status: o.status,
          order_total: o.total_amount,
          booked_commission: (commByOrder.get(o.id) ?? 0).toFixed(2),
          created_at: o.created_at,
        }));
    } else {
      const cancelled = orderList
        .filter((o) => o.status === "cancelled" && inRange(o.created_at, from, to))
        .map((o) => ({
          type: "cancelled_order",
          reference: o.id,
          party: o.buyer,
          amount: o.total_amount,
          date: o.created_at,
        }));
      const reversed = commissionList
        .filter((c) => c.status === "reversed" && inRange(c.created_at, from, to))
        .map((c) => ({
          type: "reversed_commission",
          reference: c.id,
          party: c.seller_email,
          amount: c.commission_amount,
          date: c.reversed_at ?? c.created_at,
        }));
      rows = [...cancelled, ...reversed];
    }

    if (!rows.length) {
      toast.error("No data in the selected range for this report.");
      return;
    }
    downloadCsv(`${report.id}${suffix}.csv`, rows);
    toast.success(`${report.title} exported (${rows.length} rows).`);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Compliance Center"
        description="Generate and export point-in-time audit reports from live data."
        actions={
          <Badge variant="info" className="px-3 py-1.5">
            <ShieldCheck className="size-3.5" /> Auditor exports
          </Badge>
        }
      />

      {/* Summary stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Orders in scope", value: summary.orders.toString(), icon: ClipboardList, accent: "bg-brand/10 text-brand" },
          { label: "Gross merchandise value", value: formatCurrency(summary.gmv), icon: CreditCard, accent: "bg-success/10 text-success" },
          { label: "Commission booked", value: formatCurrency(summary.commissionTotal), icon: Percent, accent: "bg-teal/10 text-teal" },
          { label: "Open disputes", value: summary.disputes.toString(), icon: AlertTriangle, accent: "bg-danger/10 text-danger" },
        ].map((s) => (
          <Card key={s.label} className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  {s.label}
                </p>
                <p className="text-fluid-xl font-semibold tracking-tight">
                  {s.value}
                </p>
              </div>
              <div
                className={`flex size-11 items-center justify-center rounded-xl ${s.accent}`}
              >
                <s.icon className="size-5" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Date-range picker */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Reporting Period</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="from">
              From
            </label>
            <Input
              id="from"
              type="date"
              value={from}
              max={to || undefined}
              onChange={(e) => setFrom(e.target.value)}
              className="sm:w-48"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="to">
              To
            </label>
            <Input
              id="to"
              type="date"
              value={to}
              min={from || undefined}
              onChange={(e) => setTo(e.target.value)}
              className="sm:w-48"
            />
          </div>
          {(from || to) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFrom("");
                setTo("");
              }}
            >
              Clear range
            </Button>
          )}
          <p className="text-xs text-muted-foreground sm:ml-auto">
            {from || to
              ? `Filtering ${from ? formatDate(from) : "start"} – ${to ? formatDate(to) : "now"}`
              : "No range set — reports include all available data."}
          </p>
        </CardContent>
      </Card>

      {/* Report cards */}
      <div className="grid gap-6 sm:grid-cols-2">
        {REPORTS.map((report) => (
          <Card
            key={report.id}
            className="flex flex-col p-6 transition-shadow hover:shadow-elevated"
          >
            <div className="flex items-start gap-4">
              <div
                className={`flex size-12 items-center justify-center rounded-xl ${report.accent}`}
              >
                <report.icon className="size-6" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="flex items-center gap-2 font-semibold">
                  {report.title}
                  <FileText className="size-3.5 text-muted-foreground" />
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {report.description}
                </p>
              </div>
            </div>
            <div className="mt-5 flex items-center justify-between border-t pt-4">
              <span className="text-xs text-muted-foreground">
                {titleCase(report.id.replace("-", " "))} · CSV
              </span>
              <Button
                variant="brand"
                size="sm"
                onClick={() => generate(report)}
              >
                <Download className="size-4" /> Generate
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
