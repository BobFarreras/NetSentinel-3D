import { useState } from 'react';
// 👇 Fixa't que ara importem des de "./ui/..."
import { NetworkScene } from './ui/components/3d/NetworkScene';
import { DeviceDetailPanel } from './ui/components/hud/DeviceDetailPanel';
import { HistoryPanel } from './ui/components/hud/HistoryPanel';
import { useNetworkManager } from './ui/hooks/useNetworkManager';
import { DangerModal } from './ui/components/DangerModal';

function App() {
  // 1. Invoquem el nostre Hook de lògica (Connectat a Rust)
  const {
    devices, selectedDevice, scanning, auditing,
    auditResults, consoleLogs,
    startScan, startAudit, selectDevice, loadSession, jammedDevices,
    // 👇 AFEGIT: 'routerRisk' AQUI (Abans te'l deixaves)
    toggleJammer, checkRouterSecurity, dismissRisk, routerRisk 
  } = useNetworkManager();

  // 2. Estat local per la UI
  const [showHistory, setShowHistory] = useState(false);

  // Suposem que el router és la IP acabada en .1
  const gatewayIp = devices.find(d => d.ip.endsWith('.1'))?.ip || '192.168.1.1';

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', background: '#000' }}>
      
      {/* 🛑 LAYER DE PERILL (Z-INDEX SUPERIOR) */}
      {/* Ara routerRisk ja existeix i funcionarà */}
      <DangerModal result={routerRisk} onClose={dismissRisk} />

      {/* 1. HUD ESQUERRE */}
      <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 10 }}>

        <h2 style={{ color: '#0f0', fontFamily: 'monospace', margin: '0 0 10px 0', textShadow: '0 0 5px #0f0' }}>
          NETSENTINEL /// RUST_CORE
        </h2>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={startScan}
            disabled={scanning}
            style={{
              background: scanning ? '#002200' : 'rgba(0, 20, 0, 0.9)',
              color: scanning ? '#005500' : '#0f0',
              border: '1px solid #0f0', padding: '10px 20px',
              fontFamily: 'monospace', fontSize: '1rem', cursor: scanning ? 'wait' : 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {scanning ? '[ SCANNING... ]' : '[ INITIATE SCAN ]'}
          </button>

          <button
            onClick={() => setShowHistory(!showHistory)}
            style={{
              background: showHistory ? '#004400' : 'rgba(0, 20, 0, 0.9)',
              color: '#0f0',
              border: '1px solid #0f0', padding: '10px 15px',
              fontFamily: 'monospace', fontSize: '1rem', cursor: 'pointer',
            }}
          >
            {showHistory ? '[ HIDE LOGS ]' : '[ HISTORY ]'}
          </button>
        </div>

        <div style={{ color: '#0f0', fontFamily: 'monospace', marginTop: 10 }}>
          NODES DETECTED: {devices.length}
        </div>
      </div>

      {/* PANELL HISTORIAL */}
      {showHistory && (
        <HistoryPanel
          onClose={() => setShowHistory(false)}
          onLoadSession={(oldDevices) => {
            loadSession(oldDevices);
            setShowHistory(false);
          }}
        />
      )}

      {/* 2. HUD DRET (DETALLS) */}
      {selectedDevice && (
        <DeviceDetailPanel
          device={selectedDevice}
          auditResults={auditResults}
          consoleLogs={consoleLogs}
          auditing={auditing}
          onAudit={() => startAudit(selectedDevice.ip)}
          isJammed={jammedDevices.includes(selectedDevice.ip)}
          onToggleJam={() => toggleJammer(selectedDevice.ip, gatewayIp)}
          onRouterAudit={checkRouterSecurity}
        />
      )}

      {/* 3. ESCENA 3D */}
      <NetworkScene
        devices={devices}
        onDeviceSelect={selectDevice}
        selectedIp={selectedDevice?.ip}
      />
    </div>
  );
}

export default App;