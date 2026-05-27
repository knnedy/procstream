"use client";

import { useMemo } from "react";
import { AreaChart, Area, ResponsiveContainer, Tooltip } from "recharts";
import { severityFromPercent, formatPercent } from "@/lib/utils";

interface MetricGaugeProps {
  label: string;
  value: number;
  history: number[];
  color: string;
}

const RING_SIZE = 120;
const STROKE_WIDTH = 8;
const RADIUS = (RING_SIZE - STROKE_WIDTH * 2) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function severityColor(severity: "normal" | "warning" | "critical"): string {
  switch (severity) {
    case "warning":
      return "var(--severity-warning)";
    case "critical":
      return "var(--severity-critical)";
    default:
      return "var(--accent)";
  }
}

export function MetricGauge({
  label,
  value,
  history,
  color,
}: MetricGaugeProps) {
  const severity = severityFromPercent(value);
  const ringColor = severityColor(severity);
  const dashOffset = CIRCUMFERENCE - (value / 100) * CIRCUMFERENCE;

  const chartData = useMemo(() => history.map((v, i) => ({ i, v })), [history]);

  return (
    <div className="flex flex-col items-center gap-3">
      {/* ring */}
      <div className="relative" style={{ width: RING_SIZE, height: RING_SIZE }}>
        <svg
          width={RING_SIZE}
          height={RING_SIZE}
          className="-rotate-90"
          style={{ transform: "rotate(-90deg)" }}>
          {/* track */}
          <circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="var(--border)"
            strokeWidth={STROKE_WIDTH}
          />
          {/* fill */}
          <circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke={ringColor}
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            style={{
              transition: "stroke-dashoffset 0.5s ease, stroke 0.5s ease",
            }}
          />
        </svg>

        {/* center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="font-mono text-xl font-bold leading-none"
            style={{ color: ringColor, transition: "color 0.5s ease" }}>
            {Math.round(value)}%
          </span>
          <span className="mt-1 text-xs font-mono uppercase tracking-widest text-(--muted-foreground)">
            {label}
          </span>
        </div>
      </div>

      {/* sparkline */}
      <div className="w-full" style={{ height: 48 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient
                id={`gradient-${label}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="v"
              stroke={color}
              strokeWidth={1.5}
              fill={`url(#gradient-${label})`}
              dot={false}
              isAnimationActive={false}
            />
            <Tooltip
              content={({ active, payload }) =>
                active && payload?.length ? (
                  <div className="rounded border border-(--border) bg-(--card) px-2 py-1 font-mono text-xs text-foreground">
                    {formatPercent(payload[0].value as number)}
                  </div>
                ) : null
              }
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
