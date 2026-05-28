import { useMemo } from "react";

interface TopOffendersProps {
  title: string;
  processes: Array<{ pid: number; name: string; cpu: number; memory: number }>;
  sortKey: "cpu" | "memory";
  color: string;
  format: (v: number) => string;
}

export default function TopOffenders({
  title,
  processes,
  sortKey,
  color,
  format,
}: TopOffendersProps) {
  const top5 = useMemo(
    () => [...processes].sort((a, b) => b[sortKey] - a[sortKey]).slice(0, 5),
    [processes, sortKey],
  );

  const max = top5[0]?.[sortKey] ?? 1;

  return (
    <div className="rounded-xl border border-(--border) bg-(--card) p-5 space-y-4">
      <p className="font-mono text-[10px] uppercase tracking-widest text-(--muted-foreground)">
        {title}
      </p>
      <div className="space-y-3">
        {top5.map((p) => (
          <div key={p.pid} className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-foreground truncate max-w-40">
                {p.name}
              </span>
              <span className="font-mono text-xs font-medium" style={{ color }}>
                {format(p[sortKey])}
              </span>
            </div>
            <div className="h-1 w-full rounded-full bg-(--muted) overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${(p[sortKey] / max) * 100}%`,
                  background: color,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
