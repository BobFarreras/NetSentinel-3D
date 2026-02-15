// src/ui/features/radar/logic/openWifiAttackLabFromSelection.ts
// Helper de flujo Radar -> Attack Lab: construye un objetivo virtual desde un WiFi y emite el contexto por windowingAdapter.

import type { DeviceDTO, WifiNetworkDTO } from "../../../../shared/dtos/NetworkDTOs";
import { windowingAdapter } from "../../../../adapters/windowingAdapter";
import { uiLogger } from "../../../utils/logger";

export const openWifiAttackLabFromSelection = (selected: WifiNetworkDTO): void => {
  uiLogger.info("[radar] open audit solicitado");
  uiLogger.info("[radar] network seleccionada", { ssid: selected.ssid, bssid: selected.bssid });

  // Objetivo virtual: el Attack Lab opera con DeviceDTO; en WiFi, modelamos el AP como un "router" virtual.
  // Nota: se mantiene el comportamiento existente (ip=ssid) para no romper contratos/flows actuales.
  const virtualTarget: DeviceDTO = {
    ip: selected.ssid,
    mac: selected.bssid,
    vendor: selected.vendor,
    hostname: selected.ssid,
    isGateway: false,
    ping: undefined,
    openPorts: [],
    os: "WiFi Access Point",
    deviceType: "ROUTER",
  };

  uiLogger.info("[radar] virtual target creado", virtualTarget);
  uiLogger.info("[radar] emitiendo dockPanel attack_lab");

  try {
    windowingAdapter.emitDockPanel("attack_lab");
  } catch (e) {
    uiLogger.error("[radar] fallo al emitir dockPanel", e);
  }

  // Permite que el panel se renderice antes de empujar el contexto.
  setTimeout(() => {
    try {
      windowingAdapter.emitAttackLabContext({
        targetDevice: virtualTarget,
        scenarioId: "wifi_brute_force_dict",
        autoRun: false,
      });
    } catch (e) {
      uiLogger.error("[radar] fallo al emitir contexto attack_lab", e);
    }
  }, 300);
};
