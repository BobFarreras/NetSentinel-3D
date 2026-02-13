// src/ui/features/radar/hooks/useWifiRadarSelection.ts
// Seleccion global para Radar View: sincroniza seleccion entre RADAR VIEW (nodos) y RADAR LOGS (tabla).

import { useSyncExternalStore } from "react";

type Listener = () => void;

let selectedBssid: string | null = null;
const listeners = new Set<Listener>();

const emit = () => {
  listeners.forEach((l) => l());
};

const subscribe = (listener: Listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const getSnapshot = () => selectedBssid;

export const setSelectedWifiBssid = (bssid: string | null) => {
  selectedBssid = bssid;
  emit();
};

export const useWifiRadarSelection = () => {
  const bssid = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return {
    selectedBssid: bssid,
    setSelectedBssid: setSelectedWifiBssid,
    clear: () => setSelectedWifiBssid(null),
  };
};
