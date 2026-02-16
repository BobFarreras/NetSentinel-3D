// src/ui/features/radar/components/radar/intel/RadarIntelSelectionDetails.tsx
// Detalles del WiFi seleccionado (SSID/BSSID/vendor/security) y accion para abrir Attack Lab con contexto.

import React from "react";
import type { WifiNetworkDTO } from "../../../../../../shared/dtos/NetworkDTOs";
import { useI18n } from "../../../../../i18n";

type RadarIntelSelectionDetailsProps = {
  selected: WifiNetworkDTO | null;
  onOpenAudit: () => void;
  showAuditButton?: boolean;
};

export const RadarIntelSelectionDetails: React.FC<RadarIntelSelectionDetailsProps> = ({ selected, onOpenAudit, showAuditButton = true }) => {
  const { t } = useI18n();
  if (!selected) {
    return (
      <div style={{ color: "rgba(183,255,226,0.7)", fontSize: 12, lineHeight: 1.45 }}>
        {t("radar.intel.selection.placeholder")}
      </div>
    );
  }

  return (
    <div style={{ fontSize: 12, lineHeight: 1.5 }}>
      <div style={{ fontWeight: 800, color: "#eafff4", marginBottom: 8 }}>
        {selected.ssid}{" "}
        <span style={{ color: "rgba(183,255,226,0.6)", fontWeight: 600 }}>[CH {selected.channel ?? "?"}]</span>
      </div>

      <div>
        {t("radar.intel.selection.link")}:{" "}
        <span style={{ color: selected.isConnected ? "#00e5ff" : "rgba(183,255,226,0.75)", fontWeight: 800 }}>
          {selected.isConnected ? t("radarLogs.link.connected") : t("radarLogs.link.nearby")}
        </span>
      </div>
      <div>
        {t("radar.intel.selection.bssid")}: <span style={{ color: "#00ff88" }}>{selected.bssid}</span>
      </div>
      <div>
        {t("radar.intel.selection.vendor")}: <span style={{ color: "#ffe066" }}>{selected.vendor}</span>
      </div>
      <div>
        {t("radar.intel.selection.security")}: <span style={{ color: "#b7ffe2" }}>{selected.securityType}</span>
      </div>
      <div>
        {t("radar.intel.selection.rssi")}: <span style={{ color: "#b7ffe2" }}>{selected.signalLevel} dBm</span>
      </div>

      {showAuditButton && !selected.isConnected && (
        <div style={{ marginTop: 20, paddingTop: 10, borderTop: "1px dashed rgba(255, 80, 80, 0.4)" }}>
          <div style={{ color: "#00ff88", fontWeight: 800, marginBottom: 6, fontSize: 10, letterSpacing: 1 }}>
            {t("radar.intel.selection.countermeasures")}
          </div>
          <button
            onClick={onOpenAudit}
            style={{
              width: "100%",
              background: "rgba(0, 255, 136, 0.1)",
              border: "1px solid #00ff88",
              color: "#00ff88",
              padding: "8px",
              cursor: "pointer",
              fontSize: 11,
              fontWeight: "bold",
              fontFamily: "monospace",
              textTransform: "uppercase",
              boxShadow: "0 0 10px rgba(0,255,136,0.1)",
              transition: "all 0.2s",
            }}
          >
            {t("radar.intel.selection.openAuditConsole")}
          </button>
        </div>
      )}

      <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid rgba(0,255,136,0.14)" }}>
        {selected.isTargetable ? (
          <div style={{ color: "#ff6666", fontWeight: 800 }}>{t("radar.intel.selection.weakConfig")}</div>
        ) : (
          <div style={{ color: "#00ff88", fontWeight: 800 }}>{t("radar.intel.selection.okConfig")}</div>
        )}
      </div>
    </div>
  );
};
