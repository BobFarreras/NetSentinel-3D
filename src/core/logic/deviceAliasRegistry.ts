// src/core/logic/deviceAliasRegistry.ts
// Descripcion: registro ligero de alias de dispositivos (nombre/hostname) para rellenar scans incompletos y mantener contexto UX.

import type { DeviceDTO } from "../../shared/dtos/NetworkDTOs";

type AliasRecord = {
  label: string;
  lastSeenAt: number;
};

type AliasStore = Record<string, AliasRecord>;

const STORAGE_KEY = "netsentinel.deviceAliases:v1";

const normMac = (mac: string) =>
  mac
    .trim()
    .toUpperCase()
    .replace(/[-_]/g, ":");

const safeLabel = (raw: string) => raw.trim().slice(0, 96);

const getLabelFromDevice = (d: DeviceDTO): string | null => {
  const name = (d.name ?? "").trim();
  const hostname = (d.hostname ?? "").trim();
  if (name) return safeLabel(name);
  if (hostname) return safeLabel(hostname);
  return null;
};

export const deviceAliasRegistry = {
  load: (): AliasStore => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw) as unknown;
      if (!parsed || typeof parsed !== "object") return {};
      return parsed as AliasStore;
    } catch {
      return {};
    }
  },

  save: (store: AliasStore): void => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch {
      // ignore
    }
  },

  rememberFromDevices: (devices: DeviceDTO[], now = Date.now()): void => {
    if (!devices.length) return;
    const store = deviceAliasRegistry.load();

    for (const d of devices) {
      const label = getLabelFromDevice(d);
      if (!label) continue;

      const ip = (d.ip ?? "").trim();
      const mac = (d.mac ?? "").trim();

      if (mac) {
        store[`mac:${normMac(mac)}`] = { label, lastSeenAt: now };
      }
      if (ip) {
        store[`ip:${ip}`] = { label, lastSeenAt: now };
      }
    }

    deviceAliasRegistry.save(store);
  },

  applyAliases: (devices: DeviceDTO[]): DeviceDTO[] => {
    if (!devices.length) return devices;
    const store = deviceAliasRegistry.load();

    return devices.map((d) => {
      const hasLabel = Boolean((d.name ?? "").trim() || (d.hostname ?? "").trim());
      if (hasLabel) return d;

      const ip = (d.ip ?? "").trim();
      const mac = (d.mac ?? "").trim();
      const macKey = mac ? `mac:${normMac(mac)}` : null;
      const ipKey = ip ? `ip:${ip}` : null;

      const rec = (macKey && store[macKey]) || (ipKey && store[ipKey]) || null;
      if (!rec?.label) return d;

      // Rellenamos `name` (no tocamos IP/MAC). Si el backend no detecta hostname, lo recuperamos.
      return { ...d, name: rec.label };
    });
  },
};
