// src/ui/features/radar/components/radar/intel/filters/radarIntelFilterViewStyles.ts
// Estilos locales del bloque de filtros Radar Intel (chips y grids), sin logica.

import type React from "react";

export const CHIP_STYLE: React.CSSProperties = {
  fontFamily: "monospace",
  fontSize: 10,
  fontWeight: 900,
  letterSpacing: 0.7,
  textTransform: "uppercase",
  color: "rgba(183,255,226,0.85)",
  border: "1px solid rgba(0,255,136,0.18)",
  background: "rgba(0,0,0,0.35)",
  padding: "3px 6px",
  borderRadius: 2,
  whiteSpace: "nowrap",
};

export const BOTTOM_GRID_STYLE: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
  gap: 10,
  alignItems: "start",
};

