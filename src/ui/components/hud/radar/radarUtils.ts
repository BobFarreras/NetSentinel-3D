// src/ui/components/hud/radar/radarUtils.ts
import type { CSSProperties } from "react";
import type { WifiNetworkDTO } from "../../../../shared/dtos/NetworkDTOs";

export type RiskColor = {
  dot: string;
  glow: string;
  label: string;
};

export const riskStyle = (riskLevel: string): RiskColor => {
  const lvl = (riskLevel || "").toUpperCase();
  if (lvl === "HARDENED") return { dot: "#00ff88", glow: "rgba(0,255,136,0.35)", label: "HARDENED" };
  if (lvl === "STANDARD") return { dot: "#ffe066", glow: "rgba(255,224,102,0.35)", label: "STANDARD" };
  if (lvl === "LEGACY") return { dot: "#ff5555", glow: "rgba(255,85,85,0.35)", label: "LEGACY" };
  if (lvl === "OPEN") return { dot: "#ff3333", glow: "rgba(255,51,51,0.35)", label: "OPEN" };
  return { dot: "#aaaaaa", glow: "rgba(170,170,170,0.2)", label: "UNKNOWN" };
};

export const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

export const inferBandLabel = (channel?: number) => {
  if (!channel) return "UNK";
  if (channel >= 1 && channel <= 14) return "2.4";
  if (channel >= 32 && channel <= 177) return "5";
  // Sin frecuencia real, no inferimos 6GHz de forma fiable solo con canal.
  return "UNK";
};

export const hashToAngleDeg = (seed: string) => {
  // Hash estable para distribuir nodos en el radar sin jitter.
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return h % 360;
};

export const selectStyle: CSSProperties = {
  width: "100%",
  background: "rgba(0,0,0,0.35)",
  border: "1px solid rgba(0,255,136,0.18)",
  color: "#b7ffe2",
  padding: "6px 8px",
  fontSize: 12,
  outline: "none",
  fontFamily: "'Consolas', 'Courier New', monospace",
};

export type RadarNode = WifiNetworkDTO & { x: number; y: number };
