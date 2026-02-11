// src/ui/components/3d/sceneTokens.ts
import type { DeviceType } from "../../../shared/dtos/NetworkDTOs";
import { HUD_COLORS, HUD_TYPO } from "../../styles/hudTokens";

export const SCENE_TOKENS = {
  bgContainer: "#000000",
  bgCanvas: HUD_COLORS.bgPanel,
  accentGreen: HUD_COLORS.accentGreen,
  accentCyan: HUD_COLORS.accentCyan,
  textMain: HUD_COLORS.textMain,
  fontMono: HUD_TYPO.mono,
};

export const NODE_TYPE_COLORS: Record<DeviceType, { fg: string; glow: string; border: string }> = {
  ROUTER: { fg: "#77e8ff", glow: "rgba(0,229,255,0.35)", border: "rgba(0,229,255,0.55)" },
  PC: { fg: "#a9f5c9", glow: "rgba(0,255,136,0.25)", border: "rgba(0,255,136,0.45)" },
  PHONE: { fg: "#ff66cc", glow: "rgba(255,0,170,0.25)", border: "rgba(255,0,170,0.45)" },
  TV: { fg: "#ffd36b", glow: "rgba(255,211,107,0.25)", border: "rgba(255,211,107,0.45)" },
  SPEAKER: { fg: "#b388ff", glow: "rgba(179,136,255,0.25)", border: "rgba(179,136,255,0.45)" },
  IOT: { fg: "#ff7777", glow: "rgba(255,85,85,0.25)", border: "rgba(255,85,85,0.45)" },
  UNKNOWN: { fg: "#c9d1d9", glow: "rgba(201,209,217,0.15)", border: "rgba(201,209,217,0.25)" },
};
