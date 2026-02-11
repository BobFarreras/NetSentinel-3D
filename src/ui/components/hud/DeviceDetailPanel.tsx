import React from "react";
import { DeviceDTO, OpenPortDTO } from "../../../shared/dtos/NetworkDTOs";
import { useDeviceDetailPanelState } from "../../hooks/modules/ui/useDeviceDetailPanelState";
import { HUD_COLORS, HUD_TYPO } from "../../styles/hudTokens";
import { ConsoleDisplay } from "./details/ConsoleDisplay";
import { PortResults } from "./details/PortResults";

interface Props {
  device: DeviceDTO;
  auditResults: OpenPortDTO[];
  consoleLogs: string[];
  auditing: boolean;
  onAudit: () => void;
  isJammed: boolean;
  onToggleJam: () => void;
  onRouterAudit: (ip: string) => void;
  onOpenLabAudit: (device: DeviceDTO) => void;
}

export const DeviceDetailPanel: React.FC<Props> = ({
  device, auditResults, consoleLogs, auditing, onAudit, isJammed, onToggleJam, onRouterAudit, onOpenLabAudit
}) => {
  const state = useDeviceDetailPanelState({ device, onRouterAudit, onOpenLabAudit });

  return (
    <>
      {/* GLOBAL STYLES */}
      <style>
        {`
          @keyframes blink { 0% { opacity: 1; } 50% { opacity: 0; } 100% { opacity: 1; } }
          .blinking-cursor { 
            display: inline-block; width: 8px; height: 14px; background-color: ${HUD_COLORS.accentGreen};
            margin-left: 4px; vertical-align: text-bottom; animation: blink 1s step-end infinite;
          }
          .retro-button {
            width: 100%; background: #000; color: ${HUD_COLORS.accentGreen}; border: 2px solid ${HUD_COLORS.accentGreen};
            padding: 12px; font-family: ${HUD_TYPO.mono}; font-weight: bold;
            text-transform: uppercase; letter-spacing: 2px; cursor: pointer;
            transition: all 0.2s; box-shadow: 0 0 5px rgba(0, 255, 0, 0.2);
          }
          .retro-button:hover:not(:disabled) { background: ${HUD_COLORS.accentGreen}; color: #000; box-shadow: 0 0 15px ${HUD_COLORS.accentGreen}; }
          .retro-button:disabled { border-color: #555; color: #555; cursor: not-allowed; }
          .crt-screen {
            background: rgba(0, 10, 0, 0.95); border: 1px solid ${HUD_COLORS.accentGreen};
            box-shadow: 0 0 20px rgba(0, 255, 0, 0.2);
            background-image: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06));
            background-size: 100% 2px, 3px 100%;
          }
        `}
      </style>

      {/* Contenedor principal: ocupa el 100% del panel lateral (sidebar) y hace scroll si hace falta. */}
      <div style={{
        width: '100%',
        height: '100%',
        padding: '25px', // Padding intern
        boxSizing: 'border-box', // Important perquè el padding no sumi al width
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto' // Scroll només si cal
      }}>

        {/* HEADER */}
        <h3 style={{
          fontSize: '1.4rem',
          borderBottom: '2px solid #004400',
          paddingBottom: 15,
          marginTop: 0,
          marginBottom: 20,
          display: 'flex',
          justifyContent: 'space-between',
          color: HUD_COLORS.accentGreen
        }}>
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
            <span
              style={{
                color: '#fff',
                maxWidth: 240,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              title={state.resolvedName}
            >
              {state.resolvedName}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ opacity: 0.7 }}>{'>'} VENDOR:</span>
            <span
              style={{
                color: '#adff2f',
                maxWidth: 240,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              title={device.vendor}
            >
              {device.vendor}
            </span>
          </div>

          {/* 👇 SECCIÓ WIFI (MAGENTA) 👇 */}
          {state.hasWifiSection && (
            <>
              <div style={{ borderBottom: '1px dashed #004400', margin: '5px 0' }}></div>

              {device.wifi_band && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ opacity: 0.7 }}>{'>'} FREQUENCY:</span>
                  <span style={{ color: '#ff00ff' }}>{device.wifi_band}</span>
                </div>
              )}

              {device.signal_strength && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ opacity: 0.7 }}>{'>'} SIGNAL:</span>
                  <span style={{ color: state.getSignalColor(device.signal_strength) }}>
                    {device.signal_strength}
                  </span>
                </div>
              )}

              {device.signal_rate && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ opacity: 0.7 }}>{'>'} SPEED:</span>
                  <span>{device.signal_rate}</span>
                </div>
              )}
            </>
          )}

        </div>

        {/* CONTROLS */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
          <button onClick={onAudit} disabled={auditing} className="retro-button" style={{ flex: 1 }}>
            {auditing ? 'SCANNING...' : 'DEEP AUDIT'}
          </button>

          <button
            onClick={state.handleOpenLabAudit}
            className="retro-button"
            style={{
              flex: 1,
              borderColor: '#00e5ff',
              color: '#00e5ff',
              background: 'transparent',
              boxShadow: '0 0 10px rgba(0,229,255,0.12)',
            }}
          >
            🧪 LAB AUDIT
          </button>

          <button onClick={onToggleJam} className="retro-button"
            style={{
              flex: 1,
              borderColor: isJammed ? '#ff0000' : '#550000',
              color: isJammed ? '#fff' : '#ff5555',
              background: isJammed ? '#ff0000' : 'transparent',
              boxShadow: isJammed ? '0 0 15px #ff0000' : 'none',
              animation: isJammed ? 'blink 0.5s infinite' : 'none'
            }}
          >
            {isJammed ? '⚫ DISCONNECTING' : '☠ KILL NET'}
          </button>
        </div>

        <div style={{ fontSize: '0.78rem', opacity: 0.75, lineHeight: 1.35, marginBottom: 14 }}>
          <div style={{ color: '#00e5ff', fontWeight: 900, marginBottom: 4 }}>LAB AUDIT (educativo)</div>
          <div>
            Ejecuta diagnosticos y simulaciones controladas sobre el dispositivo seleccionado (sin bloquear la UI).
            Si hay herramientas externas instaladas, puede orquestarlas y mostrar logs en tiempo real.
          </div>
        </div>

        {/* BOTÓ ROUTER (Només si és Gateway) */}
        {device.isGateway && (
          <button
            onClick={state.handleRouterAudit}
            style={{ width: '100%', background: '#aa0000', color: 'white', border: '2px solid red', padding: '10px', marginTop: '10px', fontFamily: HUD_TYPO.mono, fontWeight: 'bold', cursor: 'pointer' }}
          >
            ☠️ AUDIT GATEWAY SECURITY
          </button>
        )}

        {/* COMPONENT 1: TERMINAL */}
        <ConsoleDisplay logs={consoleLogs} />

        {/* COMPONENT 2: RESULTATS */}
        <PortResults
          results={auditResults}
          isAuditing={auditing}
          hasLogs={consoleLogs.length > 0}
        />

      </div>
    </>
  );
};
