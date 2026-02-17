// src/ui/features/radar/components/radar/intel/filters/RadarIntelFiltersBottomHeader.tsx
// Vista "bottom": header compacto con chips (resumen) + boton para plegar/desplegar filtros.

import React from "react";
import type { BandFilter, RiskFilter } from "../../radarTypes";
import { CHIP_STYLE } from "./radarIntelFilterViewStyles";

export const RadarIntelFiltersBottomHeader: React.FC<{
  t: (k: any) => string;
  riskFilter: RiskFilter;
  bandFilter: BandFilter;
  channelFilter: number | null;
  collapsed: boolean;
  onToggleCollapsed: () => void;
}> = ({ t, riskFilter, bandFilter, channelFilter, collapsed, onToggleCollapsed }) => {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
        marginBottom: 8,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, flexWrap: "wrap" }}>
        <div style={{ color: "#00ff88", fontWeight: 900, letterSpacing: 1, fontSize: 10 }}>{t("radar.intel.filters.title")}</div>
        <span style={CHIP_STYLE}>
          {t("radar.intel.filters.risk")}:{riskFilter}
        </span>
        <span style={CHIP_STYLE}>
          {t("radar.intel.filters.band")}:{bandFilter}
        </span>
        <span style={CHIP_STYLE}>
          {t("radar.intel.filters.channel")}:
          {channelFilter === null ? t("radar.intel.filters.option.all") : String(channelFilter)}
        </span>
      </div>

      <button
        onClick={onToggleCollapsed}
        aria-label={collapsed ? "EXPAND_RADAR_FILTERS" : "COLLAPSE_RADAR_FILTERS"}
        style={{
          background: "rgba(0,0,0,0.35)",
          border: "1px solid rgba(0,255,136,0.25)",
          color: collapsed ? "rgba(183,255,226,0.85)" : "#00ff88",
          cursor: "pointer",
          fontSize: 11,
          padding: "4px 8px",
          fontFamily: "monospace",
          fontWeight: 900,
          letterSpacing: 0.7,
          textTransform: "uppercase",
          flexShrink: 0,
        }}
      >
        {collapsed ? t("radar.intel.filters.show") : t("radar.intel.filters.hide")}
      </button>
    </div>
  );
};

