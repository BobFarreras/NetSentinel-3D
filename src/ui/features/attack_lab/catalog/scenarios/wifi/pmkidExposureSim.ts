// src/ui/features/attack_lab/catalog/scenarios/wifi/pmkidExposureSim.ts
// Escenario WIFI simulado: contenido didactico sobre exposicion PMKID (client-less) y mitigaciones; no ejecuta ataques reales.

import type { AttackLabScenario } from "../../types";
import { isGateway } from "../_shared/gateway";

export const pmkidExposureSimScenario: AttackLabScenario = {
  id: "edu_pmkid_exposure_sim",
  title: "WiFi: PMKID (exposicion) [SIMULADO]",
  description: "Simulacion didactica: explica el concepto de PMKID (client-less) y como mitigarlo. No ejecuta ataques real.",
  mode: "simulated",
  category: "WIFI",
  simulate: ({ device, identity }) => {
    const gw = identity?.gatewayIp || "<gateway>";
    const target = isGateway(device, identity) ? "router/gateway" : "AP cercano";
    return [
      { delayMs: 0, stream: "stdout", line: `LAB: PMKID (SIMULADO) sobre ${target}` },
      { delayMs: 250, stream: "stdout", line: `Contexto: IP=${device.ip} GW=${gw}` },
      { delayMs: 500, stream: "stdout", line: "Modelo: en routers vulnerables, ciertos flujos pueden exponer material derivado (PMKID)." },
      { delayMs: 1100, stream: "stdout", line: "Mitigacion: WPA3-Personal (SAE), PMF/802.11w habilitado." },
    ];
  },
};

