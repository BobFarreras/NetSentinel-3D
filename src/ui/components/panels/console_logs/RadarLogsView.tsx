// src/ui/components/panels/console_logs/RadarLogsView.tsx
import React from "react";
import type { RadarLogEntry } from "../../../hooks/modules/radar/useRadarLogs";
import { CONSOLE_COLORS } from "./consoleLogsStyles";

type RadarLogsViewProps = {
  logs: RadarLogEntry[];
  selectedBssid: string | null;
  onSelectBssid: (bssid: string) => void;
};

const gridTemplate = "58px 1.2fr 1fr 1fr 60px 70px 90px 90px";

export const RadarLogsView: React.FC<RadarLogsViewProps> = ({ logs, selectedBssid, onSelectBssid }) => {
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
        <span>TYPE</span>
        <span>SSID</span>
        <span>VENDOR</span>
        <span>SEC</span>
        <span>CH</span>
        <span>RSSI</span>
        <span>RISK</span>
        <span>LINK</span>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
        {logs.length === 0 && (
          <div style={{ color: CONSOLE_COLORS.textDim, fontSize: "0.8rem", padding: "10px 6px" }}>
            Sin actividad. Abre RADAR VIEW y pulsa SCAN AIRWAVES.
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
                  <span style={{ fontWeight: "bold" }}>SCAN</span>
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
                  <span style={{ fontWeight: "bold" }}>ERR</span>
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
                title="Seleccionar nodo en Radar View"
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
                <span style={{ fontWeight: "bold", color: n.isConnected ? CONSOLE_COLORS.cyan : CONSOLE_COLORS.textDim }}>NET</span>
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
                  {n.isConnected ? "CONNECTED" : "NEARBY"}
                </span>
              </div>
            );
          })}
      </div>
    </div>
  );
};
