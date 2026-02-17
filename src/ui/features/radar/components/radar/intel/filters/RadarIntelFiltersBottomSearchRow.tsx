// src/ui/features/radar/components/radar/intel/filters/RadarIntelFiltersBottomSearchRow.tsx
// Vista "bottom": busqueda siempre visible y (opcional) accion inline para abrir Audit Console.

import React from "react";
import { selectStyle } from "../../radarUtils";
import { FILTER_BOX_LABEL_STYLE, FILTER_ROW_STYLE } from "../radarIntelStyles";

export const RadarIntelFiltersBottomSearchRow: React.FC<{
  t: (k: any) => string;
  search: string;
  onChangeSearch: (value: string) => void;
  collapsed: boolean;
  inlineAuditAction?: { enabled: boolean; onClick: () => void } | null;
}> = ({ t, search, onChangeSearch, collapsed, inlineAuditAction = null }) => {
  return (
    <div style={{ ...FILTER_ROW_STYLE, marginBottom: collapsed ? 0 : 10, alignItems: "flex-end" }}>
      <div style={FILTER_BOX_LABEL_STYLE}>{t("radar.intel.filters.query")}</div>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <input
          value={search}
          onChange={(e) => onChangeSearch(e.target.value)}
          placeholder={t("radar.intel.filters.searchPlaceholder")}
          style={{ ...selectStyle, width: "min(220px, 100%)" }}
        />

        {inlineAuditAction && (
          <button
            onClick={inlineAuditAction.onClick}
            disabled={!inlineAuditAction.enabled}
            style={{
              height: 30,
              padding: "0 10px",
              background: inlineAuditAction.enabled ? "rgba(0, 255, 136, 0.12)" : "rgba(0,0,0,0.25)",
              border: `1px solid ${inlineAuditAction.enabled ? "#00ff88" : "rgba(0,255,136,0.18)"}`,
              color: inlineAuditAction.enabled ? "#00ff88" : "rgba(183,255,226,0.55)",
              cursor: inlineAuditAction.enabled ? "pointer" : "not-allowed",
              fontSize: 10,
              fontWeight: 900,
              letterSpacing: 0.8,
              textTransform: "uppercase",
              fontFamily: "monospace",
              borderRadius: 2,
              flexShrink: 0,
              boxShadow: inlineAuditAction.enabled ? "0 0 10px rgba(0,255,136,0.10)" : "none",
            }}
          >
            {t("radar.intel.selection.openAuditConsole")}
          </button>
        )}
      </div>
    </div>
  );
};

