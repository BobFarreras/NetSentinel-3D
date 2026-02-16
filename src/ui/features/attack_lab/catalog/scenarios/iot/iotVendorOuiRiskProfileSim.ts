// src/ui/features/attack_lab/catalog/scenarios/iot/iotVendorOuiRiskProfileSim.ts
// Escenario IOT simulado: perfilado de riesgo por vendor/OUI y mitigaciones de segmentacion; no ejecuta ataques reales.

import type { AttackLabScenario } from "../../types";

export const iotVendorOuiRiskProfileSimScenario: AttackLabScenario = {
  id: "edu_iot_risk_profile",
  title: "IoT: Perfilado de riesgo por vendor/OUI [SIMULADO]",
  description: "Simulacion didactica: usa el vendor detectado para explicar riesgo tipico IoT.",
  mode: "simulated",
  category: "IOT",
  simulate: ({ device }) => {
    const vendor = (device.vendor || "Unknown").trim();
    const label = vendor && vendor.toLowerCase() !== "unknown" ? vendor : device.mac;
    return [
      { delayMs: 0, stream: "stdout", line: `LAB: IoT Risk Profile (SIMULADO) sobre ${label}` },
      { delayMs: 250, stream: "stdout", line: `Target: IP=${device.ip} MAC=${device.mac}` },
      { delayMs: 600, stream: "stdout", line: "Heuristica: vendors IoT suelen tener ciclos de parcheo mas lentos." },
      { delayMs: 900, stream: "stdout", line: "Mitigacion: segmentar en VLAN/SSID IoT." },
    ];
  },
};

