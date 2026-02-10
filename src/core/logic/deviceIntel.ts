import type { DeviceDTO, DeviceType } from "../../shared/dtos/NetworkDTOs";

export type DeviceIntel = {
  deviceType: DeviceType;
  confidence: number; // 0..100
  reasons: string[];
};

const clamp01 = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

const norm = (s?: string) => (s || "").trim().toLowerCase();

const hasAny = (hay: string, needles: string[]) => needles.some((n) => hay.includes(n));

export const classifyDeviceIntel = (device: DeviceDTO, ctx?: { gatewayIp?: string; hostIp?: string | null }): DeviceIntel => {
  const reasons: string[] = [];

  // Host local
  if (ctx?.hostIp && device.ip === ctx.hostIp) {
    reasons.push("IP coincide con el host local");
    return { deviceType: "PC", confidence: 98, reasons };
  }

  // Router/gateway
  if (device.isGateway || (ctx?.gatewayIp && device.ip === ctx.gatewayIp) || device.ip.endsWith(".1")) {
    reasons.push("Marcado como gateway o IP coincide con gateway");
    return { deviceType: "ROUTER", confidence: 92, reasons };
  }

  const vendor = norm(device.vendor);
  const name = norm(device.name);
  const hostname = norm(device.hostname);
  const joined = `${vendor} ${name} ${hostname}`;

  // Señal fuerte: vendor por OUI/brand
  if (vendor.includes("amazon")) {
    reasons.push("Vendor contiene 'Amazon'");
    // Amazon suele ser Alexa/FireTV/Kindle; sin SSDP/mDNS no distinguimos al 100%.
    return { deviceType: "SPEAKER", confidence: 70, reasons };
  }

  if (hasAny(joined, ["alexa", "echo", "firetv", "fire tv"])) {
    reasons.push("Nombre/hostname sugiere Alexa/FireTV");
    return { deviceType: "SPEAKER", confidence: 82, reasons };
  }

  if (hasAny(joined, ["tv", "smarttv", "bravia", "samsungtv", "lg", "webos", "tizen", "hisense", "philips"])) {
    reasons.push("Nombre/hostname sugiere TV");
    return { deviceType: "TV", confidence: 78, reasons };
  }

  if (hasAny(joined, ["iphone", "ipad", "android", "xiaomi", "redmi", "samsung", "huawei", "oppo", "oneplus", "pixel"])) {
    reasons.push("Nombre/vendor sugiere telefono");
    return { deviceType: "PHONE", confidence: 72, reasons };
  }

  if (hasAny(joined, ["desktop", "laptop", "pc", "macbook", "imac", "windows", "linux"])) {
    reasons.push("Nombre/vendor sugiere PC");
    return { deviceType: "PC", confidence: 70, reasons };
  }

  if (hasAny(joined, ["espressif", "tuya", "iot", "smart", "switch", "plug", "bulb", "sonoff", "shelly"])) {
    reasons.push("Vendor/nombre sugiere IoT");
    return { deviceType: "IOT", confidence: 74, reasons };
  }

  // MAC aleatoria: en redes modernas puede ocultar fabricante real
  if (vendor.includes("private device") || vendor.includes("random mac")) {
    reasons.push("MAC aleatoria (privacy): fabricante no fiable");
    return { deviceType: "UNKNOWN", confidence: 55, reasons };
  }

  // Fallback
  if (vendor && !vendor.includes("unknown") && !vendor.includes("generic")) {
    reasons.push("Vendor presente pero sin heuristica especifica");
    return { deviceType: "UNKNOWN", confidence: 60, reasons };
  }
  reasons.push("Sin señales suficientes");
  return { deviceType: "UNKNOWN", confidence: 40, reasons };
};

export const applyDeviceIntel = (device: DeviceDTO, intel: DeviceIntel): DeviceDTO => ({
  ...device,
  deviceType: intel.deviceType,
  deviceTypeConfidence: clamp01(intel.confidence),
});

