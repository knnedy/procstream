export interface ProcessEntry {
  pid: number;
  name: string;
  cpu: number;
  memory: number;
  owner: string;
  canKill: boolean;
}

export interface MetricsPayload {
  cpu: number;
  ram: number;
  ramUsed: number;
  ramTotal: number;
  uptime: number;
  timestampMillis: number;
  processes: ProcessEntry[];
}

export interface KillRequest {
  pid: number;
}

export interface KillResponse {
  pid: number;
  success: boolean;
  error?: string;
}

export type ConnectionStatus = "connected" | "reconnecting" | "disconnected";
