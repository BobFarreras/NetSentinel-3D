// src/ui/features/attack_lab/logic/parseWifiEvidence.ts
// Parser de evidencias WiFi (hashes tipo hashcat WPA*01/WPA*02): valida formato y extrae SSID/BSSID/MACs para auditoria.

export type WifiEvidenceKind = "pmkid" | "handshake";

export type ParsedWifiEvidence = {
  kind: WifiEvidenceKind;
  rawLine: string;
  ssid: string | null;
  apMac: string | null;
  staMac: string | null;
};

function tryDecodeHexAscii(hex: string): string | null {
  const clean = hex.trim();
  if (!clean) return null;
  if (clean.length % 2 !== 0) return null;
  if (!/^[0-9a-fA-F]+$/.test(clean)) return null;
  try {
    const bytes = new Uint8Array(clean.length / 2);
    for (let i = 0; i < clean.length; i += 2) {
      bytes[i / 2] = parseInt(clean.slice(i, i + 2), 16);
    }
    // Decodificacion "best effort": ASCII/UTF-8 simple.
    const text = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
    return text || null;
  } catch {
    return null;
  }
}

function normalizeMac(raw: string | undefined): string | null {
  if (!raw) return null;
  const clean = raw.trim().toLowerCase();
  if (!clean) return null;
  // Acepta formatos con o sin separadores.
  const hex = clean.replace(/[^0-9a-f]/g, "");
  if (hex.length !== 12) return null;
  return hex.match(/.{1,2}/g)?.join(":") ?? null;
}

function pickFirstEvidenceLine(raw: string): string | null {
  const lines = raw.split(/\r?\n/).map((l) => l.trim());
  for (const line of lines) {
    if (!line) continue;
    if (line.startsWith("#")) continue;
    if (line.startsWith("//")) continue;
    if (line.includes("WPA*01*") || line.includes("WPA*02*")) return line;
  }
  return null;
}

export function parseWifiEvidence(raw: string): ParsedWifiEvidence | null {
  const line = pickFirstEvidenceLine(raw);
  if (!line) return null;

  const parts = line.split("*");
  if (parts.length < 6) return null;
  if (parts[0] !== "WPA") return null;

  const subtype = parts[1];
  if (subtype !== "01" && subtype !== "02") return null;

  if (subtype === "02") {
    // hashcat PMKID: WPA*02*pmkid*macAP*macSTA*essid
    const apMac = normalizeMac(parts[3]);
    const staMac = normalizeMac(parts[4]);
    const ssid = tryDecodeHexAscii(parts[5]);
    return { kind: "pmkid", rawLine: line, ssid, apMac, staMac };
  }

  // subtype === "01": handshake. La estructura puede variar; intentamos extraer ssid y MACs si existen.
  // Formatos comunes incluyen ESSID en el ultimo campo hex; y MAC AP/STA en campos intermedios.
  const apMac = normalizeMac(parts.find((p) => p.length >= 12 && p.length <= 17 && /[0-9a-fA-F]/.test(p)) ?? undefined);
  const staMac = null;
  const maybeHexSsid = parts[parts.length - 1];
  const ssid = tryDecodeHexAscii(maybeHexSsid);
  return { kind: "handshake", rawLine: line, ssid, apMac, staMac };
}

