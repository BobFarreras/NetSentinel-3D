// src/ui/features/attack_lab/panel/lab_mode/labModeViewStyles.ts
// Estilos compartidos de la vista LAB: tokens cyberpunk para inputs y botones (evita inline repetition).

import type React from "react";

export const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "rgba(0,0,0,0.35)",
  border: "1px solid rgba(0,255,136,0.18)",
  color: "#b7ffe2",
  padding: "6px 8px",
  fontSize: 12,
  outline: "none",
  fontFamily: "inherit",
};

export const btnStyle = (active: boolean): React.CSSProperties => ({
  background: active ? "rgba(0,255,136,0.12)" : "transparent",
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: active ? "#00ff88" : "rgba(0,255,136,0.2)",
  color: active ? "#00ff88" : "#88cca0",
  padding: "6px 12px",
  cursor: active ? "pointer" : "not-allowed",
  opacity: active ? 1 : 0.5,
  fontWeight: 700,
  fontSize: 12,
});

export const blinkCssText = `
  @keyframes blink { 0% { opacity: 1; } 50% { opacity: 0.4; } 100% { opacity: 1; } }
  .blink { animation: blink 1.5s infinite; }
`;

