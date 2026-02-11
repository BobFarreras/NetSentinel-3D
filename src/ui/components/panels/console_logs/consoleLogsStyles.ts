// src/ui/components/panels/console_logs/consoleLogsStyles.ts
import { HUD_COLORS } from "../../../styles/hudTokens";

export const CONSOLE_COLORS = {
  bg: HUD_COLORS.bgBase,
  border: HUD_COLORS.borderSoft,
  // Verde fosforo (menos "neon puro") para lectura prolongada.
  textMain: HUD_COLORS.textMain,
  textDim: HUD_COLORS.textDim,
  textErr: HUD_COLORS.textError,
  accent: HUD_COLORS.accentGreen,
  cyan: HUD_COLORS.accentCyan,
};

export const formatSpeed = (bytes: number) => {
  if (bytes > 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB/s`;
  if (bytes > 1024) return `${(bytes / 1024).toFixed(0)} KB/s`;
  return `${bytes} B/s`;
};
