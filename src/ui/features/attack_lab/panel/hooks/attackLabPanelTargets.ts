// src/ui/features/attack_lab/panel/hooks/attackLabPanelTargets.ts
// Utilidades puras para el target del Attack Lab: validacion IP, merge de opciones y target virtual WiFi.

import type { DeviceDTO, WifiNetworkDTO } from "../../../../../shared/dtos/NetworkDTOs";

export const isIpv4 = (value: string | undefined | null): boolean => {
  if (!value) return false;
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(value);
};

export const mergeByIp = (base: DeviceDTO[], extra: DeviceDTO | null): DeviceDTO[] => {
  const map = new Map<string, DeviceDTO>();
  for (const d of base) map.set(d.ip, d);
  if (extra && isIpv4(extra.ip)) map.set(extra.ip, extra);
  return Array.from(map.values());
};

export const wifiNetworkToVirtualTarget = (n: WifiNetworkDTO): DeviceDTO => {
  return {
    ip: n.ssid,
    mac: n.bssid,
    vendor: n.vendor,
    hostname: n.ssid,
    isGateway: false,
    ping: undefined,
    openPorts: [],
    os: "WiFi Access Point",
    deviceType: "ROUTER",
  };
};

