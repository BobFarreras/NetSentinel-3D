// src/ui/components/panels/console_logs/consoleLogsStyles.ts
export const CONSOLE_COLORS = {
  bg: "#020202",
  border: "#0a3a2a",
  // Verde fosforo (menos "neon puro") para lectura prolongada.
  textMain: "#a9f5c9",
  textDim: "#4aa37a",
  textErr: "#ff5555",
  accent: "#00ff88",
  cyan: "#00e5ff",
};

export const formatSpeed = (bytes: number) => {
  if (bytes > 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB/s`;
  if (bytes > 1024) return `${(bytes / 1024).toFixed(0)} KB/s`;
  return `${bytes} B/s`;
};
