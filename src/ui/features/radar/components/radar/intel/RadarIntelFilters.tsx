// src/ui/features/radar/components/radar/intel/RadarIntelFilters.tsx
// Bloque de filtros del Radar Intel: layout responsive y plegable en modo bottom para evitar scroll innecesario.

import React from "react";
import type { BandFilter, RiskFilter } from "../radarTypes";
import { selectStyle } from "../radarUtils";
import { FILTER_BOX_LABEL_STYLE, FILTER_ROW_STYLE, FILTER_STRIP_STYLE } from "./radarIntelStyles";
import { useI18n } from "../../../../../i18n";

type RadarIntelFiltersProps = {
  layout: "side" | "bottom";
  riskFilter: RiskFilter;
  bandFilter: BandFilter;
  channelFilter: number | null;
  search: string;
  availableChannels: number[];
  onChangeRiskFilter: (value: RiskFilter) => void;
  onChangeBandFilter: (value: BandFilter) => void;
  onChangeChannelFilter: (value: number | null) => void;
  onChangeSearch: (value: string) => void;
};

export const RadarIntelFilters: React.FC<RadarIntelFiltersProps> = ({
  layout,
  riskFilter,
  bandFilter,
  channelFilter,
  search,
  availableChannels,
  onChangeRiskFilter,
  onChangeBandFilter,
  onChangeChannelFilter,
  onChangeSearch,
}) => {
  const { t } = useI18n();
  const [collapsed, setCollapsed] = React.useState(layout === "bottom");

  // Si cambiamos de layout por resize, reajustamos el colapso por defecto:
  // - side: siempre expandido
  // - bottom: por defecto plegado para que quepan detalles sin scroll
  React.useEffect(() => {
    setCollapsed(layout === "bottom");
  }, [layout]);

  // En bottom layout, evitamos controles a ancho completo y usamos columnas adaptativas.
  const bottomGridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
    gap: 10,
    alignItems: "start",
  };

  const controlStyle: React.CSSProperties =
    layout === "side"
      ? {}
      : {
          // No llenes toda la fila: maxWidth + minWidth para que parezca HUD compacto.
          width: "100%",
          maxWidth: 220,
          minWidth: 160,
        };

  const chipStyle: React.CSSProperties = {
    fontFamily: "monospace",
    fontSize: 10,
    fontWeight: 900,
    letterSpacing: 0.7,
    textTransform: "uppercase",
    color: "rgba(183,255,226,0.85)",
    border: "1px solid rgba(0,255,136,0.18)",
    background: "rgba(0,0,0,0.35)",
    padding: "3px 6px",
    borderRadius: 2,
    whiteSpace: "nowrap",
  };

  return (
    <div style={{ marginBottom: 10, paddingBottom: 10, borderBottom: "1px solid rgba(0,255,136,0.14)" }}>
      {layout === "side" ? (
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
            <select
              value={bandFilter}
              onChange={(e) => onChangeBandFilter(e.target.value as BandFilter)}
              style={{ ...selectStyle, width: 132 }}
            >
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
      ) : (
        <>
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
              <span style={chipStyle}>{t("radar.intel.filters.risk")}:{riskFilter}</span>
              <span style={chipStyle}>{t("radar.intel.filters.band")}:{bandFilter}</span>
              <span style={chipStyle}>{t("radar.intel.filters.channel")}:{channelFilter === null ? t("radar.intel.filters.option.all") : String(channelFilter)}</span>
            </div>

            <button
              onClick={() => setCollapsed((v) => !v)}
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

          {/* Busqueda siempre visible para no perder control rapido cuando esta plegado. */}
          <div style={{ ...FILTER_ROW_STYLE, marginBottom: collapsed ? 0 : 10 }}>
            <div style={FILTER_BOX_LABEL_STYLE}>{t("radar.intel.filters.query")}</div>
            <input
              value={search}
              onChange={(e) => onChangeSearch(e.target.value)}
              placeholder={t("radar.intel.filters.searchPlaceholder")}
              style={{ ...selectStyle, width: "min(260px, 100%)" }}
            />
          </div>

          {!collapsed && (
            <div style={bottomGridStyle}>
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
                <select
                  value={bandFilter}
                  onChange={(e) => onChangeBandFilter(e.target.value as BandFilter)}
                  style={{ ...selectStyle, ...controlStyle }}
                >
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
          )}
        </>
      )}
    </div>
  );
};
