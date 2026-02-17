// src/ui/features/scene3d/components/NodeLabel.tsx
// Label HTML sobre nodo 3D: wrapper de logica (paleta/confianza) + render via `NodeLabelView`.

import React from "react";
import type { DeviceType } from "../../../../shared/dtos/NetworkDTOs";
import { useNodeLabelState } from "../hooks/useNodeLabelState";
import { NodeLabelView } from "./node_label/NodeLabelView";

export const NodeLabel: React.FC<{
  title: string;
  subtitle: string;
  meta?: string;
  type: DeviceType;
  confidence: number;
  isSelected?: boolean;
  variant?: "default" | "router";
  rows?: Array<{ label: string; value: string }>;
}> = ({ title, subtitle, meta, type, confidence, isSelected = false, variant = "default", rows }) => {
  const { palette, confidenceBadge } = useNodeLabelState({ type, confidence });

  return (
    <NodeLabelView
      title={title}
      subtitle={subtitle}
      meta={meta}
      type={type}
      confidenceBadge={confidenceBadge}
      palette={palette}
      isSelected={isSelected}
      variant={variant}
      rows={rows}
    />
  );
};
