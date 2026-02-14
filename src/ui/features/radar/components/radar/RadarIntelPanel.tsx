// src/ui/features/radar/components/radar/RadarIntelPanel.tsx
// Panel lateral del Radar: filtros, detalles del nodo WiFi seleccionado y accion para abrir el Attack Lab con contexto.

import React from "react";
import type { DeviceDTO, WifiNetworkDTO } from "../../../../../shared/dtos/NetworkDTOs";
import type { BandFilter, RiskFilter } from "./radarTypes";
import { selectStyle } from "./radarUtils";
import { windowingAdapter } from "../../../../../adapters/windowingAdapter";
import { uiLogger } from "../../../../utils/logger";

const FILTER_BOX_LABEL_STYLE: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 900,
  letterSpacing: 1,
  color: "rgba(183,255,226,0.65)",
  width: 50,
  flexShrink: 0,
  textTransform: "uppercase",
};

const FILTER_ROW_STYLE: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  minWidth: 0,
  // En paneles muy estrechos, permitimos wrap para evitar texto/input cortado.
  flexWrap: "wrap",
};

const FILTER_STRIP_STYLE: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
  alignItems: "center",
};

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
  layout?: "side" | "bottom";
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
  layout = "side",
}) => {

  const handleOpenAudit = () => {
    uiLogger.info("[radar] open audit solicitado");

    if (!selected) {
        uiLogger.warn("[radar] open audit abortado: no hay network seleccionada");
        return;
    }

    uiLogger.info("[radar] network seleccionada", { ssid: selected.ssid, bssid: selected.bssid });

    // 1. CREAR OBJETIVO VIRTUAL
    const virtualTarget: DeviceDTO = {
        ip: selected.ssid,
        mac: selected.bssid,
        vendor: selected.vendor,
        hostname: selected.ssid,
        isGateway: false,
        ping: undefined, 
        openPorts: [],
        os: "WiFi Access Point", 
        deviceType: "ROUTER"
    };

    uiLogger.info("[radar] virtual target creado", virtualTarget);

    // 2. NAVEGACIÓN INTERNA
    uiLogger.info("[radar] emitiendo dockPanel attack_lab");
    
    try {
        windowingAdapter.emitDockPanel("attack_lab");
    } catch (e) {
        uiLogger.error("[radar] fallo al emitir dockPanel", e);
    }
    
    // 3. ENVIAR DATOS
    setTimeout(() => {
        try {
            windowingAdapter.emitAttackLabContext({
                targetDevice: virtualTarget,
                scenarioId: "wifi_brute_force_dict",
                autoRun: false 
            });
        } catch (e) {
            uiLogger.error("[radar] fallo al emitir contexto attack_lab", e);
        }
    }, 300);
  };

  return (
    <div
      style={{
        width: layout === "side" ? 290 : "100%",
        borderLeft: layout === "side" ? "1px solid rgba(0,255,136,0.18)" : "none",
        borderTop: layout === "bottom" ? "1px solid rgba(0,255,136,0.18)" : "none",
        padding: 12,
        background: "linear-gradient(180deg, rgba(0,10,5,0.75), rgba(0,0,0,0.55))",
        color: "#b7ffe2",
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        overflow: "hidden",
        flexShrink: 0,
      }}
    >
      <div style={{ color: "#00ff88", fontWeight: 800, letterSpacing: 1, marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span>NODE INTEL</span>
        <button onClick={onToggleHelp} style={{ background: "transparent", border: "1px solid rgba(0,255,136,0.25)", color: "rgba(183,255,226,0.85)", cursor: "pointer", fontSize: 11, padding: "2px 8px" }}>?</button>
      </div>

      {/* Scroll del panel completo: en ventanas pequenas, evita cortar filtros/botones. */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: layout === "bottom" ? "visible" : "auto",
          // Deja espacio para scrollbar cuando existe.
          paddingRight: layout === "bottom" ? 0 : 10,
        }}
      >
        {showIntelHelp && (
          <div style={{ marginBottom: 10, padding: 10, border: "1px solid rgba(0,255,136,0.18)", background: "rgba(0,0,0,0.35)", color: "rgba(183,255,226,0.85)", fontSize: 11, lineHeight: 1.45 }}>
            <div style={{ color: "#00ff88", fontWeight: 900, marginBottom: 6 }}>Guia rapida</div>
            <div style={{ marginBottom: 6 }}><b>Riesgo</b>: filtra por seguridad inferida.</div>
          </div>
        )}

        {/* FILTROS */}
        <div style={{ marginBottom: 10, paddingBottom: 10, borderBottom: "1px solid rgba(0,255,136,0.14)" }}>
          {layout === "side" ? (
            // Compacto en linea: evita selects a ancho completo y reduce altura del panel lateral.
            <div style={FILTER_STRIP_STYLE}>
              <div style={{ ...FILTER_ROW_STYLE, flex: "0 0 auto" }}>
                <div style={FILTER_BOX_LABEL_STYLE}>RISK</div>
                <select
                  aria-label="FILTER_RISK_SELECT"
                  value={riskFilter}
                  onChange={(e) => onChangeRiskFilter(e.target.value as RiskFilter)}
                  style={{ ...selectStyle, width: 132 }}
                >
                  <option value="ALL">ALL</option>
                  <option value="HARDENED">HARDENED</option>
                  <option value="STANDARD">STANDARD</option>
                  <option value="LEGACY">LEGACY</option>
                  <option value="OPEN">OPEN</option>
                </select>
              </div>

              <div style={{ ...FILTER_ROW_STYLE, flex: "0 0 auto" }}>
                <div style={FILTER_BOX_LABEL_STYLE}>BAND</div>
                <select value={bandFilter} onChange={(e) => onChangeBandFilter(e.target.value as BandFilter)} style={{ ...selectStyle, width: 132 }}>
                  <option value="ALL">ALL</option>
                  <option value="2.4">2.4GHz</option>
                  <option value="5">5GHz</option>
                  <option value="UNK">UNKGHz</option>
                </select>
              </div>

              <div style={{ ...FILTER_ROW_STYLE, flex: "0 0 auto" }}>
                <div style={FILTER_BOX_LABEL_STYLE}>CH</div>
                <select
                  aria-label="FILTER_CH_SELECT"
                  value={channelFilter === null ? "ALL" : String(channelFilter)}
                  onChange={(e) => onChangeChannelFilter(e.target.value === "ALL" ? null : Number(e.target.value))}
                  style={{ ...selectStyle, width: 120 }}
                >
                  <option value="ALL">ALL</option>
                  {availableChannels.map((ch) => <option key={ch} value={String(ch)}>CH {ch}</option>)}
                </select>
              </div>

              <div style={{ ...FILTER_ROW_STYLE, flex: "1 1 180px", minWidth: 180 }}>
                <div style={FILTER_BOX_LABEL_STYLE}>Q</div>
                <input
                  value={search}
                  onChange={(e) => onChangeSearch(e.target.value)}
                  placeholder="ssid/vendor/bssid"
                  style={{ ...selectStyle, width: "100%", minWidth: 0 }}
                />
              </div>
            </div>
          ) : (
            // Layout bottom (stacked): los controles usan el ancho completo.
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 8, marginBottom: 8 }}>
                <div style={FILTER_ROW_STYLE}>
                  <div style={FILTER_BOX_LABEL_STYLE}>RISK</div>
                  <select
                    aria-label="FILTER_RISK_SELECT"
                    value={riskFilter}
                    onChange={(e) => onChangeRiskFilter(e.target.value as RiskFilter)}
                    style={{ ...selectStyle, flex: 1, minWidth: 0 }}
                  >
                    <option value="ALL">ALL</option>
                    <option value="HARDENED">HARDENED</option>
                    <option value="STANDARD">STANDARD</option>
                    <option value="LEGACY">LEGACY</option>
                    <option value="OPEN">OPEN</option>
                  </select>
                </div>

                <div style={FILTER_ROW_STYLE}>
                  <div style={FILTER_BOX_LABEL_STYLE}>BAND</div>
                  <select value={bandFilter} onChange={(e) => onChangeBandFilter(e.target.value as BandFilter)} style={{ ...selectStyle, flex: 1, minWidth: 0 }}>
                    <option value="ALL">ALL</option>
                    <option value="2.4">2.4GHz</option>
                    <option value="5">5GHz</option>
                    <option value="UNK">UNKGHz</option>
                  </select>
                </div>

                <div style={FILTER_ROW_STYLE}>
                  <div style={FILTER_BOX_LABEL_STYLE}>CH</div>
                  <select
                    aria-label="FILTER_CH_SELECT"
                    value={channelFilter === null ? "ALL" : String(channelFilter)}
                    onChange={(e) => onChangeChannelFilter(e.target.value === "ALL" ? null : Number(e.target.value))}
                    style={{ ...selectStyle, flex: 1, minWidth: 0 }}
                  >
                    <option value="ALL">ALL</option>
                    {availableChannels.map((ch) => <option key={ch} value={String(ch)}>CH {ch}</option>)}
                  </select>
                </div>

                <div style={FILTER_ROW_STYLE}>
                  <div style={FILTER_BOX_LABEL_STYLE}>Q</div>
                  <input
                    value={search}
                    onChange={(e) => onChangeSearch(e.target.value)}
                    placeholder="ssid/vendor/bssid"
                    style={{ ...selectStyle, flex: 1, minWidth: 0 }}
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {!selected ? (
          <div style={{ color: "rgba(183,255,226,0.7)", fontSize: 12, lineHeight: 1.45 }}>
            Selecciona un nodo del radar para ver detalles.
          </div>
        ) : (
          <div style={{ fontSize: 12, lineHeight: 1.5 }}>
            <div style={{ fontWeight: 800, color: "#eafff4", marginBottom: 8 }}>
              {selected.ssid} <span style={{ color: "rgba(183,255,226,0.6)", fontWeight: 600 }}>[CH {selected.channel ?? "?"}]</span>
            </div>
            
            {/* DETALLES */}
            <div>Link: <span style={{ color: selected.isConnected ? "#00e5ff" : "rgba(183,255,226,0.75)", fontWeight: 800 }}>{selected.isConnected ? "CONNECTED" : "NEARBY"}</span></div>
            <div>BSSID: <span style={{ color: "#00ff88" }}>{selected.bssid}</span></div>
            <div>Vendor: <span style={{ color: "#ffe066" }}>{selected.vendor}</span></div>
            <div>Security: <span style={{ color: "#b7ffe2" }}>{selected.securityType}</span></div>
            <div>RSSI: <span style={{ color: "#b7ffe2" }}>{selected.signalLevel} dBm</span></div>
            
            {/* BOTÓN DE ACCIÓN */}
            {!selected.isConnected && (
                <div style={{ marginTop: 20, paddingTop: 10, borderTop: "1px dashed rgba(255, 80, 80, 0.4)" }}>
                    <div style={{ color: "#00ff88", fontWeight: 800, marginBottom: 6, fontSize: 10, letterSpacing: 1 }}>
                        COUNTERMEASURES
                    </div>
                    <button
                        onClick={handleOpenAudit}
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
                            transition: "all 0.2s"
                        }}
                    >
                        ⚙️ OPEN AUDIT CONSOLE
                    </button>
                </div>
            )}

            <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid rgba(0,255,136,0.14)" }}>
              {selected.isTargetable ? (
                <div style={{ color: "#ff6666", fontWeight: 800 }}>ALERTA: configuracion debil</div>
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
