import React from 'react';
import { HostIdentity } from '../../../shared/dtos/NetworkDTOs';
interface TopBarProps {
  scanning: boolean;
  activeNodes: number;
  onScan: () => void;
  onHistoryToggle: () => void;
  onRadarToggle: () => void;
  onExternalAuditToggle: () => void;
  showHistory: boolean;
  showRadar: boolean;
  showExternalAudit: boolean;
  identity: HostIdentity | null;
}

export const TopBar: React.FC<TopBarProps> = ({ 
  scanning, activeNodes, onScan, onHistoryToggle, onRadarToggle, onExternalAuditToggle, showHistory, showRadar, showExternalAudit, identity
}) => {
  return (
    <div style={{
      height: '50px', // ⬇️ Més petit (era 60px)
      background: '#020202',
      borderBottom: '1px solid #004400', // Vora més fina
      display: 'flex',
      alignItems: 'center',
      padding: '0 15px',
      justifyContent: 'space-between',
      boxShadow: '0 5px 15px rgba(0, 255, 0, 0.02)',
      zIndex: 50,
      userSelect: 'none' // Evita seleccionar text per error
    }}>
      {/* Izquierda: logo e identidad */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <h2 style={{ 
          margin: 0, 
          fontSize: '1.2rem', // ⬇️ Més discret
          letterSpacing: '1px', 
          color: '#0f0',
          textShadow: '0 0 5px rgba(0,255,0,0.5)',
          whiteSpace: 'nowrap' // No trencar línia
        }}>
          NETSENTINEL 
        </h2>

        {/* Identidad local */}
        {identity && (
          <div style={{ 
            display: 'flex', gap: '15px', fontSize: '0.85rem', fontFamily: 'monospace',
            borderLeft: '1px solid #004400', paddingLeft: '15px', color: '#88ff88'
          }}>
            <span title="Local IP">
              IP: <b style={{ color: '#fff' }}>{identity.ip}</b>
            </span>
            <span title="Interface Name" style={{ opacity: 0.7 }}>
              [{identity.interfaceName}]
            </span>
            {/* Gateway */}
            <span title="Gateway" style={{ opacity: 0.5 }}>
              GW: {identity.gatewayIp}
            </span>
          </div>
        )}
      </div>

      {/* Centro: controles */}
      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          onClick={() => onScan()}
          disabled={scanning}
          style={{
            background: scanning ? '#002200' : '#003300',
            color: scanning ? '#005500' : '#0f0',
            border: '1px solid #0f0', 
            borderRadius: '2px', // Cantons lleugerament arrodonits (estil xip)
            padding: '6px 16px', // ⬇️ Botó més compacte
            fontSize: '0.9rem', 
            fontWeight: 'bold',
            cursor: scanning ? 'wait' : 'pointer',
            transition: 'all 0.2s',
            fontFamily: 'inherit',
            minWidth: '120px'
          }}
        >
          {scanning ? 'SCANNING...' : 'SCAN NET'}
        </button>

        <button
          onClick={onHistoryToggle}
          style={{
            background: showHistory ? '#004400' : 'transparent',
            color: '#0f0',
            border: '1px solid #008800', 
            borderRadius: '2px',
            padding: '6px 16px', // ⬇️ Botó més compacte
            fontSize: '0.9rem',
            cursor: 'pointer',
            transition: 'all 0.2s',
            fontFamily: 'inherit'
          }}
        >
          {showHistory ? 'HIDE LOGS' : 'HISTORY'}
        </button>

        <button
          onClick={onRadarToggle}
          style={{
            background: showRadar ? '#003320' : 'transparent',
            color: showRadar ? '#00ff88' : '#66ffcc',
            border: `1px solid ${showRadar ? '#00ff88' : '#006644'}`,
            borderRadius: '2px',
            padding: '6px 16px',
            fontSize: '0.9rem',
            cursor: 'pointer',
            transition: 'all 0.2s',
            fontFamily: 'inherit'
          }}
        >
          {showRadar ? 'HIDE RADAR' : 'RADAR'}
        </button>

        <button
          onClick={onExternalAuditToggle}
          style={{
            background: showExternalAudit ? '#00202a' : 'transparent',
            color: showExternalAudit ? '#00e5ff' : '#77e8ff',
            border: `1px solid ${showExternalAudit ? '#00e5ff' : '#003a45'}`,
            borderRadius: '2px',
            padding: '6px 16px',
            fontSize: '0.9rem',
            cursor: 'pointer',
            transition: 'all 0.2s',
            fontFamily: 'inherit'
          }}
        >
          {showExternalAudit ? 'HIDE AUDIT' : 'EXT AUDIT'}
        </button>
      </div>

      {/* Derecha: estado */}
      <div style={{ 
        fontSize: '0.9rem', 
        color: '#88ff88', 
        fontFamily: 'monospace',
        borderLeft: '1px solid #004400',
        paddingLeft: '15px',
        whiteSpace: 'nowrap'
      }}>
        NODES: <b style={{ color: '#fff' }}>{activeNodes}</b>
      </div>
    </div>
  );
};
