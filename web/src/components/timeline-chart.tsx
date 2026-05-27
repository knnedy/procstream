"use client";

import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { formatPercent } from "@/lib/utils";

interface TimelinePoint {
  timestampMillis: number;
  cpu: number;
  ram: number;
}

interface TimelineChartProps {
  data: TimelinePoint[];
}

function formatTime(timestampMillis: number): string {
  return new Date(timestampMillis).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-(--border) bg-(--card) p-3 font-mono text-xs shadow-xl">
      <p className="mb-2 text-(--muted-foreground)">{formatTime(label)}</p>
      {payload.map((entry: { name: string; value: number; color: string }) => (
        <div key={entry.name} className="flex items-center gap-2">
          <span
            className="h-1.5 w-3 rounded-full"
            style={{ background: entry.color }}
          />
          <span className="uppercase tracking-wider text-(--muted-foreground)">
            {entry.name}
          </span>
          <span className="ml-auto pl-4 font-bold text-foreground">
            {formatPercent(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomLegend({ payload }: any) {
  return (
    <div className="flex items-center justify-end gap-4 pb-2 font-mono text-xs uppercase tracking-widest text-(--muted-foreground)">
      {payload.map((entry: { value: string; color: string }) => (
        <div key={entry.value} className="flex items-center gap-1.5">
          <span
            className="h-1.5 w-3 rounded-full"
            style={{ background: entry.color }}
          />
          {entry.value}
        </div>
      ))}
    </div>
  );
}

export function TimelineChart({ data }: TimelineChartProps) {
  const ticks = useMemo(() => {
    if (data.length === 0) return [];
    // show a tick every 10 seconds
    return data.filter((_, i) => i % 10 === 0).map((d) => d.timestampMillis);
  }, [data]);

  return (
    <div className="flex h-full min-h-61.5 flex-col rounded-xl border border-(--border) bg-(--card) p-4">
      <p className="mb-3 font-mono text-xs uppercase tracking-widest text-(--muted-foreground)">
        60s history
      </p>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
          <defs>
            <linearGradient id="gradient-cpu" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor="var(--chart-cpu)"
                stopOpacity={0.2}
              />
              <stop offset="95%" stopColor="var(--chart-cpu)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradient-ram" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor="var(--chart-ram)"
                stopOpacity={0.2}
              />
              <stop offset="95%" stopColor="var(--chart-ram)" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--border)"
            vertical={false}
          />

          <XAxis
            dataKey="timestampMillis"
            ticks={ticks}
            tickFormatter={formatTime}
            tick={{
              fill: "var(--muted-foreground)",
              fontSize: 10,
              fontFamily: "var(--font-geist-mono)",
            }}
            axisLine={false}
            tickLine={false}
          />

          <YAxis
            domain={[0, 100]}
            tickFormatter={(v) => `${v}%`}
            tick={{
              fill: "var(--muted-foreground)",
              fontSize: 10,
              fontFamily: "var(--font-geist-mono)",
            }}
            axisLine={false}
            tickLine={false}
          />

          <Tooltip
            content={<CustomTooltip />}
            cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
          />

          <Legend content={<CustomLegend />} />

          <Area
            type="monotone"
            dataKey="cpu"
            name="cpu"
            stroke="var(--chart-cpu)"
            strokeWidth={1.5}
            fill="url(#gradient-cpu)"
            dot={false}
            isAnimationActive={false}
          />

          <Area
            type="monotone"
            dataKey="ram"
            name="ram"
            stroke="var(--chart-ram)"
            strokeWidth={1.5}
            fill="url(#gradient-ram)"
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
