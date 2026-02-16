// src/ui/features/console_logs/components/RadarLogsView.tsx
// Vista RADAR LOGS: tabla de eventos (scan/network/error) y seleccion de BSSID para sincronizar con Radar View.
import React from "react";
import type { RadarLogEntry } from "../../radar/hooks/useRadarLogs";
import { CONSOLE_COLORS } from "./consoleLogsStyles";
import { useI18n } from "../../../i18n";

type RadarLogsViewProps = {
  logs: RadarLogEntry[];
  selectedBssid: string | null;
  onSelectBssid: (bssid: string) => void;
};

const gridTemplate = "58px 1.2fr 1fr 1fr 60px 70px 90px 90px";

export const RadarLogsView: React.FC<RadarLogsViewProps> = ({ logs, selectedBssid, onSelectBssid }) => {
  const { t } = useI18n();
  return (
    <div style={{ height: "100%", minHeight: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: gridTemplate,
          gap: "6px",
          padding: "4px 6px",
          borderBottom: "1px solid #222",
          color: CONSOLE_COLORS.textDim,
          fontWeight: "bold",
          fontSize: "0.65rem",
          background: "#070707",
          flexShrink: 0,
        }}
      >
        <span>{t("radarLogs.columns.type")}</span>
        <span>{t("radarLogs.columns.ssid")}</span>
        <span>{t("radarLogs.columns.vendor")}</span>
        <span>{t("radarLogs.columns.sec")}</span>
        <span>{t("radarLogs.columns.ch")}</span>
        <span>{t("radarLogs.columns.rssi")}</span>
        <span>{t("radarLogs.columns.risk")}</span>
        <span>{t("radarLogs.columns.link")}</span>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
        {logs.length === 0 && (
          <div style={{ color: CONSOLE_COLORS.textDim, fontSize: "0.8rem", padding: "10px 6px" }}>
            {t("radarLogs.empty")}
          </div>
        )}

        {logs
          .slice(0)
          .reverse()
          .map((entry, i) => {
            const time = new Date(entry.ts).toLocaleTimeString();
            if (entry.kind === "scan") {
              return (
                <div
                  key={i}
                  style={{
                    display: "grid",
                    gridTemplateColumns: gridTemplate,
                    gap: "6px",
                    padding: "3px 6px",
                    borderBottom: "1px solid #111",
                    fontFamily: "'Consolas', monospace",
                    fontSize: "0.7rem",
                    color: CONSOLE_COLORS.accent,
                    background: "rgba(0,255,136,0.04)",
                  }}
                >
                  <span style={{ fontWeight: "bold" }}>{t("radarLogs.kind.scan")}</span>
                  <span style={{ gridColumn: "2 / span 7", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    [{time}] {entry.message}
                  </span>
                </div>
              );
            }

            if (entry.kind === "error") {
              return (
                <div
                  key={i}
                  style={{
                    display: "grid",
                    gridTemplateColumns: gridTemplate,
                    gap: "6px",
                    padding: "3px 6px",
                    borderBottom: "1px solid #111",
                    fontFamily: "'Consolas', monospace",
                    fontSize: "0.7rem",
                    color: CONSOLE_COLORS.textErr,
                    background: "rgba(255,0,0,0.04)",
                  }}
                >
                  <span style={{ fontWeight: "bold" }}>{t("radarLogs.kind.err")}</span>
                  <span style={{ gridColumn: "2 / span 7", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    [{time}] {entry.message}
                  </span>
                </div>
              );
            }

            const n = entry.network;
            const isSelected = selectedBssid === n.bssid;
            return (
              <div
                key={i}
                onClick={() => onSelectBssid(n.bssid)}
                title={t("radarLogs.tooltip.selectInRadar")}
                style={{
                  display: "grid",
                  gridTemplateColumns: gridTemplate,
                  gap: "6px",
                  padding: "3px 6px",
                  borderBottom: "1px solid #111",
                  fontFamily: "'Consolas', monospace",
                  fontSize: "0.7rem",
                  color: CONSOLE_COLORS.textMain,
                  cursor: "pointer",
                  background: isSelected ? "rgba(0,229,255,0.08)" : "transparent",
                }}
              >
                <span style={{ fontWeight: "bold", color: n.isConnected ? CONSOLE_COLORS.cyan : CONSOLE_COLORS.textDim }}>{t("radarLogs.kind.net")}</span>
                <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={n.ssid}>
                  {n.ssid}
                </span>
                <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={n.vendor}>
                  {n.vendor}
                </span>
                <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={n.securityType}>
                  {n.securityType}
                </span>
                <span>{typeof n.channel === "number" ? n.channel : "?"}</span>
                <span>{n.signalLevel}</span>
                <span style={{ fontWeight: "bold" }}>{String(n.riskLevel || "").toUpperCase()}</span>
                <span style={{ fontWeight: 800, color: n.isConnected ? CONSOLE_COLORS.cyan : CONSOLE_COLORS.textDim }}>
                  {n.isConnected ? t("radarLogs.link.connected") : t("radarLogs.link.nearby")}
                </span>
              </div>
            );
          })}
      </div>
    </div>
  );
};
