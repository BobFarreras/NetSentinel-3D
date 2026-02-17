// src/ui/features/traffic/components/TrafficStyles.ts
// Estilos del TrafficPanel: root layout y constantes de grid.
import type { CSSProperties } from "react";
import { HUD_COLORS } from "../../../styles/hudTokens";

export const trafficRootStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  height: "100%",
  background: HUD_COLORS.bgPanel,
  overflow: "hidden",
};

// Columnas:
// TYPE | SRC | > | DST | DATA | LEN
// DATA debe tener espacio suficiente (evita truncado agresivo).
export const gridTemplate = "50px 1.2fr 15px 1.2fr minmax(260px, 2.4fr) 70px";
