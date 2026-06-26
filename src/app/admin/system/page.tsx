"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  RefreshCw,
  Database,
  Server,
  Cloud,
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { systemService } from "@/services";
import { qk } from "@/lib/query-keys";
import { formatDateTime, titleCase } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface HealthResponse {
  status?: string;
  db?: unknown;
  redis?: unknown;
  [key: string]: unknown;
}

/** Resolve an up/down boolean from a component health value. */
function componentUp(value: unknown): boolean {
  if (value == null) return false;
  if (typeof value === "boolean") return value;
  if (typeof value === "string")
    return ["ok", "up", "healthy", "connected"].includes(value.toLowerCase());
  if (typeof value === "object") {
    const v = value as Record<string, unknown>;
    const s = v.status ?? v.state;
    if (typeof s === "string")
      return ["ok", "up", "healthy", "connected"].includes(s.toLowerCase());
    return true;
  }
  return false;
}

function StatusDot({ up }: { up: boolean }) {
  return (
    <span className="relative flex size-2.5">
      {up && (
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
      )}
      <span
        className={cn(
          "relative inline-flex size-2.5 rounded-full",
          up ? "bg-success" : "bg-danger",
        )}
      />
    </span>
  );
}

function ServiceCard({
  name,
  description,
  icon: Icon,
  up,
}: {
  name: string;
  description: string;
  icon: typeof Database;
  up: boolean;
}) {
  return (
    <Card className="p-6">
      <div className="flex items-start justify-between">
        <div
          className={cn(
            "flex size-11 items-center justify-center rounded-xl",
            up ? "bg-success/10 text-success" : "bg-danger/10 text-danger",
          )}
        >
          <Icon className="size-5" />
        </div>
        <StatusDot up={up} />
      </div>
      <p className="mt-4 font-semibold">{name}</p>
      <p className="text-xs text-muted-foreground">{description}</p>
      <Badge variant={up ? "success" : "danger"} dot className="mt-3">
        {up ? "Operational" : "Down"}
      </Badge>
    </Card>
  );
}

export default function AdminSystemPage() {
  const { data, isFetching, refetch, dataUpdatedAt } = useQuery<HealthResponse>({
    queryKey: qk.health,
    queryFn: () => systemService.health(),
    refetchInterval: 30_000,
  });

  const [rawOpen, setRawOpen] = useState(false);

  const overallOk = (data?.status ?? "").toLowerCase() === "ok";
  const dbUp = componentUp(data?.db);
  const redisUp = componentUp(data?.redis);
  // API is reachable if we got a response at all.
  const apiUp = !!data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="System Health"
        description="Live status of platform infrastructure and dependencies."
        actions={
          <Button
            variant="outline"
            onClick={() => refetch()}
            loading={isFetching}
          >
            <RefreshCw className="size-4" />
            Refresh
          </Button>
        }
      />

      {/* Overall banner */}
      <Card
        className={cn(
          "flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between",
          overallOk
            ? "border-success/20 bg-success/5"
            : "border-warning/30 bg-warning/5",
        )}
      >
        <div className="flex items-center gap-4">
          <div
            className={cn(
              "flex size-12 items-center justify-center rounded-xl",
              overallOk
                ? "bg-success/15 text-success"
                : "bg-warning/15 text-warning",
            )}
          >
            {overallOk ? (
              <CheckCircle2 className="size-6" />
            ) : (
              <AlertTriangle className="size-6" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold">
              {overallOk
                ? "All systems operational"
                : data
                  ? `System ${titleCase(data.status ?? "degraded")}`
                  : "Unable to reach API"}
            </h3>
            <p className="text-sm text-muted-foreground">
              Last checked{" "}
              {dataUpdatedAt
                ? formatDateTime(new Date(dataUpdatedAt).toISOString())
                : "—"}{" "}
              · auto-refreshes every 30s
            </p>
          </div>
        </div>
        <StatusDot up={overallOk} />
      </Card>

      {/* Service cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <ServiceCard
          name="API"
          description="Application server (/api)"
          icon={Server}
          up={apiUp}
        />
        <ServiceCard
          name="Database"
          description="PostgreSQL primary"
          icon={Database}
          up={dbUp}
        />
        <ServiceCard
          name="Redis"
          description="Cache & queue broker"
          icon={Cloud}
          up={redisUp}
        />
      </div>

      {/* Raw JSON collapsible */}
      <Card>
        <CardHeader className="p-0">
          <button
            type="button"
            onClick={() => setRawOpen((o) => !o)}
            className="flex w-full items-center justify-between p-6 text-left"
          >
            <CardTitle className="text-base">Raw health response</CardTitle>
            <ChevronDown
              className={cn(
                "size-4 text-muted-foreground transition-transform",
                rawOpen && "rotate-180",
              )}
            />
          </button>
        </CardHeader>
        {rawOpen && (
          <CardContent>
            <pre className="overflow-auto rounded-lg bg-muted/50 p-4 text-xs leading-relaxed">
              {data
                ? JSON.stringify(data, null, 2)
                : "No response received from /api/health/."}
            </pre>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
