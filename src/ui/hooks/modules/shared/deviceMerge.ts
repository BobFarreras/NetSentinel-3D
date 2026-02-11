// src/ui/hooks/modules/shared/deviceMerge.ts
import { DeviceDTO } from "../../../../shared/dtos/NetworkDTOs";

export const isValidMac = (mac?: string): boolean => {
  if (!mac) return false;
  const normalized = mac.trim().toUpperCase();
  if (normalized === "00:00:00:00:00:00") return false;
  if (normalized === "ROUTER_AUTH" || normalized === "UNKNOWN") return false;
  return /^([0-9A-F]{2}:){5}[0-9A-F]{2}$/.test(normalized);
};

export const isBadVendor = (vendor?: string): boolean => {
  if (!vendor) return true;
  const normalized = vendor.trim();
  if (!normalized) return true;

  const lower = normalized.toLowerCase();
  if (lower === "unknown") return true;
  if (lower === "generic") return true;
  if (lower.includes("generic / unknown")) return true;
  if (/^(?:\d{1,3}\.){3}\d{1,3}$/.test(normalized)) return true;
  return false;
};

const mergeSingleDevice = (scanDevice: DeviceDTO, oldDevice?: DeviceDTO): DeviceDTO => {
  if (!oldDevice) return scanDevice;

  const nextMac = isValidMac(scanDevice.mac)
    ? scanDevice.mac
    : (isValidMac(oldDevice.mac) ? oldDevice.mac : scanDevice.mac);

  const nextVendor = !isBadVendor(scanDevice.vendor)
    ? scanDevice.vendor
    : (!isBadVendor(oldDevice.vendor) ? oldDevice.vendor : scanDevice.vendor);

  return {
    ...scanDevice,
    mac: nextMac,
    vendor: nextVendor,
    hostname: scanDevice.hostname ?? oldDevice.hostname,
    name: scanDevice.name ?? oldDevice.name,
  };
};

export const mergeScanInventory = (previous: DeviceDTO[], scanResults: DeviceDTO[]): DeviceDTO[] => {
  const previousByIp = new Map(previous.map((d) => [d.ip, d]));
  const scanByIp = new Map(scanResults.map((d) => [d.ip, d]));

  // Mantiene orden previo y actualiza solo los nodos presentes en el scan.
  const merged: DeviceDTO[] = previous.map((oldDevice) => {
    const scanDevice = scanByIp.get(oldDevice.ip);
    if (!scanDevice) return oldDevice;
    return mergeSingleDevice(scanDevice, oldDevice);
  });

  // Anade nodos nuevos detectados por scan.
  for (const scanDevice of scanResults) {
    if (!previousByIp.has(scanDevice.ip)) {
      merged.push(scanDevice);
    }
  }

  return merged;
};

export const mergeRouterInventory = (previous: DeviceDTO[], routerDevices: DeviceDTO[]): DeviceDTO[] => {
  const map = new Map(previous.map((d) => [d.ip, d]));

  routerDevices.forEach((routerDevice) => {
    const existing = map.get(routerDevice.ip);
    if (!existing) {
      map.set(routerDevice.ip, {
        ...routerDevice,
        mac: isValidMac(routerDevice.mac) ? routerDevice.mac : "00:00:00:00:00:00",
        vendor: !isBadVendor(routerDevice.vendor) ? routerDevice.vendor : "Generic / Unknown Device",
        hostname: routerDevice.hostname && routerDevice.hostname !== routerDevice.ip ? routerDevice.hostname : undefined,
      });
      return;
    }

    const nextMac = isValidMac(existing.mac)
      ? existing.mac
      : (isValidMac(routerDevice.mac) ? routerDevice.mac : existing.mac);

    const nextVendor = !isBadVendor(existing.vendor)
      ? existing.vendor
      : (!isBadVendor(routerDevice.vendor) ? routerDevice.vendor : existing.vendor);

    map.set(routerDevice.ip, {
      ...existing,
      mac: nextMac,
      vendor: nextVendor,
      hostname: routerDevice.hostname ?? existing.hostname,
      name: routerDevice.name ?? existing.name,
      signal_strength: routerDevice.signal_strength,
      signal_rate: routerDevice.signal_rate,
      wifi_band: routerDevice.wifi_band,
    });
  });

  return Array.from(map.values());
};

