// src/ui/features/radar/components/radar/intel/RadarIntelHeader.tsx
// Cabecera del Intel Panel: titulo + toggle de ayuda (sin logica de negocio).

import React from "react";
import { HEADER_STYLE, HELP_BUTTON_STYLE } from "./radarIntelStyles";

type RadarIntelHeaderProps = {
  showIntelHelp: boolean;
  onToggleHelp: () => void;
};

export const RadarIntelHeader: React.FC<RadarIntelHeaderProps> = ({ showIntelHelp, onToggleHelp }) => {
  return (
    <div style={HEADER_STYLE}>
      <span>NODE INTEL</span>
      <button
        onClick={onToggleHelp}
        aria-label={showIntelHelp ? "HIDE_INTEL_HELP" : "SHOW_INTEL_HELP"}
        style={{
          ...HELP_BUTTON_STYLE,
          borderColor: showIntelHelp ? "rgba(0,255,136,0.55)" : "rgba(0,255,136,0.25)",
          color: showIntelHelp ? "#00ff88" : "rgba(183,255,226,0.85)",
        }}
      >
        ?
      </button>
    </div>
  );
};
