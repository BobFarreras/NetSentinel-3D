// src/ui/features/radar/components/radar/intel/radarIntelStyles.ts
// Estilos compartidos del Intel Panel del Radar: tokens locales para filtros y cabecera (evita duplicacion en JSX).

import type React from "react";

export const FILTER_BOX_LABEL_STYLE: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 900,
  letterSpacing: 1,
  color: "rgba(183,255,226,0.65)",
  width: 50,
  flexShrink: 0,
  textTransform: "uppercase",
};

export const FILTER_ROW_STYLE: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  minWidth: 0,
  // En paneles estrechos, permitimos wrap para evitar texto/input cortado.
  flexWrap: "wrap",
};

export const FILTER_STRIP_STYLE: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
  alignItems: "center",
};

export const HEADER_STYLE: React.CSSProperties = {
  color: "#00ff88",
  fontWeight: 800,
  letterSpacing: 1,
  marginBottom: 10,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
};

export const HELP_BUTTON_STYLE: React.CSSProperties = {
  background: "transparent",
  border: "1px solid rgba(0,255,136,0.25)",
  color: "rgba(183,255,226,0.85)",
  cursor: "pointer",
  fontSize: 11,
  padding: "2px 8px",
};

