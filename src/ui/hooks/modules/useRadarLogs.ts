import { useSyncExternalStore } from "react";

// Logs de Radar en memoria (frontend). Se usan para depuracion educativa y trazabilidad local:
// cada escaneo registra un resumen y una linea por red detectada.

type Listener = () => void;

let radarLogs: string[] = [];
const listeners = new Set<Listener>();

const emit = () => {
  listeners.forEach((l) => l());
};

const subscribe = (listener: Listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const getSnapshot = () => radarLogs;

const formatTime = (ts: number) => {
  const d = new Date(ts);
  return d.toLocaleTimeString();
};

export const addRadarLog = (message: string) => {
  const line = `[${formatTime(Date.now())}] ${message}`;
  // Evitar crecimiento sin limite (proteccion defensiva).
  radarLogs = [...radarLogs, line].slice(-500);
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

