"use client";

import { useState, useEffect, useRef } from "react";
import { useMetrics } from "@/hooks/use-metrics";
import { MetricGauge } from "@/components/metric-gauge";
import { TimelineChart } from "@/components/timeline-chart";
import { ProcessTable } from "@/components/process-table";
import { ReconnectBanner } from "@/components/reconnect-banner";
import { ThemeToggle } from "@/components/theme-toggle";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatBytes, formatUptime, formatPercent } from "@/lib/utils";
import {
  Activity,
  HardDrive,
  Network,
  Server,
  LayoutDashboard,
  List,
} from "lucide-react";
import TopOffenders from "@/components/top-offenders";

const MAX_HISTORY = 60;

interface TimelinePoint {
  timestampMillis: number;
  cpu: number;
  ram: number;
  net: number;
}

export default function Page() {
  const { metrics, systemInfo, status, retryIn } = useMetrics();

  const [cpuHistory, setCpuHistory] = useState<number[]>([]);
  const [ramHistory, setRamHistory] = useState<number[]>([]);
  const [timeline, setTimeline] = useState<TimelinePoint[]>([]);
  const prevTimestamp = useRef<number>(0);

  useEffect(() => {
    if (!metrics) return;
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
        net: metrics.netRecvPerSec / 1024,
      },
    ]);
  }, [metrics]);

  return (
    <div className="min-h-screen bg-background">
      <ReconnectBanner status={status} retryIn={retryIn} />

      {/* header */}
      <header className="sticky top-0 z-40 border-b border-(--border) bg-(--card)/80 backdrop-blur-sm px-6 py-3">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Activity className="h-4 w-4 text-(--accent)" />
            <span className="font-mono text-sm font-bold tracking-widest uppercase text-foreground">
              ProcStream
            </span>
          </div>
          <div className="flex items-center gap-6">
            {metrics && (
              <div className="hidden items-center gap-5 font-mono text-xs text-(--muted-foreground) sm:flex">
                <span>
                  up{" "}
                  <span className="text-foreground">
                    {formatUptime(metrics.uptime)}
                  </span>
                </span>
                <span>
                  ram{" "}
                  <span className="text-foreground">
                    {formatBytes(metrics.ramUsed)}
                  </span>
                  <span className="text-(--muted-foreground)">
                    /{formatBytes(metrics.ramTotal)}
                  </span>
                </span>
                <span>
                  procs{" "}
                  <span className="text-foreground">
                    {metrics.processes.length}
                  </span>
                </span>
                {systemInfo && (
                  <span className="hidden lg:inline">
                    <span className="text-foreground">
                      {systemInfo.hostname}
                    </span>
                  </span>
                )}
              </div>
            )}
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-6">
        <Tabs defaultValue="overview" className="flex flex-col">
          <TabsList className="mb-6 flex flex-row w-fit self-start rounded-lg bg-(--muted) border border-(--border) p-1 gap-1">
            <TabsTrigger
              value="overview"
              className="flex items-center gap-1.5 rounded-md px-4 py-1.5 font-mono text-xs uppercase tracking-widest text-(--muted-foreground) transition-all data-[state=active]:bg-(--accent) data-[state=active]:text-(--accent-foreground) data-[state=active]:shadow-sm hover:text-foreground">
              <LayoutDashboard className="h-3 w-3" />
              overview
            </TabsTrigger>
            <TabsTrigger
              value="processes"
              className="flex items-center gap-1.5 rounded-md px-4 py-1.5 font-mono text-xs uppercase tracking-widest text-(--muted-foreground) transition-all data-[state=active]:bg-(--accent) data-[state=active]:text-(--accent-foreground) data-[state=active]:shadow-sm hover:text-foreground">
              <List className="h-3 w-3" />
              processes
            </TabsTrigger>
            <TabsTrigger
              value="system"
              className="flex items-center gap-1.5 rounded-md px-4 py-1.5 font-mono text-xs uppercase tracking-widest text-(--muted-foreground) transition-all data-[state=active]:bg-(--accent) data-[state=active]:text-(--accent-foreground) data-[state=active]:shadow-sm hover:text-foreground">
              <Server className="h-3 w-3" />
              system
            </TabsTrigger>
          </TabsList>

          {/*  overview tab  */}
          <TabsContent value="overview" className="space-y-6">
            {/* four metric gauges */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <div className="flex items-center justify-center rounded-xl border border-(--border) bg-(--card) py-8">
                <MetricGauge
                  label="CPU"
                  value={metrics?.cpu ?? 0}
                  history={cpuHistory}
                  color="var(--chart-cpu)"
                />
              </div>
              <div className="flex items-center justify-center rounded-xl border border-(--border) bg-(--card) py-8">
                <MetricGauge
                  label="RAM"
                  value={metrics?.ram ?? 0}
                  history={ramHistory}
                  color="var(--chart-ram)"
                />
              </div>
              <div className="flex items-center justify-center rounded-xl border border-(--border) bg-(--card) py-8">
                <MetricGauge
                  label="DISK"
                  value={metrics?.diskPercent ?? 0}
                  history={[]}
                  color="var(--chart-cpu)"
                />
              </div>
              <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-(--border) bg-(--card) py-8 px-4">
                <Network className="h-5 w-5 text-(--accent)" />
                <div className="text-center font-mono">
                  <p className="text-[10px] uppercase tracking-widest text-(--muted-foreground) mb-2">
                    network
                  </p>
                  <div className="space-y-1">
                    <p className="text-xs">
                      <span className="text-(--muted-foreground)">↑ </span>
                      <span className="text-foreground font-medium">
                        {formatBytes(metrics?.netSentPerSec ?? 0)}/s
                      </span>
                    </p>
                    <p className="text-xs">
                      <span className="text-(--muted-foreground)">↓ </span>
                      <span className="text-foreground font-medium">
                        {formatBytes(metrics?.netRecvPerSec ?? 0)}/s
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* timeline chart */}
            <TimelineChart data={timeline} />

            {/* top 5 offenders */}
            {metrics && (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <TopOffenders
                  title="top cpu"
                  processes={metrics.processes}
                  sortKey="cpu"
                  color="var(--chart-cpu)"
                  format={(v) => formatPercent(v)}
                />
                <TopOffenders
                  title="top ram"
                  processes={metrics.processes}
                  sortKey="memory"
                  color="var(--chart-ram)"
                  format={(v) => formatPercent(v)}
                />
              </div>
            )}
          </TabsContent>

          {/*  processes tab  */}
          <TabsContent value="processes">
            {metrics && (
              <ProcessTable
                processes={metrics.processes}
                totalRam={metrics.ramTotal}
              />
            )}
          </TabsContent>

          {/*  system tab  */}
          <TabsContent value="system" className="space-y-4">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {/* system info */}
              <div className="rounded-xl border border-(--border) bg-(--card) p-6 space-y-4">
                <p className="font-mono text-[10px] uppercase tracking-widest text-(--muted-foreground)">
                  system info
                </p>
                {systemInfo ? (
                  <div className="space-y-3">
                    {[
                      { label: "hostname", value: systemInfo.hostname },
                      { label: "os", value: systemInfo.os },
                      { label: "platform", value: systemInfo.platform },
                      { label: "kernel", value: systemInfo.kernel },
                      { label: "cpu", value: systemInfo.cpuModel },
                      { label: "cores", value: String(systemInfo.cpuCores) },
                    ].map(({ label, value }) => (
                      <div
                        key={label}
                        className="flex items-center justify-between border-b border-(--border)/50 pb-2 last:border-0 last:pb-0">
                        <span className="font-mono text-xs text-(--muted-foreground) uppercase tracking-wider">
                          {label}
                        </span>
                        <span className="font-mono text-xs text-foreground">
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="font-mono text-xs text-(--muted-foreground)">
                    loading...
                  </p>
                )}
              </div>

              {/* disk info */}
              <div className="rounded-xl border border-(--border) bg-(--card) p-6 space-y-4">
                <p className="font-mono text-[10px] uppercase tracking-widest text-(--muted-foreground)">
                  storage
                </p>
                {metrics && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <HardDrive className="h-4 w-4 text-(--accent)" />
                        <span className="font-mono text-xs text-foreground">
                          /
                        </span>
                      </div>
                      <span className="font-mono text-xs text-(--muted-foreground)">
                        {formatBytes(metrics.diskUsed)} /{" "}
                        {formatBytes(metrics.diskTotal)}
                      </span>
                    </div>
                    {/* disk usage bar */}
                    <div className="h-2 w-full rounded-full bg-(--muted) overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${metrics.diskPercent}%`,
                          background:
                            metrics.diskPercent >= 90
                              ? "var(--severity-critical)"
                              : metrics.diskPercent >= 70
                                ? "var(--severity-warning)"
                                : "var(--accent)",
                        }}
                      />
                    </div>
                    <p className="font-mono text-xs text-(--muted-foreground)">
                      {formatPercent(metrics.diskPercent)} used
                    </p>
                  </div>
                )}
              </div>

              {/* per-core CPU */}
              <div className="rounded-xl border border-(--border) bg-(--card) p-6 space-y-4 lg:col-span-2">
                <p className="font-mono text-[10px] uppercase tracking-widest text-(--muted-foreground)">
                  per-core cpu
                </p>
                {metrics?.cpuCores && metrics.cpuCores.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
                    {metrics.cpuCores.map((core, i) => (
                      <div key={i} className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[10px] text-(--muted-foreground)">
                            c{i}
                          </span>
                          <span
                            className="font-mono text-[10px] font-medium"
                            style={{
                              color:
                                core >= 90
                                  ? "var(--severity-critical)"
                                  : core >= 70
                                    ? "var(--severity-warning)"
                                    : "var(--accent)",
                            }}>
                            {Math.round(core)}%
                          </span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-(--muted) overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${core}%`,
                              background:
                                core >= 90
                                  ? "var(--severity-critical)"
                                  : core >= 70
                                    ? "var(--severity-warning)"
                                    : "var(--accent)",
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="font-mono text-xs text-(--muted-foreground)">
                    loading...
                  </p>
                )}
              </div>

              {/* network stats */}
              <div className="rounded-xl border border-(--border) bg-(--card) p-6 space-y-4 lg:col-span-2">
                <p className="font-mono text-[10px] uppercase tracking-widest text-(--muted-foreground)">
                  network i/o
                </p>
                {metrics && (
                  <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
                    {[
                      {
                        label: "sent/s",
                        value: formatBytes(metrics.netSentPerSec),
                        icon: "↑",
                      },
                      {
                        label: "recv/s",
                        value: formatBytes(metrics.netRecvPerSec),
                        icon: "↓",
                      },
                      {
                        label: "total ↑",
                        value: formatBytes(metrics.netBytesSent),
                        icon: "↑",
                      },
                      {
                        label: "total ↓",
                        value: formatBytes(metrics.netBytesRecv),
                        icon: "↓",
                      },
                    ].map(({ label, value, icon }) => (
                      <div key={label} className="space-y-1">
                        <p className="font-mono text-[10px] uppercase tracking-wider text-(--muted-foreground)">
                          {label}
                        </p>
                        <p className="font-mono text-sm font-medium text-foreground">
                          <span className="text-(--accent) mr-1">{icon}</span>
                          {value}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
