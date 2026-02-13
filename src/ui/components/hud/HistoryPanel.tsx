// src/ui/components/hud/HistoryPanel.tsx
// Panel legacy de historial: lista sesiones guardadas y permite cargar snapshots de dispositivos desde el backend.

import React, { useEffect, useState } from 'react';
import { networkAdapter } from '../../../adapters/networkAdapter';
import { DeviceDTO, ScanSession } from '../../../shared/dtos/NetworkDTOs';
import { uiLogger } from '../../utils/logger';

interface HistoryPanelProps {
  onLoadSession: (devices: DeviceDTO[]) => void;
  onClose: () => void;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({ onLoadSession, onClose }) => {
  const [sessions, setSessions] = useState<ScanSession[]>([]);

  useEffect(() => {
    // Consulta real al backend Rust para recuperar sesiones persistidas.
    networkAdapter.getHistory()
        .then((data) => setSessions(data))
        .catch((error) => uiLogger.error("Error cargando historial", error));
  }, []);

  return (
    <div style={{
      position: 'absolute', top: '80px', left: '20px', width: '300px',
      background: 'rgba(0, 10, 0, 0.95)', border: '1px solid #00ff00',
      padding: '15px', color: '#00ff00', fontFamily: 'monospace', zIndex: 20,
      boxShadow: '0 0 15px rgba(0, 255, 0, 0.2)'
    }}>
      <h3 style={{ margin: '0 0 10px 0', borderBottom: '1px solid #004400' }}>
        📂 LOG ARCHIVES
      </h3>
      <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
        {sessions.map((session, idx) => (
          <div key={idx} style={{ marginBottom: '10px', padding: '5px', border: '1px solid #003300' }}>
            <div style={{ fontWeight: 'bold', color: '#ccffcc' }}>
              {new Date(session.timestamp).toLocaleString()}
            </div>
            <div style={{ fontSize: '0.8em' }}>DEVICES: {session.devices.length}</div>
            
            <button 
              onClick={() => onLoadSession(session.devices)}
              style={{
                marginTop: '5px', background: '#003300', color: '#0f0', 
                border: '1px solid #0f0', cursor: 'pointer', width: '100%',
                padding: '5px', fontFamily: 'monospace'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = '#005500'}
              onMouseOut={(e) => e.currentTarget.style.background = '#003300'}
            >
              [ LOAD SNAPSHOT ]
            </button>
          </div>
        ))}
        {sessions.length === 0 && <div>NO RECORDS FOUND (RUST DB)</div>}
      </div>
      <button 
        onClick={onClose} 
        style={{ 
          marginTop: '15px', background: '#330000', color: '#ff5555', 
          border: '1px solid red', width: '100%', padding: '5px', cursor: 'pointer',
          fontFamily: 'monospace'
        }}
      >
        [ CLOSE ARCHIVES ]
      </button>
    </div>
  );
};
