// src/ui/features/attack_lab/panel/hooks/attackLabPanelStorage.ts
// Persistencia local del Attack Lab (UI state + evidencia WiFi) usando localStorage, aislada para test/lectura facil.

export type VaultUiState = { scenarioId?: string; mode?: "LAB" | "CUSTOM"; targetIp?: string };

export const UI_STATE_KEY = "netsentinel.attackLab.uiState.v1";
export const WIFI_EVIDENCE_KEY = "netsentinel.attackLab.wifiEvidence.v1";

export const loadUiState = (): VaultUiState | null => {
  try {
    const raw = localStorage.getItem(UI_STATE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as VaultUiState;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
};

export const saveUiState = (state: VaultUiState): void => {
  try {
    localStorage.setItem(UI_STATE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
};

export const loadWifiEvidenceRaw = (): string | null => {
  try {
    return localStorage.getItem(WIFI_EVIDENCE_KEY);
  } catch {
    return null;
  }
};

export const saveWifiEvidenceRaw = (raw: string): void => {
  try {
    localStorage.setItem(WIFI_EVIDENCE_KEY, raw);
  } catch {
    // ignore
  }
};

export const clearWifiEvidenceRaw = (): void => {
  try {
    localStorage.removeItem(WIFI_EVIDENCE_KEY);
  } catch {
    // ignore
  }
};

