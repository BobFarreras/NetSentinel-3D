// src/ui/components/hud/radar/RadarIntelPanel.tsx
import React from "react";
import type { WifiNetworkDTO } from "../../../../shared/dtos/NetworkDTOs";
import type { BandFilter, RiskFilter } from "./radarTypes";
import { inferBandLabel, riskStyle, selectStyle } from "./radarUtils";

type RadarIntelPanelProps = {
  selected: WifiNetworkDTO | null;
  showIntelHelp: boolean;
  riskFilter: RiskFilter;
  bandFilter: BandFilter;
  channelFilter: number | null;
  search: string;
  availableChannels: number[];
  onToggleHelp: () => void;
  onChangeRiskFilter: (value: RiskFilter) => void;
  onChangeBandFilter: (value: BandFilter) => void;
  onChangeChannelFilter: (value: number | null) => void;
  onChangeSearch: (value: string) => void;
};

export const RadarIntelPanel: React.FC<RadarIntelPanelProps> = ({
  selected,
  showIntelHelp,
  riskFilter,
  bandFilter,
  channelFilter,
  search,
  availableChannels,
  onToggleHelp,
  onChangeRiskFilter,
  onChangeBandFilter,
  onChangeChannelFilter,
  onChangeSearch,
}) => {
  return (
    <div
      style={{
        width: 290,
        borderLeft: "1px solid rgba(0,255,136,0.18)",
        padding: 12,
        background: "linear-gradient(180deg, rgba(0,10,5,0.75), rgba(0,0,0,0.55))",
        color: "#b7ffe2",
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          color: "#00ff88",
          fontWeight: 800,
          letterSpacing: 1,
          marginBottom: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span>NODE INTEL</span>
        <button
          onClick={onToggleHelp}
          aria-label="NODE_INTEL_HELP"
          title="Que significa NODE INTEL"
          style={{
            background: "transparent",
            border: "1px solid rgba(0,255,136,0.25)",
            color: "rgba(183,255,226,0.85)",
            cursor: "pointer",
            fontSize: 11,
            padding: "2px 8px",
          }}
        >
          ?
        </button>
      </div>

      {showIntelHelp && (
        <div
          style={{
            marginBottom: 10,
            padding: 10,
            border: "1px solid rgba(0,255,136,0.18)",
            background: "rgba(0,0,0,0.35)",
            color: "rgba(183,255,226,0.85)",
            fontSize: 11,
            lineHeight: 1.45,
          }}
        >
          <div style={{ color: "#00ff88", fontWeight: 900, marginBottom: 6 }}>Guia rapida</div>
          <div style={{ marginBottom: 6 }}>
            <b>Riesgo</b>: filtra por seguridad inferida (<b>OPEN/LEGACY</b> suele ser debil; <b>HARDENED</b> suele ser
            robusto).
          </div>
          <div style={{ marginBottom: 6 }}>
            <b>Bandas</b>: se infieren por canal (<b>2.4GHz</b> 1..14, <b>5GHz</b> 32..177). <b>UNKGHz</b> indica que
            Windows/driver no expuso canal.
          </div>
          <div style={{ marginBottom: 6 }}>
            <b>CH</b>: canal WiFi. Sirve para detectar solapamiento y congestion.
          </div>
          <div style={{ marginBottom: 6 }}>
            <b>SEARCH</b>: filtra por SSID, vendor (OUI) o BSSID.
          </div>
          <div>
            <b>AUTO</b>: reescaneo periodico para observar cambios de señal/RSSI sin tener que pulsar manualmente.
          </div>
        </div>
      )}

      <div style={{ marginBottom: 10, paddingBottom: 10, borderBottom: "1px solid rgba(0,255,136,0.14)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
          <div>
            <div style={{ fontSize: 11, color: "rgba(183,255,226,0.65)", marginBottom: 4 }}>RISK</div>
            <select
              aria-label="FILTER_RISK_SELECT"
              value={riskFilter}
              onChange={(e) => onChangeRiskFilter(e.target.value as RiskFilter)}
              style={selectStyle}
            >
              <option value="ALL">ALL</option>
              <option value="HARDENED">HARDENED</option>
              <option value="STANDARD">STANDARD</option>
              <option value="LEGACY">LEGACY</option>
              <option value="OPEN">OPEN</option>
            </select>
          </div>
          <div>
            <div style={{ fontSize: 11, color: "rgba(183,255,226,0.65)", marginBottom: 4 }}>BAND</div>
            <select
              aria-label="FILTER_BAND_SELECT"
              value={bandFilter}
              onChange={(e) => onChangeBandFilter(e.target.value as BandFilter)}
              style={selectStyle}
            >
              <option value="ALL">ALL</option>
              <option value="2.4">2.4GHz</option>
              <option value="5">5GHz</option>
              <option value="UNK">UNKGHz</option>
            </select>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 8, marginBottom: 8 }}>
          <div>
            <div style={{ fontSize: 11, color: "rgba(183,255,226,0.65)", marginBottom: 4 }}>CHANNEL</div>
            <select
              aria-label="FILTER_CH_SELECT"
              value={channelFilter === null ? "ALL" : String(channelFilter)}
              onChange={(e) => onChangeChannelFilter(e.target.value === "ALL" ? null : Number(e.target.value))}
              style={selectStyle}
            >
              <option value="ALL">ALL</option>
              {availableChannels.map((ch) => (
                <option key={ch} value={String(ch)}>
                  CH {ch}
                </option>
              ))}
            </select>
          </div>
        </div>

        <input
          value={search}
          onChange={(e) => onChangeSearch(e.target.value)}
          placeholder="SEARCH: ssid/vendor/bssid"
          style={selectStyle}
        />
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", paddingRight: 4 }}>
        {!selected ? (
          <div style={{ color: "rgba(183,255,226,0.7)", fontSize: 12, lineHeight: 1.45 }}>
            Selecciona un nodo del radar (o una fila en RADAR LOGS) para ver detalles.
            <div style={{ marginTop: 10, fontSize: 11, opacity: 0.75 }}>
              Leyenda:
              <div>VERDE: Hardened</div>
              <div>AMARILLO: Standard</div>
              <div>ROJO: Legacy/Open</div>
            </div>
          </div>
        ) : (
          <div style={{ fontSize: 12, lineHeight: 1.5 }}>
            <div style={{ fontWeight: 800, color: "#eafff4", marginBottom: 8 }}>
              {selected.ssid}{" "}
              <span style={{ color: "rgba(183,255,226,0.6)", fontWeight: 600 }}>[CH {selected.channel ?? "?"}]</span>
            </div>
            <div>
              Link:{" "}
              <span style={{ color: selected.isConnected ? "#00e5ff" : "rgba(183,255,226,0.75)", fontWeight: 800 }}>
                {selected.isConnected ? "CONNECTED (TU ROUTER)" : "NEARBY"}
              </span>
            </div>
            <div>
              BSSID: <span style={{ color: "#00ff88" }}>{selected.bssid}</span>
            </div>
            <div>
              Vendor: <span style={{ color: "#ffe066" }}>{selected.vendor}</span>
            </div>
            <div>
              Security: <span style={{ color: "#b7ffe2" }}>{selected.securityType}</span>
            </div>
            <div>
              RSSI: <span style={{ color: "#b7ffe2" }}>{selected.signalLevel} dBm</span>
            </div>
            <div>
              Band: <span style={{ color: "#b7ffe2" }}>{inferBandLabel(selected.channel)}GHz</span>
            </div>
            <div>
              Dist: <span style={{ color: "#b7ffe2" }}>{Math.round(selected.distanceMock)}m</span>
            </div>
            <div>
              Risk:{" "}
              <span style={{ color: riskStyle(selected.riskLevel).dot, fontWeight: 800 }}>
                {riskStyle(selected.riskLevel).label}
              </span>
            </div>
            <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid rgba(0,255,136,0.14)" }}>
              {selected.isTargetable ? (
                <div style={{ color: "#ff6666", fontWeight: 800 }}>ALERTA: configuracion debil (modo educativo)</div>
              ) : (
                <div style={{ color: "#00ff88", fontWeight: 800 }}>ESTADO: configuracion aceptable</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
