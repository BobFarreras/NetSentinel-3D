// src/ui/features/radar/components/radar/intel/filters/RadarIntelFiltersBottomGrid.tsx
// Vista "bottom": grid de selects plegable (risk/band/channel) optimizado para poco alto sin scroll.

import React from "react";
import type { BandFilter, RiskFilter } from "../../radarTypes";
import { selectStyle } from "../../radarUtils";
import { FILTER_BOX_LABEL_STYLE, FILTER_ROW_STYLE } from "../radarIntelStyles";
import { BOTTOM_GRID_STYLE } from "./radarIntelFilterViewStyles";

export const RadarIntelFiltersBottomGrid: React.FC<{
  t: (k: any) => string;
  riskFilter: RiskFilter;
  bandFilter: BandFilter;
  channelFilter: number | null;
  availableChannels: number[];
  onChangeRiskFilter: (value: RiskFilter) => void;
  onChangeBandFilter: (value: BandFilter) => void;
  onChangeChannelFilter: (value: number | null) => void;
}> = ({ t, riskFilter, bandFilter, channelFilter, availableChannels, onChangeRiskFilter, onChangeBandFilter, onChangeChannelFilter }) => {
  const controlStyle: React.CSSProperties = {
    width: "100%",
    maxWidth: 220,
    minWidth: 160,
  };

  return (
    <div style={BOTTOM_GRID_STYLE}>
      <div style={FILTER_ROW_STYLE}>
        <div style={FILTER_BOX_LABEL_STYLE}>{t("radar.intel.filters.risk")}</div>
        <select
          aria-label="FILTER_RISK_SELECT"
          value={riskFilter}
          onChange={(e) => onChangeRiskFilter(e.target.value as RiskFilter)}
          style={{ ...selectStyle, ...controlStyle }}
        >
          <option value="ALL">{t("radar.intel.filters.option.all")}</option>
          <option value="HARDENED">{t("radar.intel.filters.option.hardened")}</option>
          <option value="STANDARD">{t("radar.intel.filters.option.standard")}</option>
          <option value="LEGACY">{t("radar.intel.filters.option.legacy")}</option>
          <option value="OPEN">{t("radar.intel.filters.option.open")}</option>
        </select>
      </div>

      <div style={FILTER_ROW_STYLE}>
        <div style={FILTER_BOX_LABEL_STYLE}>{t("radar.intel.filters.band")}</div>
        <select value={bandFilter} onChange={(e) => onChangeBandFilter(e.target.value as BandFilter)} style={{ ...selectStyle, ...controlStyle }}>
          <option value="ALL">{t("radar.intel.filters.option.all")}</option>
          <option value="2.4">2.4GHz</option>
          <option value="5">5GHz</option>
          <option value="UNK">{t("radar.intel.filters.option.unkBand")}</option>
        </select>
      </div>

      <div style={FILTER_ROW_STYLE}>
        <div style={FILTER_BOX_LABEL_STYLE}>{t("radar.intel.filters.channel")}</div>
        <select
          aria-label="FILTER_CH_SELECT"
          value={channelFilter === null ? "ALL" : String(channelFilter)}
          onChange={(e) => onChangeChannelFilter(e.target.value === "ALL" ? null : Number(e.target.value))}
          style={{ ...selectStyle, ...controlStyle }}
        >
          <option value="ALL">{t("radar.intel.filters.option.all")}</option>
          {availableChannels.map((ch) => (
            <option key={ch} value={String(ch)}>
              CH {ch}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

