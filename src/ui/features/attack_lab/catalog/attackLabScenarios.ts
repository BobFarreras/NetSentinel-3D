// src/ui/features/attack_lab/catalog/attackLabScenarios.ts
// Agregador del catalogo Attack Lab: importa escenarios por dominio (router/http/wifi/iot) para mantener responsabilidades claras.

import type { AttackLabScenario } from "./types";
import { routerReconPingTracertScenario } from "./scenarios/router/routerReconPingTracert";
import { deviceReconPingTracertScenario } from "./scenarios/device/deviceReconPingTracert";
import { httpFingerprintHeadersScenario } from "./scenarios/http/httpFingerprintHeaders";
import { wifiDictionaryAttackScenario } from "./scenarios/wifi/wifiDictionaryAttack";
import { wifiEvidenceImportScenario } from "./scenarios/wifi/wifiEvidenceImport";
import { iotRiskProfileQuickPortsScenario } from "./scenarios/iot/iotRiskProfileQuickPorts";

export const getAttackLabScenarios = (): AttackLabScenario[] => {
  return [
    wifiDictionaryAttackScenario,
    wifiEvidenceImportScenario,
    routerReconPingTracertScenario,
    deviceReconPingTracertScenario,
    httpFingerprintHeadersScenario,
    iotRiskProfileQuickPortsScenario,
  ];
};
