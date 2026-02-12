// src/ui/components/panels/external_audit/LabModeView.tsx

import React, { useState } from "react";
import type { DeviceDTO } from "../../../../shared/dtos/NetworkDTOs";
import type { ExternalAuditScenario } from "../../../../core/logic/externalAuditScenarios";
import { WordlistManagerModal } from "./WordlistManagerModal";

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
  scenarios: ExternalAuditScenario[];
  selectedId: string;
  onSelect: (id: string) => void;
  targetDevice: DeviceDTO | null;
  selectedScenario: ExternalAuditScenario | null;
  isRunning: boolean;
  onRun: () => void;
  onCancel: () => void;
  onClear: () => void;
}

export const LabModeView: React.FC<LabModeViewProps> = ({ scenarios, selectedId, onSelect, targetDevice, selectedScenario, isRunning, onRun, onCancel, onClear }) => {
  // ESTADO PARA EL MODAL DE DICCIONARIO
  const [showWordlist, setShowWordlist] = useState(false);

  return (
    <>
        <div style={{ display: "flex", gap: 12, padding: 12, flexShrink: 0 }}>
        <div style={{ flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                <div style={{ color: "#5c7", fontSize: 10, textTransform: "uppercase" }}>Selected Scenario</div>
                {/* BOTÓN PARA ABRIR EL GESTOR (Solo si es un ataque wifi) */}
                {selectedScenario?.category === "WIFI" && (
                    <button 
                        onClick={() => setShowWordlist(true)}
                        style={{ background: "none", border: "none", color: "#00ff88", fontSize: 10, cursor: "pointer", textDecoration: "underline" }}
                    >
                        [MANAGE WORDLIST]
                    </button>
                )}
            </div>
            
            <select value={selectedId} onChange={(e) => onSelect(e.target.value)} style={inputStyle} disabled={isRunning}>
            <option value="">-- SELECT ATTACK VECTOR --</option>
            {scenarios.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
            </select>
            {selectedScenario && (
            <div style={{ marginTop: 8, color: "#8b9", fontSize: 11, lineHeight: 1.4, borderLeft: "2px solid #0f8", paddingLeft: 8 }}>
                {selectedScenario.description}
                <div style={{ marginTop: 4, color: "#0ff" }}>MODE: {selectedScenario.mode}</div>
            </div>
            )}
        </div>
        <div style={{ width: 240, display: "flex", flexDirection: "column", gap: 8 }}>
            <div>
            <div style={{ color: "#5c7", fontSize: 10, marginBottom: 4 }}>TARGET</div>
            <div style={{ ...inputStyle, opacity: 0.8 }}>{targetDevice ? `${targetDevice.ip} (${targetDevice.vendor || "N/A"})` : "NO TARGET"}</div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
            {isRunning ? (
                <button 
                    disabled 
                    style={{ 
                        ...btnStyle(false), 
                        borderColor: "#00e5ff", 
                        color: "#00e5ff", 
                        opacity: 1, 
                        cursor: "wait", 
                        flex: 1 
                    }}
                >
                    <span className="blink">⚠️ RUNNING...</span>
                </button>
            ) : (
                <button onClick={onRun} disabled={!selectedScenario || !targetDevice} style={{ ...btnStyle(!!selectedScenario && !!targetDevice), flex: 1 }}>
                    EXECUTE
                </button>
            )}
            
            <button 
                onClick={onCancel} 
                disabled={!isRunning} 
                style={{ 
                    ...btnStyle(isRunning), 
                    borderColor: isRunning ? "#f55" : "rgba(0,255,136,0.2)", 
                    color: "#f55" 
                }}
            >
                STOP
            </button>
            
            <button onClick={onClear} disabled={isRunning} style={btnStyle(!isRunning)}>CLEAR</button>
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