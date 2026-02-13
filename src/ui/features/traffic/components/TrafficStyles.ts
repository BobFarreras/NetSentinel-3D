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

export const gridTemplate = "45px 1fr 15px 1fr 100px";
