// src/ui/features/attack_lab/catalog/scenarios/router/routerReconPingTracert.ts
// Escenario ROUTER external: baseline de conectividad hacia gateway (PTR + ping + tracert) con resumen interpretado.

import type { AttackLabScenario } from "../../types";
import { isWindows } from "../_shared/platform";
import { buildNetBaselinePs } from "../_shared/powershellNetBaseline";

export const routerReconPingTracertScenario: AttackLabScenario = {
  id: "router_recon_ping_tracert",
  title: "Router: Recon basico (PING + TRACERT)",
  description:
    "Baseline de conectividad hacia el gateway: resuelve PTR (si existe), mide latencia (ping) y traza ruta (tracert). Util para explicar fallos antes de auditar puertos/servicios.",
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
        buildNetBaselinePs(ip),
      ],
      timeoutMs: 180000,
    };
  },
};
