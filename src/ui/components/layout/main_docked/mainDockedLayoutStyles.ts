// src/ui/components/layout/main_docked/mainDockedLayoutStyles.ts
// Estilos base del layout acoplado: frame principal y contenedores para mantener MainDockedLayout legible.

import type React from "react";

export const mainDockedRootStyle = (params: { isResizing: boolean }): React.CSSProperties => ({
  display: "flex",
  flexDirection: "column",
  width: "100vw",
  height: "100vh",
  background: "#050505",
  color: "#0f0",
  overflow: "hidden",
  fontFamily: "'Consolas', 'Courier New', monospace",
  fontSize: "16px",
  userSelect: params.isResizing ? "none" : "auto",
  boxSizing: "border-box",
  border: "1px solid #0a3a2a",
  borderBottom: "4px solid rgba(0,255,136,0.22)",
  boxShadow: "inset 0 -1px 0 rgba(0,255,136,0.18), inset 0 0 0 1px rgba(0,0,0,0.55), 0 14px 34px rgba(0,0,0,0.55)",
});

export const mainDockedBodyStyle: React.CSSProperties = {
  flex: 1,
  minHeight: 0,
  display: "flex",
  overflow: "hidden",
};

export const mainDockedCenterColStyle: React.CSSProperties = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  position: "relative",
  height: "100%",
  minWidth: 0,
  overflow: "hidden",
};

export const mainDockedCenterTopStyle: React.CSSProperties = {
  flex: 1,
  position: "relative",
  overflow: "hidden",
  minHeight: 0,
};

