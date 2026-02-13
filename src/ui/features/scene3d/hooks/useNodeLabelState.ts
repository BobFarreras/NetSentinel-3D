// src/ui/features/scene3d/hooks/useNodeLabelState.ts
// Estado de label 3D: resuelve paleta por tipo y calcula badge (HIGH/MED/LOW) segun confianza.
import { useMemo } from "react";
import type { DeviceType } from "../../../../shared/dtos/NetworkDTOs";
import { NODE_TYPE_COLORS } from "../components/sceneTokens";

type UseNodeLabelStateArgs = {
  type: DeviceType;
  confidence: number;
};

type UseNodeLabelState = {
  palette: { fg: string; glow: string; border: string };
  confidenceBadge: { pct: number; level: "HIGH" | "MED" | "LOW" };
};

export const useNodeLabelState = ({ type, confidence }: UseNodeLabelStateArgs): UseNodeLabelState => {
  const palette = NODE_TYPE_COLORS[type] || NODE_TYPE_COLORS.UNKNOWN;

  const confidenceBadge = useMemo(() => {
    const pct = Math.max(0, Math.min(100, Math.round(confidence)));
    const level: "HIGH" | "MED" | "LOW" = pct >= 80 ? "HIGH" : pct >= 50 ? "MED" : "LOW";
    return { pct, level };
  }, [confidence]);

  return { palette, confidenceBadge };
};
