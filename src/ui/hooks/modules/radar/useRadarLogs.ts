import { useSyncExternalStore } from "react";
import type { WifiNetworkDTO } from "../../../../shared/dtos/NetworkDTOs";

// Logs estructurados del Radar (frontend).
// Objetivo: trazabilidad local + una vista tipo "tabla" (similar a LIVE TRAFFIC).

type Listener = () => void;

export type RadarLogEntry =
  | { ts: number; kind: "scan"; message: string; count: number }
  | { ts: number; kind: "network"; network: WifiNetworkDTO }
  | { ts: number; kind: "error"; message: string };

let radarLogs: RadarLogEntry[] = [];
const listeners = new Set<Listener>();

const emit = () => {
  listeners.forEach((l) => l());
};

const subscribe = (listener: Listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const getSnapshot = () => radarLogs;

export const addRadarScanLog = (count: number) => {
  const entry: RadarLogEntry = {
    ts: Date.now(),
    kind: "scan",
    count,
    message: `scan_airwaves: ${count} redes detectadas`,
  };
  radarLogs = [...radarLogs, entry].slice(-800);
  emit();
};

export const addRadarNetworkLog = (network: WifiNetworkDTO) => {
  const entry: RadarLogEntry = {
    ts: Date.now(),
    kind: "network",
    network,
  };
  radarLogs = [...radarLogs, entry].slice(-800);
  emit();
};

export const addRadarErrorLog = (message: string) => {
  const entry: RadarLogEntry = {
    ts: Date.now(),
    kind: "error",
    message,
  };
  radarLogs = [...radarLogs, entry].slice(-800);
  emit();
};

export const clearRadarLogs = () => {
  radarLogs = [];
  emit();
};

export const useRadarLogs = () => {
  const logs = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return { logs, clear: clearRadarLogs };
};
