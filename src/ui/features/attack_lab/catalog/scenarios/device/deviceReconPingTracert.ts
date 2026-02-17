// src/ui/features/attack_lab/catalog/scenarios/device/deviceReconPingTracert.ts
// Escenario DEVICE external: baseline de conectividad hacia un host (PTR + ping + tracert) con resumen interpretado.

import type { AttackLabScenario } from "../../types";
import { isWindows } from "../_shared/platform";
import { buildNetBaselinePs } from "../_shared/powershellNetBaseline";

export const deviceReconPingTracertScenario: AttackLabScenario = {
  id: "device_recon_ping_tracert",
  title: "Device: Network baseline (PING + TRACERT)",
  description:
    "Baseline de conectividad hacia un host: PTR (si existe), ping y ruta. Util para explicar falsos negativos antes de auditar servicios.",
  mode: "external",
  category: "DEVICE",
  nextScenarioIds: ["device_http_headers", "iot_risk_profile_quick_ports"],
  isSupported: () => {
    if (!isWindows()) return { supported: false, reason: "Preset pensado para Windows. Usa modo CUSTOM en otros SO." };
    return { supported: true };
  },
  buildRequest: ({ device }) => {
    return {
      binaryPath: "powershell.exe",
      args: ["-NoProfile", "-Command", buildNetBaselinePs(device.ip)],
      timeoutMs: 180000,
    };
  },
};
