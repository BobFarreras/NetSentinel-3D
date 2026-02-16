// src/ui/features/radar/components/radar/intel/RadarIntelHeader.tsx
// Cabecera del Intel Panel: titulo + toggle de ayuda (sin logica de negocio).

import React from "react";
import { HEADER_STYLE, HELP_BUTTON_STYLE } from "./radarIntelStyles";
import { useI18n } from "../../../../../i18n";

type RadarIntelHeaderProps = {
  showIntelHelp: boolean;
  onToggleHelp: () => void;
};

export const RadarIntelHeader: React.FC<RadarIntelHeaderProps> = ({ showIntelHelp, onToggleHelp }) => {
  const { t } = useI18n();
  return (
    <div style={HEADER_STYLE}>
      <span>{t("radar.intel.header.title")}</span>
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
