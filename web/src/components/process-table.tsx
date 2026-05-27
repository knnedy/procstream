"use client";

import { useRef, useState, useMemo, useCallback } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ArrowUpDown, ArrowUp, ArrowDown, Skull } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ProcessEntry, KillRequest, KillResponse } from "@/lib/types";
import { formatPercent, formatBytes, severityFromPercent } from "@/lib/utils";

interface ProcessTableProps {
  processes: ProcessEntry[];
  totalRam: number;
}

const columnHelper = createColumnHelper<ProcessEntry>();

function SortIcon({ isSorted }: { isSorted: false | "asc" | "desc" }) {
  if (isSorted === "asc") return <ArrowUp className="ml-1 h-3 w-3 inline" />;
  if (isSorted === "desc") return <ArrowDown className="ml-1 h-3 w-3 inline" />;
  return <ArrowUpDown className="ml-1 h-3 w-3 inline opacity-30" />;
}

function severityClass(severity: "normal" | "warning" | "critical"): string {
  switch (severity) {
    case "warning":
      return "text-(--severity-warning)";
    case "critical":
      return "text-(--severity-critical)";
    default:
      return "text-foreground";
  }
}

export function ProcessTable({ processes, totalRam }: ProcessTableProps) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "cpu", desc: true },
  ]);
  const [userOnly, setUserOnly] = useState(false);
  const [killingPids, setKillingPids] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState("");
  const parentRef = useRef<HTMLDivElement>(null);

  const handleKill = useCallback(async (pid: number) => {
    setKillingPids((prev) => new Set(prev).add(pid));

    try {
      const res = await fetch("/kill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pid } satisfies KillRequest),
      });
      const result: KillResponse = await res.json();
      if (!result.success) {
        console.error(`kill failed: ${result.error}`);
        setKillingPids((prev) => {
          const next = new Set(prev);
          next.delete(pid);
          return next;
        });
      }
    } catch {
      setKillingPids((prev) => {
        const next = new Set(prev);
        next.delete(pid);
        return next;
      });
    }
  }, []);

  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        header: "Process",
        cell: (info) => (
          <span className="font-mono text-xs font-medium text-foreground truncate max-w-45 block">
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor("pid", {
        header: "PID",
        cell: (info) => (
          <span className="font-mono text-xs text-(--muted-foreground)">
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor("cpu", {
        header: "CPU",
        cell: (info) => {
          const value = info.getValue();
          const severity = severityFromPercent(value);
          return (
            <span
              className={`font-mono text-xs font-medium ${severityClass(severity)}`}>
              {formatPercent(value)}
            </span>
          );
        },
      }),
      columnHelper.accessor("memory", {
        header: "RAM",
        cell: (info) => {
          const value = info.getValue();
          const severity = severityFromPercent(value);
          const bytes = (value / 100) * totalRam;
          return (
            <div className="flex flex-col">
              <span
                className={`font-mono text-xs font-medium ${severityClass(severity)}`}>
                {formatPercent(value)}
              </span>
              <span className="font-mono text-[10px] text-(--muted-foreground)">
                {formatBytes(bytes)}
              </span>
            </div>
          );
        },
      }),
      columnHelper.accessor("owner", {
        header: "Owner",
        cell: (info) => (
          <Badge
            variant="outline"
            className="font-mono text-[10px] text-(--muted-foreground) border-(--border)">
            {info.getValue()}
          </Badge>
        ),
      }),
      columnHelper.accessor("canKill", {
        header: "",
        enableSorting: false,
        cell: (info) => {
          const pid = info.row.original.pid;
          const canKill = info.getValue();
          const killing = killingPids.has(pid);

          return (
            <Button
              variant="ghost"
              size="sm"
              disabled={!canKill || killing}
              onClick={() => handleKill(pid)}
              className={`h-7 px-2 font-mono text-xs transition-all ${
                killing
                  ? "text-(--severity-warning) opacity-60"
                  : canKill
                    ? "text-(--severity-critical) hover:bg-(--severity-critical)/10"
                    : "opacity-20 cursor-not-allowed"
              }`}>
              <Skull className="mr-1 h-3 w-3" />
              {killing ? "killing..." : "kill"}
            </Button>
          );
        },
      }),
    ],
    [killingPids, handleKill, totalRam],
  );

  const filteredData = useMemo(() => {
    const currentPids = new Set(processes.map((p) => p.pid));
    setKillingPids((prev) => {
      const next = new Set([...prev].filter((pid) => currentPids.has(pid)));
      return next.size !== prev.size ? next : prev;
    });

    return processes.filter((p) => {
      if (userOnly && !p.canKill) return false;
      if (search) {
        const q = search.toLowerCase();
        return p.name.toLowerCase().includes(q) || p.pid.toString().includes(q);
      }
      return true;
    });
  }, [processes, userOnly, search]);

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const rows = table.getRowModel().rows;

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 48,
    overscan: 10,
  });

  const virtualItems = virtualizer.getVirtualItems();
  const totalVirtualSize = virtualizer.getTotalSize();

  return (
    <div className="rounded-xl border border-(--border) bg-(--card)">
      {/* toolbar */}
      <div className="flex items-center justify-between gap-4 border-b border-(--border) px-4 py-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="search process or pid..."
          className="w-64 rounded-lg border border-(--border) bg-(--muted) px-3 py-1.5 font-mono text-xs text-foreground placeholder:text-(--muted-foreground) outline-none focus:border-(--accent) transition-colors"
        />
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-(--muted-foreground)">
            user tasks only
          </span>
          <Switch checked={userOnly} onCheckedChange={setUserOnly} />
        </div>
      </div>

      {/* header */}
      <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_80px] border-b border-(--border) px-4">
        {table.getHeaderGroups().map((headerGroup) =>
          headerGroup.headers.map((header) => (
            <div
              key={header.id}
              onClick={
                header.column.getCanSort()
                  ? header.column.getToggleSortingHandler()
                  : undefined
              }
              className={`py-2.5 font-mono text-[10px] uppercase tracking-widest text-(--muted-foreground) ${
                header.column.getCanSort()
                  ? "cursor-pointer select-none hover:text-foreground transition-colors"
                  : ""
              }`}>
              {flexRender(header.column.columnDef.header, header.getContext())}
              {header.column.getCanSort() && (
                <SortIcon isSorted={header.column.getIsSorted()} />
              )}
            </div>
          )),
        )}
      </div>

      {/* virtualised rows */}
      <div ref={parentRef} className="overflow-y-auto" style={{ height: 480 }}>
        <div style={{ height: totalVirtualSize, position: "relative" }}>
          {virtualItems.map((virtualItem) => {
            const row = rows[virtualItem.index];
            const killing = killingPids.has(row.original.pid);

            return (
              <div
                key={row.id}
                style={{
                  position: "absolute",
                  top: virtualItem.start,
                  left: 0,
                  right: 0,
                  height: virtualItem.size,
                }}
                className={`grid grid-cols-[2fr_1fr_1fr_1fr_1fr_80px] items-center border-b border-(--border)/50 px-4 transition-opacity ${
                  killing ? "opacity-40" : "hover:bg-(--muted)/50"
                }`}>
                {row.getVisibleCells().map((cell) => (
                  <div key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* footer */}
      <div className="border-t border-(--border) px-4 py-2">
        <span className="font-mono text-[10px] text-(--muted-foreground)">
          {rows.length} processes
        </span>
      </div>
    </div>
  );
}
