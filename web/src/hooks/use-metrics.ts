import { useEffect, useRef, useState } from "react";
import { MetricsPayload, ConnectionStatus } from "@/lib/types";

const RECONNECT_BASE_MS = 1000;
const RECONNECT_MAX_MS = 30000;
const WEBSOCKET_ENDPOINT = "/ws";

export function useMetrics() {
  const [metrics, setMetrics] = useState<MetricsPayload | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>("reconnecting");
  const [retryIn, setRetryIn] = useState<number>(0);

  const wsRef = useRef<WebSocket | null>(null);
  const retryCountRef = useRef<number>(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    function clearTimers() {
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    }

    function scheduleReconnect() {
      setStatus("reconnecting");
      wsRef.current = null;

      // exponential backoff: 1s, 2s, 4s, 8s, 16s, 30s (capped)
      const delay = Math.min(
        RECONNECT_BASE_MS * Math.pow(2, retryCountRef.current),
        RECONNECT_MAX_MS,
      );
      retryCountRef.current += 1;
      setRetryIn(Math.round(delay / 1000));

      countdownRef.current = setInterval(() => {
        setRetryIn((prev) => {
          if (prev <= 1) {
            clearInterval(countdownRef.current!);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      retryTimerRef.current = setTimeout(() => {
        clearTimers();
        connect();
      }, delay);
    }

    function connect() {
      // window.location.protocol returns "http:" or "https:", map to "ws" or "wss"
      // separately to build a clean WebSocket URL.
      const scheme = window.location.protocol === "https:" ? "wss" : "ws";
      const url = `${scheme}://${window.location.host}${WEBSOCKET_ENDPOINT}`;

      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        setStatus("connected");
        retryCountRef.current = 0;
        setRetryIn(0);
        clearTimers();
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data) as MetricsPayload;
          setMetrics(payload);
        } catch {
          console.error("failed to parse metrics payload");
        }
      };

      ws.onclose = () => scheduleReconnect();
      ws.onerror = () => ws.close();
    }

    connect();

    return () => {
      clearTimers();
      wsRef.current?.close();
    };
  }, []);

  return { metrics, status, retryIn };
}
