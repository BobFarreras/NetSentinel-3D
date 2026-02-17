// src/ui/features/scene3d/components/node_label/NodeLabelIcon.tsx
// Iconos SVG del label 3D (segun tipo de dispositivo) con estilo terminal/cyberpunk.

import React from "react";
import type { DeviceType } from "../../../../../shared/dtos/NetworkDTOs";

export const NodeLabelIcon: React.FC<{ type: DeviceType; color: string }> = ({ type, color }) => {
  const common = {
    stroke: color,
    fill: "none",
    strokeWidth: 2.2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (type) {
    case "PHONE":
      return (
        <svg width="28" height="28" viewBox="0 0 24 24">
          <rect x="8" y="2.5" width="8" height="19" rx="2" {...common} />
          <path d="M11 18.5h2" {...common} />
        </svg>
      );
    case "PC":
      return (
        <svg width="28" height="28" viewBox="0 0 24 24">
          <rect x="3" y="4" width="18" height="12" rx="2" {...common} />
          <path d="M8 20h8" {...common} />
          <path d="M10 16v4" {...common} />
          <path d="M14 16v4" {...common} />
        </svg>
      );
    case "TV":
      return (
        <svg width="28" height="28" viewBox="0 0 24 24">
          <rect x="4" y="5" width="16" height="11" rx="2" {...common} />
          <path d="M9 20h6" {...common} />
        </svg>
      );
    case "SPEAKER":
      return (
        <svg width="28" height="28" viewBox="0 0 24 24">
          <rect x="7" y="3" width="10" height="18" rx="2" {...common} />
          <path d="M12 9.5v0.1" {...common} />
          <circle cx="12" cy="15" r="2.5" {...common} />
        </svg>
      );
    case "ROUTER":
      return (
        <svg width="28" height="28" viewBox="0 0 24 24">
          <rect x="4" y="12" width="16" height="7" rx="2" {...common} />
          <path d="M8 12v-2" {...common} />
          <path d="M16 12v-2" {...common} />
          <path d="M9 16h0.01" {...common} />
          <path d="M12 16h0.01" {...common} />
          <path d="M15 16h0.01" {...common} />
        </svg>
      );
    case "IOT":
      return (
        <svg width="28" height="28" viewBox="0 0 24 24">
          <rect x="8" y="8" width="8" height="8" rx="2" {...common} />
          <path d="M12 3v3" {...common} />
          <path d="M12 18v3" {...common} />
          <path d="M3 12h3" {...common} />
          <path d="M18 12h3" {...common} />
        </svg>
      );
    default:
      return (
        <svg width="28" height="28" viewBox="0 0 24 24">
          <path d="M12 17h.01" {...common} />
          <path d="M9.2 9.2a3.2 3.2 0 1 1 5.6 2.2c-.9.7-1.6 1.2-1.6 2.6" {...common} />
        </svg>
      );
  }
};

