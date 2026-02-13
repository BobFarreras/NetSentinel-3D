// src/ui/features/device_detail/components/DeviceDetailPanel.tsx
// Panel de detalle de dispositivo: UI de intel/puertos/logs y acciones (audit, jammer, router audit, Attack Lab, Ghost Mode).

import React, { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { DeviceDTO, OpenPortDTO } from "../../../../shared/dtos/NetworkDTOs";
import { HUD_COLORS, HUD_TYPO } from "../../../styles/hudTokens";
import { useDeviceDetailPanelState } from "../hooks/useDeviceDetailPanelState";
import { ConsoleDisplay, ConsolePrompt } from "./details/ConsoleDisplay";
import { PortResults } from "./details/PortResults";

interface Props {
  device: DeviceDTO;
  auditResults: OpenPortDTO[];
  consoleLogs: string[];
  auditing: boolean;
  onAudit: () => void;
  isJammed: boolean;
  isJamPending: boolean;
  onToggleJam: () => void;
  onRouterAudit: (ip: string) => void;
  onOpenLabAudit: (device: DeviceDTO) => void;
}

export const DeviceDetailPanel: React.FC<Props> = ({
  device,
  auditResults,
  consoleLogs,
  auditing,
  isJamPending,
  onAudit,
  isJammed,
  onToggleJam,
  onRouterAudit,
  onOpenLabAudit,
}) => {
  const state = useDeviceDetailPanelState({ device, onRouterAudit, onOpenLabAudit });

  // ESTADO LOCAL DE LOGS
  const [localLogs, setLocalLogs] = useState<string[]>([]);
  
  // ESTADO DEL PROMPT INTERACTIVO
  const [activePrompt, setActivePrompt] = useState<ConsolePrompt | null>(null);
  const [isGhostRunning, setIsGhostRunning] = useState(false);

  const logToConsole = (msg: string, type: "INFO" | "SUCCESS" | "ERROR" | "WARN" = "INFO") => {
    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
    let icon = "🔹";
    if (type === "SUCCESS") icon = "✅";
    if (type === "ERROR") icon = "❌";
    if (type === "WARN") icon = "⚠️";
    setLocalLogs(prev => [...prev, `${timestamp} ${icon} ${msg}`]);
  };

  // 1. INICIAR PROCESO (Solo logs y prompt)
  const initGhostMode = () => {
    const isHost = device.vendor === "NETSENTINEL (HOST)" || device.ip === state.identity?.ip;
    if (!isHost) return;

    // Limpiar logs anteriores si hubiera
    setLocalLogs([]);
    
    logToConsole("GHOST PROTOCOL SEQUENCE INITIATED...", "WARN");
    logToConsole("WARNING: Identity obfuscation requires network adapter restart.", "WARN");
    logToConsole("Connection will be dropped for ~10 seconds.", "WARN");

    // ACTIVAR PROMPT EN CONSOLA
    setActivePrompt({
      type: 'CONFIRM',
      message: "AUTHORIZE MAC ADDRESS RANDOMIZATION?",
      options: ["YES, EXECUTE GHOST MODE", "CANCEL OPERATION"],
      onSelect: (index) => {
        setActivePrompt(null); // Quitar prompt
        if (index === 0) {
          executeGhostSequence(); // EJECUTAR
        } else {
          logToConsole("Operation aborted by user.", "ERROR");
        }
      }
    });
  };

  // 2. EJECUCIÓN REAL (Después de que el usuario elija SI)
  const executeGhostSequence = async () => {
    setIsGhostRunning(true);
    try {
      logToConsole(`Target Interface: ${state.identity?.interfaceName || "Unknown"}`, "INFO");
      logToConsole("Generating cryptographically secure MAC address...", "INFO");
      
      // Invocamos el comando (Esto tarda unos segundos)
      const newMac = await invoke<string>("randomize_mac");
      
      logToConsole(`IDENTITY SWAPPED SUCCESSFULLY!`, "SUCCESS");
      logToConsole(`New Physical Address: ${newMac}`, "SUCCESS");
      logToConsole(`Network restart in progress...`, "WARN");
      
    } catch (e) {
      logToConsole(`OPERATION FAILED.`, "ERROR");
      logToConsole(`Error: ${e}`, "ERROR");
      logToConsole(`Check Administrator privileges.`, "WARN");
    } finally {
      setIsGhostRunning(false);
    }
  };

  const displayLogs = [...consoleLogs, ...localLogs];

  return (
    <>
      <style>
        {`
          @keyframes blink { 0% { opacity: 1; } 50% { opacity: 0; } 100% { opacity: 1; } }
          .blinking-cursor { display: inline-block; width: 8px; height: 14px; background-color: ${HUD_COLORS.accentGreen}; margin-left: 4px; vertical-align: text-bottom; animation: blink 1s step-end infinite; }
          .retro-button { width: 100%; background: #000; color: ${HUD_COLORS.accentGreen}; border: 2px solid ${HUD_COLORS.accentGreen}; padding: 12px; font-family: ${HUD_TYPO.mono}; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; cursor: pointer; transition: all 0.2s; box-shadow: 0 0 5px rgba(0, 255, 0, 0.2); }
          .retro-button:hover:not(:disabled) { background: ${HUD_COLORS.accentGreen}; color: #000; box-shadow: 0 0 15px ${HUD_COLORS.accentGreen}; }
          .retro-button:disabled { border-color: #555; color: #555; cursor: not-allowed; }
          
          .ghost-button { margin-top: 15px; background: rgba(0, 255, 136, 0.05); border: 1px solid #00ff88; color: #00ff88; padding: 12px; font-family: ${HUD_TYPO.mono}; font-weight: 900; cursor: pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); text-transform: uppercase; display: flex; align-items: center; justify-content: center; gap: 10px; }
          .ghost-button:hover { background: #00ff88; color: #000; box-shadow: 0 0 20px rgba(0, 255, 136, 0.4); }
        `}
      </style>

      <div style={{ width: '100%', height: '100%', padding: '25px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>

        <h3 style={{ fontSize: '1.4rem', borderBottom: '2px solid #004400', paddingBottom: 15, marginTop: 0, marginBottom: 20, display: 'flex', justifyContent: 'space-between', color: HUD_COLORS.accentGreen }}>
          <span>DEVICE_INTEL</span>
          <span className="blinking-cursor" style={{ width: '12px', height: '12px', borderRadius: '50%' }}></span>
        </h3>

        {/* INFO BÀSICA */}
        <div style={{ display: 'grid', gap: '8px', marginBottom: '20px', fontSize: '0.9rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ opacity: 0.7 }}>{'>'} IP ADDR:</span>
            <b>{device.ip}</b>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ opacity: 0.7 }}>{'>'} MAC ID:</span>
            <span>{state.normalizedMac}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ opacity: 0.7 }}>{'>'} NAME:</span>
            <span style={{ color: '#fff', maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={state.resolvedName}>{state.resolvedName}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ opacity: 0.7 }}>{'>'} VENDOR:</span>
            <span style={{ color: '#adff2f', maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={device.vendor}>{device.vendor}</span>
          </div>
        </div>

        {/* CONTROLS */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
          <button onClick={onAudit} disabled={auditing} className="retro-button" style={{ flex: 1 }}>{auditing ? 'SCANNING...' : 'DEEP AUDIT'}</button>
          <button onClick={state.handleOpenLabAudit} className="retro-button" style={{ flex: 1, borderColor: '#00e5ff', color: '#00e5ff', background: 'transparent' }}>🧪 LAB AUDIT</button>
          <button onClick={onToggleJam} disabled={isJamPending} className="retro-button" style={{ flex: 1, borderColor: isJammed || isJamPending ? '#ff0000' : '#550000', color: isJammed || isJamPending ? '#fff' : '#ff5555', background: isJammed || isJamPending ? '#ff0000' : 'transparent', animation: isJammed ? 'blink 0.5s infinite' : 'none' }}>
            {isJamPending ? (isJammed ? '⚫ STOP' : '⏳ JAM...') : (isJammed ? '⚫ STOP' : '☠ KILL NET')}
          </button>
        </div>

        {/* BOTÓN GHOST MODE */}
        {(device.vendor === "NETSENTINEL (HOST)" || device.ip === state.identity?.ip) && (
           <button onClick={initGhostMode} className="ghost-button" disabled={isGhostRunning || activePrompt !== null}>
              <span>👻</span> {isGhostRunning ? "ACTIVATING..." : "ENABLE GHOST MODE"}
           </button>
        )}

        {device.isGateway && (
          <button onClick={state.handleRouterAudit} style={{ width: '100%', background: '#aa0000', color: 'white', border: '2px solid red', padding: '10px', marginTop: '10px', fontFamily: HUD_TYPO.mono, fontWeight: 'bold', cursor: 'pointer' }}>☠️ AUDIT GATEWAY SECURITY</button>
        )}

        {/* CONSOLA INTERACTIVA */}
        <div style={{ margin: '15px 0' }}>
            <ConsoleDisplay 
                logs={displayLogs} 
                isBusy={isGhostRunning} 
                prompt={activePrompt} // <--- Pasamos el prompt activo
            />
        </div>

        <PortResults results={auditResults} isAuditing={auditing} hasLogs={consoleLogs.length > 0} />
      </div>
    </>
  );
};
