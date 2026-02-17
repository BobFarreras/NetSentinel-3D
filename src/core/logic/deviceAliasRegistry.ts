// src/core/logic/deviceAliasRegistry.ts
// Descripcion: registro ligero de alias de dispositivos (nombre/hostname) para rellenar scans incompletos y mantener contexto UX.

import type { DeviceDTO } from "../../shared/dtos/NetworkDTOs";

type AliasRecord = {
  label: string;
  kind: "learned" | "manual";
  lastSeenAt: number;
};

type AliasStore = Record<string, AliasRecord>;

const STORAGE_KEY_V1 = "netsentinel.deviceAliases:v1";
const STORAGE_KEY = "netsentinel.deviceAliases:v2";

const normMac = (mac: string) =>
  mac
    .trim()
    .toUpperCase()
    .replace(/[-_]/g, ":");

const safeLabel = (raw: string) => raw.trim().slice(0, 96);

const isValidMac = (mac: string): boolean => {
  const normalized = normMac(mac);
  if (!normalized) return false;
  if (normalized === "00:00:00:00:00:00") return false;
  if (normalized === "ROUTER_AUTH" || normalized === "UNKNOWN") return false;
  return /^([0-9A-F]{2}:){5}[0-9A-F]{2}$/.test(normalized);
};

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
      if (raw) {
        const parsed = JSON.parse(raw) as unknown;
        if (parsed && typeof parsed === "object") return parsed as AliasStore;
      }

      // Migracion defensiva desde v1 (sin `kind`).
      const legacy = localStorage.getItem(STORAGE_KEY_V1);
      if (!legacy) return {};
      const parsedLegacy = JSON.parse(legacy) as unknown;
      if (!parsedLegacy || typeof parsedLegacy !== "object") return {};

      const migrated: AliasStore = {};
      for (const [k, v] of Object.entries(parsedLegacy as Record<string, any>)) {
        const label = typeof v?.label === "string" ? v.label : null;
        const lastSeenAt = typeof v?.lastSeenAt === "number" ? v.lastSeenAt : Date.now();
        if (!label) continue;
        migrated[k] = { label: safeLabel(label), kind: "learned", lastSeenAt };
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
      return migrated;
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

  setManualAliasForDevice: (device: Pick<DeviceDTO, "ip" | "mac">, rawLabel: string, now = Date.now()): void => {
    const label = safeLabel(rawLabel);
    if (!label) return;

    const store = deviceAliasRegistry.load();
    const ip = (device.ip ?? "").trim();
    const mac = (device.mac ?? "").trim();

    if (mac && isValidMac(mac)) {
      store[`mac:${normMac(mac)}`] = { label, kind: "manual", lastSeenAt: now };
      // Guardamos tambien por IP como conveniencia, pero el match principal debe ser por MAC.
      if (ip) store[`ip:${ip}`] = { label, kind: "manual", lastSeenAt: now };
    } else if (ip) {
      store[`ip:${ip}`] = { label, kind: "manual", lastSeenAt: now };
    }

    deviceAliasRegistry.save(store);
  },

  clearManualAliasForDevice: (device: Pick<DeviceDTO, "ip" | "mac">): void => {
    const store = deviceAliasRegistry.load();
    const ip = (device.ip ?? "").trim();
    const mac = (device.mac ?? "").trim();

    const keys = [
      mac && isValidMac(mac) ? `mac:${normMac(mac)}` : null,
      ip ? `ip:${ip}` : null,
    ].filter(Boolean) as string[];

    for (const k of keys) {
      const rec = store[k];
      if (rec?.kind === "manual") delete store[k];
    }

    deviceAliasRegistry.save(store);
  },

  forgetLearnedForDevice: (device: Pick<DeviceDTO, "ip" | "mac">): void => {
    const store = deviceAliasRegistry.load();
    const ip = (device.ip ?? "").trim();
    const mac = (device.mac ?? "").trim();

    const keys = [
      mac && isValidMac(mac) ? `mac:${normMac(mac)}` : null,
      ip ? `ip:${ip}` : null,
    ].filter(Boolean) as string[];

    for (const k of keys) {
      const rec = store[k];
      if (!rec) continue;
      if (rec.kind === "learned") delete store[k];
    }

    deviceAliasRegistry.save(store);
  },

  rememberFromDevices: (devices: DeviceDTO[], now = Date.now()): void => {
    if (!devices.length) return;
    const store = deviceAliasRegistry.load();

    for (const d of devices) {
      const label = getLabelFromDevice(d);
      if (!label) continue;

      const ip = (d.ip ?? "").trim();
      const mac = (d.mac ?? "").trim();

      // Regla anti-colision:
      // - Si hay MAC valida, recordamos SOLO por MAC (evita que un IP reciclado herede el label).
      // - Si no hay MAC valida, recordamos por IP (mejor que nada en entornos sin ARP/MAC).
      if (mac && isValidMac(mac)) {
        const key = `mac:${normMac(mac)}`;
        if (store[key]?.kind !== "manual") store[key] = { label, kind: "learned", lastSeenAt: now };
      } else if (ip) {
        const key = `ip:${ip}`;
        if (store[key]?.kind !== "manual") store[key] = { label, kind: "learned", lastSeenAt: now };
      }
    }

    deviceAliasRegistry.save(store);
  },

  applyAliases: (devices: DeviceDTO[]): DeviceDTO[] => {
    if (!devices.length) return devices;
    const store = deviceAliasRegistry.load();

    return devices.map((d) => {
      const ip = (d.ip ?? "").trim();
      const mac = (d.mac ?? "").trim();
      const macKey = mac && isValidMac(mac) ? `mac:${normMac(mac)}` : null;
      const ipKey = ip ? `ip:${ip}` : null;

      const macRec = macKey ? store[macKey] : null;
      const ipRec = ipKey ? store[ipKey] : null;

      // Regla: el alias MANUAL siempre tiene prioridad, aunque el dispositivo ya venga con nombre (porque
      // el operador lo esta corrigiendo). Preferimos MAC->IP.
      const manual = (macRec?.kind === "manual" ? macRec : null) || (ipRec?.kind === "manual" ? ipRec : null);
      if (manual?.label) {
        return { ...d, name: manual.label };
      }

      const hasLabel = Boolean((d.name ?? "").trim() || (d.hostname ?? "").trim());
      if (hasLabel) return d;

      // Regla anti-colision:
      // - Si ya tenemos MAC valida, NO aplicamos aliases aprendidos por IP (pueden venir de un scan previo
      //   cuando no se resolvio MAC, y pegarse al dispositivo equivocado).
      // - Con MAC valida: solo aplicamos alias aprendido por MAC.
      // - Sin MAC valida: permitimos alias aprendido por IP.
      const learned = (macRec?.kind === "learned" ? macRec : null) || ((!macKey && ipRec?.kind === "learned") ? ipRec : null);
      if (!learned?.label) return d;

      // Rellenamos `name` (no tocamos IP/MAC). Si el backend no detecta hostname, lo recuperamos.
      return { ...d, name: learned.label };
    });
  },
};
