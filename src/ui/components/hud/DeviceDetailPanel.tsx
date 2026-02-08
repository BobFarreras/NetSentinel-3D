import React from 'react';
import { DeviceDTO, OpenPortDTO } from '../../../shared/dtos/NetworkDTOs';
import { ConsoleDisplay } from './details/ConsoleDisplay'; // 👈 Ajusta la ruta segons on ho guardis
import { PortResults } from './details/PortResults';       // 👈 Ajusta la ruta

interface Props {
  device: DeviceDTO;
  auditResults: OpenPortDTO[];
  consoleLogs: string[];
  auditing: boolean;
  onAudit: () => void;
  isJammed: boolean;
  onToggleJam: () => void;
  onRouterAudit: (ip: string) => void;
}

export const DeviceDetailPanel: React.FC<Props> = ({
  device, auditResults, consoleLogs, auditing, onAudit, isJammed, onToggleJam, onRouterAudit
}) => {
  return (
    <>
      {/* GLOBAL STYLES (Theme) */}
      <style>
        {`
          @keyframes blink { 0% { opacity: 1; } 50% { opacity: 0; } 100% { opacity: 1; } }
          .blinking-cursor { 
            display: inline-block; width: 8px; height: 14px; background-color: #0f0;
            margin-left: 4px; vertical-align: text-bottom; animation: blink 1s step-end infinite;
          }
          .retro-button {
            width: 100%; background: #000; color: #0f0; border: 2px solid #0f0;
            padding: 12px; font-family: 'Consolas', monospace; font-weight: bold;
            text-transform: uppercase; letter-spacing: 2px; cursor: pointer;
            transition: all 0.2s; box-shadow: 0 0 5px rgba(0, 255, 0, 0.2);
          }
          .retro-button:hover:not(:disabled) { background: #0f0; color: #000; box-shadow: 0 0 15px #0f0; }
          .retro-button:disabled { border-color: #555; color: #555; cursor: not-allowed; }
          .crt-screen {
            background: rgba(0, 10, 0, 0.95); border: 1px solid #0f0;
            box-shadow: 0 0 20px rgba(0, 255, 0, 0.2);
            background-image: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06));
            background-size: 100% 2px, 3px 100%;
          }
        `}
      </style>

      <div className="crt-screen" style={{
        position: 'absolute', top: 20, right: 20, width: '340px',
        padding: '20px', color: '#0f0', fontFamily: 'Consolas, monospace', zIndex: 10
      }}>

        {/* HEADER */}
        <h3 style={{ borderBottom: '2px solid #004400', paddingBottom: 10, marginTop: 0, display: 'flex', justifyContent: 'space-between' }}>
          <span>TARGET_ANALYSIS</span>
          <span className="blinking-cursor" style={{ width: '10px', height: '10px', borderRadius: '50%' }}></span>
        </h3>

        {/* INFO */}
        <div style={{ display: 'grid', gap: '8px', marginBottom: '20px', fontSize: '0.9rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ opacity: 0.7 }}>{'>'} IP ADDR:</span> <b>{device.ip}</b></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ opacity: 0.7 }}>{'>'} MAC ID:</span> <span>{device.mac.toUpperCase()}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ opacity: 0.7 }}>{'>'} VENDOR:</span> <span style={{ color: '#adff2f' }}>{device.vendor.substring(0, 20)}</span></div>
        </div>

        {/* CONTROLS */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
          <button onClick={onAudit} disabled={auditing} className="retro-button" style={{ flex: 1 }}>
            {auditing ? 'SCANNING...' : 'DEEP AUDIT'}
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
        {/* Només mostrar si és el Gateway */}
        {/* 👇 AQUI ESTAVA L'ERROR: Ara fem servir la Prop 'onRouterAudit' */}
        {device.isGateway && (
          <button
            onClick={() => onRouterAudit(device.ip)}
            style={{ width: '100%', background: '#aa0000', color: 'white', border: '2px solid red', padding: '10px', marginTop: '10px', fontFamily: 'Consolas', fontWeight: 'bold', cursor: 'pointer' }}
          >
            ☠️ AUDIT GATEWAY SECURITY
          </button>
        )}
        {/* 👇 COMPONENT 1: TERMINAL */}
        <ConsoleDisplay logs={consoleLogs} isBusy={auditing} />

        {/* 👇 COMPONENT 2: RESULTATS */}
        <PortResults
          results={auditResults}
          isAuditing={auditing}
          hasLogs={consoleLogs.length > 0}
        />

      </div>
    </>
  );
};