// src/ui/features/attack_lab/panel/LabModeView.tsx
// Vista LAB del Attack Lab: selector de escenario, panel de target y acciones (run/cancel/clear) + acceso al gestor de wordlists.

import React, { useState } from "react";
import type { DeviceDTO, WifiNetworkDTO } from "../../../../shared/dtos/NetworkDTOs";
import type { AttackLabScenario } from "../catalog/types";
import { WordlistManagerModal } from "./WordlistManagerModal";
import { useI18n } from "../../../i18n";

const inputStyle: React.CSSProperties = { width: "100%", background: "rgba(0,0,0,0.35)", border: "1px solid rgba(0,255,136,0.18)", color: "#b7ffe2", padding: "6px 8px", fontSize: 12, outline: "none", fontFamily: "inherit" };

const btnStyle = (active: boolean): React.CSSProperties => ({ 
    background: active ? "rgba(0,255,136,0.12)" : "transparent", 
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: active ? "#00ff88" : "rgba(0,255,136,0.2)", 
    color: active ? "#00ff88" : "#88cca0", 
    padding: "6px 12px", 
    cursor: active ? "pointer" : "not-allowed", 
    opacity: active ? 1 : 0.5, 
    fontWeight: 700, 
    fontSize: 12 
});

interface LabModeViewProps {
  scenarios: AttackLabScenario[];
  selectedId: string;
  onSelect: (id: string) => void;
  targetDevice: DeviceDTO | null;
  routerTargets?: DeviceDTO[];
  onSelectRouterTarget?: (ip: string | null) => void;
  deviceTargets?: DeviceDTO[];
  onSelectDeviceTarget?: (ip: string | null) => void;
  wifiTargets?: WifiNetworkDTO[];
  onSelectWifiTarget?: (bssid: string | null) => void;
  selectedScenario: AttackLabScenario | null;
  isRunning: boolean;
  onRun: () => void;
  onCancel: () => void;
  layout?: "wide" | "narrow";
}

export const LabModeView: React.FC<LabModeViewProps> = ({
  scenarios,
  selectedId,
  onSelect,
  targetDevice,
  routerTargets = [],
  onSelectRouterTarget,
  deviceTargets = [],
  onSelectDeviceTarget,
  wifiTargets = [],
  onSelectWifiTarget,
  selectedScenario,
  isRunning,
  onRun,
  onCancel,
  layout = "wide",
}) => {
  const { t } = useI18n();
  // ESTADO PARA EL MODAL DE DICCIONARIO
  const [showWordlist, setShowWordlist] = useState(false);

  // El selector de TARGET debe ser siempre accesible para ir rapido (sin abrir Radar).
  // Si un escenario NO requiere target, el operador puede dejarlo en "NO TARGET".
  const targetKind = selectedScenario?.category === "WIFI" ? "wifi" : selectedScenario?.category === "ROUTER" ? "router" : "device";
  const showRouterTargetSelect = targetKind === "router" && routerTargets.length > 0 && !!onSelectRouterTarget;
  const showWifiTargetSelect = targetKind === "wifi" && wifiTargets.length > 0 && !!onSelectWifiTarget;
  const showDeviceTargetSelect = targetKind === "device" && deviceTargets.length > 0 && !!onSelectDeviceTarget;

  return (
    <>
        <div style={{ display: "flex", gap: 12, padding: 12, flexShrink: 0, flexDirection: layout === "narrow" ? "column" : "row", alignItems: "stretch" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                <div style={{ color: "#5c7", fontSize: 10, textTransform: "uppercase" }}>{t("attackLab.lab.selectedScenario")}</div>
                {/* BOTÓN PARA ABRIR EL GESTOR (Solo si es un ataque wifi) */}
                {selectedScenario?.category === "WIFI" && (
                    <button 
                        onClick={() => setShowWordlist(true)}
                        style={{ background: "none", border: "none", color: "#00ff88", fontSize: 10, cursor: "pointer", textDecoration: "underline" }}
                    >
                        [{t("attackLab.lab.manageWordlist")}]
                    </button>
                )}
            </div>
            
            <select value={selectedId} onChange={(e) => onSelect(e.target.value)} style={inputStyle} disabled={isRunning}>
            <option value="">{t("attackLab.lab.selectVector")}</option>
            {scenarios.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
            </select>
            {selectedScenario && (
            <div style={{ marginTop: 8, color: "#8b9", fontSize: 11, lineHeight: 1.4, borderLeft: "2px solid #0f8", paddingLeft: 8 }}>
                {selectedScenario.description}
                <div style={{ marginTop: 4, color: "#0ff" }}>{t("attackLab.lab.modePrefix")}: {selectedScenario.mode}</div>
            </div>
            )}
        </div>
        <div style={{ width: layout === "narrow" ? "100%" : 240, minWidth: 220, display: "flex", flexDirection: "column", gap: 8 }}>
            <div>
            <div style={{ color: "#5c7", fontSize: 10, marginBottom: 4 }}>{t("attackLab.lab.target")}</div>
            {showWifiTargetSelect ? (
              <select
                value={targetDevice?.mac || ""}
                onChange={(e) => onSelectWifiTarget?.(e.target.value ? e.target.value : null)}
                style={inputStyle}
                disabled={isRunning}
                aria-label="ATTACK_LAB_WIFI_TARGET_SELECT"
              >
                <option value="">{t("attackLab.lab.noTarget")}</option>
                {wifiTargets.map((n) => (
                  <option key={n.bssid} value={n.bssid}>
                    {n.ssid || "<hidden>"}{n.channel ? ` (ch ${n.channel})` : ""}
                  </option>
                ))}
              </select>
            ) : showRouterTargetSelect ? (
              <select
                value={targetDevice?.ip || ""}
                onChange={(e) => onSelectRouterTarget?.(e.target.value ? e.target.value : null)}
                style={inputStyle}
                disabled={isRunning}
                aria-label="ATTACK_LAB_ROUTER_TARGET_SELECT"
              >
                <option value="">{t("attackLab.lab.noTarget")}</option>
                {routerTargets.map((d) => (
                  <option key={d.ip} value={d.ip}>
                    {d.ip}{d.hostname ? ` (${d.hostname})` : d.vendor ? ` (${d.vendor})` : ""}
                  </option>
                ))}
              </select>
            ) : showDeviceTargetSelect ? (
              <select
                value={targetDevice?.ip || ""}
                onChange={(e) => onSelectDeviceTarget?.(e.target.value ? e.target.value : null)}
                style={inputStyle}
                disabled={isRunning}
                aria-label="ATTACK_LAB_DEVICE_TARGET_SELECT"
              >
                <option value="">{t("attackLab.lab.noTarget")}</option>
                {deviceTargets.map((d) => (
                  <option key={d.ip} value={d.ip}>
                    {d.hostname || d.name || d.ip}{d.vendor ? ` (${d.vendor})` : ""}
                  </option>
                ))}
              </select>
            ) : (
              <div style={{ ...inputStyle, opacity: 0.8 }}>
                {targetDevice ? `${targetDevice.hostname || targetDevice.ip} (${targetDevice.vendor || t("attackLab.lab.na")})` : t("attackLab.lab.noTarget")}
              </div>
            )}
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {isRunning ? (
                <button 
                    disabled 
                    style={{ 
                        ...btnStyle(false), 
                        borderColor: "#00e5ff", 
                        color: "#00e5ff", 
                        opacity: 1, 
                        cursor: "wait", 
                        flex: "1 1 160px",
                        minWidth: 160,
                    }}
                >
                    <span className="blink">⚠️ {t("attackLab.lab.running")}</span>
                </button>
            ) : (
                <button onClick={onRun} disabled={!selectedScenario || !targetDevice} style={{ ...btnStyle(!!selectedScenario && !!targetDevice), flex: "1 1 160px", minWidth: 160 }}>
                    {t("attackLab.lab.execute")}
                </button>
            )}
            
            <button 
                onClick={onCancel} 
                disabled={!isRunning} 
                style={{ 
                    ...btnStyle(isRunning), 
                    borderColor: isRunning ? "#f55" : "rgba(0,255,136,0.2)", 
                    color: "#f55",
                    flex: "1 1 90px",
                    minWidth: 90,
                }}
            >
                {t("attackLab.lab.stop")}
            </button>
            </div>
            
            <style>{`
                @keyframes blink { 0% { opacity: 1; } 50% { opacity: 0.4; } 100% { opacity: 1; } }
                .blink { animation: blink 1.5s infinite; }
            `}</style>
        </div>
        </div>

        {/* MODAL DE DICCIONARIO (Se renderiza condicionalmente) */}
        <WordlistManagerModal 
            isOpen={showWordlist} 
            onClose={() => setShowWordlist(false)} 
        />
    </>
  );
};
