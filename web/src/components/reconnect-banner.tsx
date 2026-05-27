"use client";

import { WifiOff, Loader2 } from "lucide-react";
import { ConnectionStatus } from "@/lib/types";

interface ReconnectBannerProps {
  status: ConnectionStatus;
  retryIn: number;
}

export function ReconnectBanner({ status, retryIn }: ReconnectBannerProps) {
  if (status === "connected") return null;

  const isReconnecting = status === "reconnecting";

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-2 py-2 text-sm font-mono"
      style={{
        background: isReconnecting
          ? "var(--severity-warning)"
          : "var(--severity-critical)",
        color: "#0d0f14",
      }}>
      {isReconnecting ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <WifiOff className="h-3.5 w-3.5" />
      )}
      <span>
        {isReconnecting
          ? `reconnecting in ${retryIn}s...`
          : "disconnected — unable to reach server"}
      </span>
    </div>
  );
}
