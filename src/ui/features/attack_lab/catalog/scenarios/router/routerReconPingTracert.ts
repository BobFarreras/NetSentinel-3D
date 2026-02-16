// src/ui/features/attack_lab/catalog/scenarios/router/routerReconPingTracert.ts
// Escenario ROUTER external: reconocimiento basico no intrusivo (PING + TRACERT) para baseline de conectividad y ruta.

import type { AttackLabScenario } from "../../types";
import { isWindows } from "../_shared/platform";

export const routerReconPingTracertScenario: AttackLabScenario = {
  id: "router_recon_ping_tracert",
  title: "Router: Recon basico (PING + TRACERT)",
  description: "Ejecuta un reconocimiento basico no intrusivo contra el router: latencia (ping) y ruta (tracert).",
  mode: "external",
  category: "ROUTER",
  isSupported: () => {
    if (!isWindows()) return { supported: false, reason: "Preset pensado para Windows. Usa modo CUSTOM en otros SO." };
    return { supported: true };
  },
  buildRequest: ({ device }) => {
    const ip = device.ip;
    return {
      binaryPath: "powershell.exe",
      args: [
        "-NoProfile",
        "-Command",
        `Write-Output \"== PING ==\"; ping -n 4 ${ip}; Write-Output \"\"; Write-Output \"== TRACERT ==\"; tracert -d ${ip}`,
      ],
      timeoutMs: 180000,
    };
  },
};

