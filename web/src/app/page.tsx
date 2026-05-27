"use client";

import { useState, useEffect, useRef } from "react";
import { useMetrics } from "@/hooks/use-metrics";
import { MetricGauge } from "@/components/metric-gauge";
import { TimelineChart } from "@/components/timeline-chart";
import { ProcessTable } from "@/components/process-table";
import { ReconnectBanner } from "@/components/reconnect-banner";
import { ThemeToggle } from "@/components/theme-toggle";
import { formatBytes, formatUptime } from "@/lib/utils";
import { Activity } from "lucide-react";

const MAX_HISTORY = 60;

interface TimelinePoint {
  timestampMillis: number;
  cpu: number;
  ram: number;
}

export default function Page() {
  const { metrics, status, retryIn } = useMetrics();

  const [cpuHistory, setCpuHistory] = useState<number[]>([]);
  const [ramHistory, setRamHistory] = useState<number[]>([]);
  const [timeline, setTimeline] = useState<TimelinePoint[]>([]);
  const prevTimestamp = useRef<number>(0);

  useEffect(() => {
    if (!metrics) return;
    // deduplicate ticks — skip if same timestamp arrives twice
    if (metrics.timestampMillis === prevTimestamp.current) return;
    prevTimestamp.current = metrics.timestampMillis;

    setCpuHistory((prev) => [...prev.slice(-MAX_HISTORY + 1), metrics.cpu]);
    setRamHistory((prev) => [...prev.slice(-MAX_HISTORY + 1), metrics.ram]);
    setTimeline((prev) => [
      ...prev.slice(-MAX_HISTORY + 1),
      {
        timestampMillis: metrics.timestampMillis,
        cpu: metrics.cpu,
        ram: metrics.ram,
      },
    ]);
  }, [metrics]);

  return (
    <div className="min-h-screen bg-background">
      <ReconnectBanner status={status} retryIn={retryIn} />

      {/* header */}
      <header className="border-b border-(--border) bg-(--card) px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Activity className="h-5 w-5 text-(--accent)" />
            <span className="font-mono text-sm font-bold tracking-widest uppercase text-foreground">
              ProcStream
            </span>
          </div>
          <div className="flex items-center gap-6">
            {metrics && (
              <div className="hidden items-center gap-6 font-mono text-xs text-(--muted-foreground) sm:flex">
                <span>
                  uptime{" "}
                  <span className="text-foreground">
                    {formatUptime(metrics.uptime)}
                  </span>
                </span>
                <span>
                  ram{" "}
                  <span className="text-foreground">
                    {formatBytes(metrics.ramUsed)} /{" "}
                    {formatBytes(metrics.ramTotal)}
                  </span>
                </span>
                <span>
                  processes{" "}
                  <span className="text-foreground">
                    {metrics.processes.length}
                  </span>
                </span>
              </div>
            )}
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-6 py-8">
        {/* hero gauges */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="col-span-1 flex items-center justify-center rounded-xl border border-(--border) bg-(--card) py-8">
            <MetricGauge
              label="CPU"
              value={metrics?.cpu ?? 0}
              history={cpuHistory}
              color="var(--chart-cpu)"
            />
          </div>
          <div className="col-span-1 flex items-center justify-center rounded-xl border border-(--border) bg-(--card) py-8">
            <MetricGauge
              label="RAM"
              value={metrics?.ram ?? 0}
              history={ramHistory}
              color="var(--chart-ram)"
            />
          </div>
          <div className="col-span-2 lg:col-span-2">
            <TimelineChart data={timeline} />
          </div>
        </div>

        {/* process table */}
        {metrics && (
          <ProcessTable
            processes={metrics.processes}
            totalRam={metrics.ramTotal}
          />
        )}
      </main>
    </div>
  );
}
