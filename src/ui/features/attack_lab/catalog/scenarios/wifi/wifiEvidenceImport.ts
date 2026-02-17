// src/ui/features/attack_lab/catalog/scenarios/wifi/wifiEvidenceImport.ts
// Herramienta WiFi: importa y valida evidencias (PMKID/handshake) para auditoria y reporte, sin ejecutar acciones activas.

import type { AttackLabScenario } from "../../types";
import { parseWifiEvidence } from "../../../logic/parseWifiEvidence";

const WIFI_EVIDENCE_STORAGE_KEY = "netsentinel.attackLab.wifiEvidence.v1";

function getUiLanguage(): "es" | "ca" | "en" {
  try {
    const raw = localStorage.getItem("netsentinel.uiLanguage");
    if (raw === "ca" || raw === "en" || raw === "es") return raw;
  } catch {
    // ignore
  }
  return "es";
}

function T(key: string): string {
  const lang = getUiLanguage();
  const table: Record<string, Record<string, string>> = {
    es: {
      banner: "=== WIFI: EVIDENCE IMPORT ===",
      missing: "ERROR: no hay evidencia cargada. Usa el importador en el panel antes de ejecutar.",
      ok: "OK: evidencia parseada.",
      warn: "WARN: no se pudo parsear evidencia (formato no reconocido).",
      next: "NEXT",
      nextStore: "Guarda esta evidencia junto al informe de auditoria.",
      nextHardening: "Si es WPA2-PSK: migrar a WPA3/SAE y usar PSK fuerte.",
    },
    ca: {
      banner: "=== WIFI: EVIDENCE IMPORT ===",
      missing: "ERROR: no hi ha evidencia carregada. Usa l'importador del panell abans d'executar.",
      ok: "OK: evidencia parsejada.",
      warn: "WARN: no s'ha pogut parsejar evidencia (format no reconegut).",
      next: "NEXT",
      nextStore: "Guarda aquesta evidencia junt amb l'informe d'auditoria.",
      nextHardening: "Si es WPA2-PSK: migrar a WPA3/SAE i usar PSK forta.",
    },
    en: {
      banner: "=== WIFI: EVIDENCE IMPORT ===",
      missing: "ERROR: no evidence loaded. Use the panel importer before running.",
      ok: "OK: evidence parsed.",
      warn: "WARN: could not parse evidence (unknown format).",
      next: "NEXT",
      nextStore: "Store this evidence alongside the audit report.",
      nextHardening: "If WPA2-PSK: move to WPA3/SAE and enforce a strong PSK.",
    },
  };
  return (table[lang] ?? table.es)[key] ?? key;
}

export const wifiEvidenceImportScenario: AttackLabScenario = {
  id: "wifi_evidence_import",
  title: "WIFI: Evidence Import (PMKID/Handshake)",
  description: "Importa un hash (WPA*01/WPA*02) y valida SSID/MACs para documentar evidencias en auditoria.",
  mode: "native",
  category: "WIFI",
  requiresOpsecConfirm: false,
  isSupported: () => ({ supported: true }),
  executeNative: async ({ onLog }) => {
    onLog("stdout", T("banner"));
    let raw = "";
    try {
      raw = localStorage.getItem(WIFI_EVIDENCE_STORAGE_KEY) || "";
    } catch {
      raw = "";
    }

    if (!raw.trim()) {
      onLog("stderr", T("missing"));
      return;
    }

    const parsed = parseWifiEvidence(raw);
    if (!parsed) {
      onLog("stderr", T("warn"));
      return;
    }

    onLog("stdout", T("ok"));
    onLog("stdout", `KIND: ${parsed.kind}`);
    if (parsed.ssid) onLog("stdout", `SSID: ${parsed.ssid}`);
    if (parsed.apMac) onLog("stdout", `AP_MAC: ${parsed.apMac}`);
    if (parsed.staMac) onLog("stdout", `STA_MAC: ${parsed.staMac}`);
    onLog("stdout", "");
    onLog("stdout", `== ${T("next")} ==`);
    onLog("stdout", `- ${T("nextStore")}`);
    onLog("stdout", `- ${T("nextHardening")}`);
  },
};

