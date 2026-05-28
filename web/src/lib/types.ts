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
  cpuCores: number[];
  ram: number;
  ramUsed: number;
  ramTotal: number;
  diskUsed: number;
  diskTotal: number;
  diskPercent: number;
  netBytesSent: number;
  netBytesRecv: number;
  netSentPerSec: number;
  netRecvPerSec: number;
  uptime: number;
  timestampMillis: number;
  processes: ProcessEntry[];
}

export interface SystemInfo {
  hostname: string;
  os: string;
  platform: string;
  kernel: string;
  cpuModel: string;
  cpuCores: number;
}

export interface InitMessage {
  type: "init";
  systemInfo: SystemInfo;
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

export type WsMessage = InitMessage | MetricsPayload;
