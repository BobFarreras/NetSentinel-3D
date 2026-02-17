// src/ui/components/layout/topbar/topbarStyles.ts
// Tokens y helpers de estilo del TopBar: botones, dots y controles de ventana.

import type React from "react";

export const topbarBtnBase = (params: {
  active: boolean;
  accent: string;
  border: string;
  compact: boolean;
}): React.CSSProperties => {
  const { active, accent, border, compact } = params;
  return {
    background: active ? `linear-gradient(180deg, rgba(0,0,0,0.55), ${accent}22)` : "rgba(0,0,0,0.25)",
    color: active ? accent : "rgba(183,255,226,0.78)",
    border: `1px solid ${active ? accent : border}`,
    borderRadius: "2px",
    padding: compact ? "5px 10px" : "6px 12px",
    fontSize: "0.82rem",
    cursor: "pointer",
    transition: "all 0.18s",
    fontFamily: "inherit",
    letterSpacing: 0.6,
    fontWeight: 900,
    textTransform: "uppercase",
    display: "flex",
    alignItems: "center",
    gap: 8,
    height: 30,
    boxShadow: active ? `0 0 14px ${accent}22` : "none",
  };
};

export const topbarBtnDot = (active: boolean, color: string): React.CSSProperties => ({
  width: 8,
  height: 8,
  borderRadius: 99,
  background: active ? color : "rgba(0,255,136,0.10)",
  boxShadow: active ? `0 0 10px ${color}99` : "none",
  flexShrink: 0,
});

export const topbarWinBtn: React.CSSProperties = {
  width: 34,
  height: 30,
  borderRadius: 2,
  border: "1px solid rgba(0,229,255,0.18)",
  background: "rgba(0,0,0,0.25)",
  color: "rgba(183,255,226,0.80)",
  cursor: "pointer",
  display: "grid",
  placeItems: "center",
  fontFamily: "monospace",
  fontWeight: 900,
  letterSpacing: 0.6,
  userSelect: "none",
};

