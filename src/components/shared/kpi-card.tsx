"use client";

import { motion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface KpiCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  delta?: number; // percent change
  deltaLabel?: string;
  accent?: "brand" | "teal" | "success" | "warning" | "danger" | "primary";
  hint?: string;
  index?: number;
}

const ACCENT_BG: Record<NonNullable<KpiCardProps["accent"]>, string> = {
  brand: "bg-brand/10 text-brand",
  teal: "bg-teal/10 text-teal",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  danger: "bg-danger/10 text-danger",
  primary: "bg-primary/10 text-primary",
};

export function KpiCard({
  label,
  value,
  icon: Icon,
  delta,
  deltaLabel,
  accent = "brand",
  hint,
  index = 0,
}: KpiCardProps) {
  const positive = (delta ?? 0) >= 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05, ease: "easeOut" }}
    >
      <Card className="group relative overflow-hidden p-6 transition-shadow hover:shadow-elevated">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="text-fluid-xl font-semibold tracking-tight text-foreground">
              {value}
            </p>
          </div>
          {Icon && (
            <div
              className={cn(
                "flex size-11 items-center justify-center rounded-xl transition-transform group-hover:scale-105",
                ACCENT_BG[accent],
              )}
            >
              <Icon className="size-5" />
            </div>
          )}
        </div>
        {(delta !== undefined || hint) && (
          <div className="mt-4 flex items-center gap-2 text-xs">
            {delta !== undefined && (
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-medium",
                  positive
                    ? "bg-success/10 text-success"
                    : "bg-danger/10 text-danger",
                )}
              >
                {positive ? (
                  <ArrowUpRight className="size-3" />
                ) : (
                  <ArrowDownRight className="size-3" />
                )}
                {Math.abs(delta).toFixed(1)}%
              </span>
            )}
            <span className="text-muted-foreground">
              {deltaLabel ?? hint}
            </span>
          </div>
        )}
      </Card>
    </motion.div>
  );
}
