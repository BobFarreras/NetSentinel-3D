// src/ui/features/radar/components/radar/intel/filters/RadarIntelFiltersSideStrip.tsx
// Vista "side": strip horizontal con selects (risk/band/channel) + busqueda, compacta para HUD.

import React from "react";
import type { BandFilter, RiskFilter } from "../../radarTypes";
import { selectStyle } from "../../radarUtils";
import { FILTER_BOX_LABEL_STYLE, FILTER_ROW_STYLE, FILTER_STRIP_STYLE } from "../radarIntelStyles";

export const RadarIntelFiltersSideStrip: React.FC<{
  t: (k: any) => string;
  riskFilter: RiskFilter;
  bandFilter: BandFilter;
  channelFilter: number | null;
  search: string;
  availableChannels: number[];
  onChangeRiskFilter: (value: RiskFilter) => void;
  onChangeBandFilter: (value: BandFilter) => void;
  onChangeChannelFilter: (value: number | null) => void;
  onChangeSearch: (value: string) => void;
}> = (props) => {
  const {
    t,
    riskFilter,
    bandFilter,
    channelFilter,
    search,
    availableChannels,
    onChangeRiskFilter,
    onChangeBandFilter,
    onChangeChannelFilter,
    onChangeSearch,
  } = props;

  return (
    <div style={FILTER_STRIP_STYLE}>
      <div style={{ ...FILTER_ROW_STYLE, flex: "0 0 auto" }}>
        <div style={FILTER_BOX_LABEL_STYLE}>{t("radar.intel.filters.risk")}</div>
        <select
          aria-label="FILTER_RISK_SELECT"
          value={riskFilter}
          onChange={(e) => onChangeRiskFilter(e.target.value as RiskFilter)}
          style={{ ...selectStyle, width: 132 }}
        >
          <option value="ALL">{t("radar.intel.filters.option.all")}</option>
          <option value="HARDENED">{t("radar.intel.filters.option.hardened")}</option>
          <option value="STANDARD">{t("radar.intel.filters.option.standard")}</option>
          <option value="LEGACY">{t("radar.intel.filters.option.legacy")}</option>
          <option value="OPEN">{t("radar.intel.filters.option.open")}</option>
        </select>
      </div>

      <div style={{ ...FILTER_ROW_STYLE, flex: "0 0 auto" }}>
        <div style={FILTER_BOX_LABEL_STYLE}>{t("radar.intel.filters.band")}</div>
        <select value={bandFilter} onChange={(e) => onChangeBandFilter(e.target.value as BandFilter)} style={{ ...selectStyle, width: 132 }}>
          <option value="ALL">{t("radar.intel.filters.option.all")}</option>
          <option value="2.4">2.4GHz</option>
          <option value="5">5GHz</option>
          <option value="UNK">{t("radar.intel.filters.option.unkBand")}</option>
        </select>
      </div>

      <div style={{ ...FILTER_ROW_STYLE, flex: "0 0 auto" }}>
        <div style={FILTER_BOX_LABEL_STYLE}>{t("radar.intel.filters.channel")}</div>
        <select
          aria-label="FILTER_CH_SELECT"
          value={channelFilter === null ? "ALL" : String(channelFilter)}
          onChange={(e) => onChangeChannelFilter(e.target.value === "ALL" ? null : Number(e.target.value))}
          style={{ ...selectStyle, width: 120 }}
        >
          <option value="ALL">{t("radar.intel.filters.option.all")}</option>
          {availableChannels.map((ch) => (
            <option key={ch} value={String(ch)}>
              CH {ch}
            </option>
          ))}
        </select>
      </div>

      <div style={{ ...FILTER_ROW_STYLE, flex: "1 1 180px", minWidth: 180 }}>
        <div style={FILTER_BOX_LABEL_STYLE}>{t("radar.intel.filters.query")}</div>
        <input
          value={search}
          onChange={(e) => onChangeSearch(e.target.value)}
          placeholder={t("radar.intel.filters.searchPlaceholder")}
          style={{ ...selectStyle, width: "100%", minWidth: 0 }}
        />
      </div>
    </div>
  );
};

