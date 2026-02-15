// src/ui/features/settings/components/field_manual/fieldManualStyles.ts
// Descripcion: estilos compartidos de FieldManualView (Settings). Evita duplicacion y facilita refactor.

import type React from "react";
import { HUD_COLORS, HUD_TYPO } from "../../../../styles/hudTokens";

export const navBtn = (active: boolean, narrow: boolean): React.CSSProperties => ({
  height: 34,
  width: narrow ? "auto" : "100%",
  minWidth: narrow ? 140 : undefined,
  textAlign: narrow ? "center" : "left",
  padding: "0 10px",
  borderRadius: 2,
  border: `1px solid ${active ? "rgba(0,229,255,0.55)" : "rgba(0,255,136,0.18)"}`,
  background: active ? "rgba(0,229,255,0.10)" : "rgba(0,0,0,0.25)",
  color: active ? HUD_COLORS.accentCyan : "rgba(183,255,226,0.85)",
  cursor: "pointer",
  fontFamily: HUD_TYPO.mono,
  fontSize: 11,
  fontWeight: 900,
  letterSpacing: 0.7,
  textTransform: "uppercase",
  whiteSpace: "nowrap",
});

export const sectionTitle: React.CSSProperties = {
  fontFamily: HUD_TYPO.mono,
  fontSize: 12,
  fontWeight: 950,
  letterSpacing: 1.1,
  textTransform: "uppercase",
  color: HUD_COLORS.textMain,
  marginBottom: 6,
};

export const paragraph: React.CSSProperties = {
  fontFamily: HUD_TYPO.mono,
  fontSize: 11,
  lineHeight: 1.5,
  color: "rgba(183,255,226,0.75)",
};

export const card: React.CSSProperties = {
  border: "1px solid rgba(0,255,136,0.12)",
  background: "rgba(0,0,0,0.35)",
  borderRadius: 2,
  padding: 10,
};

