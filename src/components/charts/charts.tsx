"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--chart-6))",
];

const axisProps = {
  stroke: "hsl(var(--muted-foreground))",
  fontSize: 12,
  tickLine: false,
  axisLine: false,
};

function ChartTooltip() {
  return (
    <Tooltip
      cursor={{ fill: "hsl(var(--muted) / 0.4)" }}
      contentStyle={{
        background: "hsl(var(--popover))",
        border: "1px solid hsl(var(--border))",
        borderRadius: "0.75rem",
        boxShadow: "0 8px 24px -8px rgb(15 23 42 / 0.2)",
        fontSize: "12px",
        color: "hsl(var(--popover-foreground))",
      }}
      labelStyle={{ color: "hsl(var(--muted-foreground))", marginBottom: 4 }}
    />
  );
}

interface SeriesPoint {
  [key: string]: string | number;
}

export function AreaTrendChart({
  data,
  xKey,
  series,
  height = 280,
}: {
  data: SeriesPoint[];
  xKey: string;
  series: { key: string; label: string; color?: string }[];
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ left: -16, right: 8, top: 8 }}>
        <defs>
          {series.map((s, i) => (
            <linearGradient
              key={s.key}
              id={`grad-${s.key}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="0%"
                stopColor={s.color ?? CHART_COLORS[i % CHART_COLORS.length]}
                stopOpacity={0.28}
              />
              <stop
                offset="100%"
                stopColor={s.color ?? CHART_COLORS[i % CHART_COLORS.length]}
                stopOpacity={0}
              />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="hsl(var(--border))"
          vertical={false}
        />
        <XAxis dataKey={xKey} {...axisProps} />
        <YAxis {...axisProps} width={48} />
        <ChartTooltip />
        {series.map((s, i) => (
          <Area
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.label}
            stroke={s.color ?? CHART_COLORS[i % CHART_COLORS.length]}
            strokeWidth={2}
            fill={`url(#grad-${s.key})`}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function BarSeriesChart({
  data,
  xKey,
  series,
  height = 280,
}: {
  data: SeriesPoint[];
  xKey: string;
  series: { key: string; label: string; color?: string }[];
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ left: -16, right: 8, top: 8 }}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="hsl(var(--border))"
          vertical={false}
        />
        <XAxis dataKey={xKey} {...axisProps} />
        <YAxis {...axisProps} width={48} />
        <ChartTooltip />
        {series.map((s, i) => (
          <Bar
            key={s.key}
            dataKey={s.key}
            name={s.label}
            fill={s.color ?? CHART_COLORS[i % CHART_COLORS.length]}
            radius={[6, 6, 0, 0]}
            maxBarSize={44}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

export function LineSeriesChart({
  data,
  xKey,
  series,
  height = 280,
}: {
  data: SeriesPoint[];
  xKey: string;
  series: { key: string; label: string; color?: string }[];
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ left: -16, right: 8, top: 8 }}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="hsl(var(--border))"
          vertical={false}
        />
        <XAxis dataKey={xKey} {...axisProps} />
        <YAxis {...axisProps} width={48} />
        <ChartTooltip />
        {series.map((s, i) => (
          <Line
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.label}
            stroke={s.color ?? CHART_COLORS[i % CHART_COLORS.length]}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 5 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

export function DonutChart({
  data,
  height = 280,
  innerRadius = 64,
}: {
  data: { name: string; value: number; color?: string }[];
  height?: number;
  innerRadius?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius={innerRadius}
          outerRadius={innerRadius + 32}
          paddingAngle={3}
          strokeWidth={0}
        >
          {data.map((entry, i) => (
            <Cell
              key={entry.name}
              fill={entry.color ?? CHART_COLORS[i % CHART_COLORS.length]}
            />
          ))}
        </Pie>
        <ChartTooltip />
        <Legend
          iconType="circle"
          iconSize={8}
          formatter={(value) => (
            <span className="text-xs text-muted-foreground">{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

export { CHART_COLORS };
