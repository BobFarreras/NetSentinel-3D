import { useState, useRef, useEffect, useCallback } from 'react';
import { TopBar } from './ui/components/layout/TopBar';
import { NetworkScene } from './ui/components/3d/NetworkScene';
import { DeviceDetailPanel } from './ui/components/hud/DeviceDetailPanel';
import { HistoryPanel } from './ui/components/hud/HistoryPanel';
import { ConsoleLogs } from './ui/components/panels/ConsoleLogs';
import { useNetworkManager } from './ui/hooks/useNetworkManager';
import { DangerModal } from './ui/components/DangerModal';

function App() {
  const {
    devices, selectedDevice, scanning, auditing,
    auditResults, consoleLogs,
    startScan, startAudit, selectDevice, loadSession, jammedDevices,
    toggleJammer, checkRouterSecurity, dismissRisk, routerRisk,
    intruders, identity
  } = useNetworkManager();

  const [showHistory, setShowHistory] = useState(false);

  // --- ESTATS DE MIDA (RESIZABLE) ---
  const [sidebarWidth, setSidebarWidth] = useState(450); // Amplada inicial Sidebar
  const [consoleHeight, setConsoleHeight] = useState(250); // Alçada inicial Consola
  
  // Refs per gestionar l'arrossegament sense lag
  const isResizingSidebar = useRef(false);
  const isResizingConsole = useRef(false);

  // --- GESTIÓ DEL RESIZE ---
  const startResizingSidebar = useCallback(() => { isResizingSidebar.current = true; }, []);
  const startResizingConsole = useCallback(() => { isResizingConsole.current = true; }, []);

  const stopResizing = useCallback(() => {
    isResizingSidebar.current = false;
    isResizingConsole.current = false;
    document.body.style.cursor = 'default'; // Restaurar cursor
  }, []);

  const resize = useCallback((e: MouseEvent) => {
    if (isResizingSidebar.current) {
      // Calculem la nova amplada (des de la dreta)
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth > 300 && newWidth < 800) { // Límits mínim i màxim
        setSidebarWidth(newWidth);
        document.body.style.cursor = 'col-resize';
      }
    }
    if (isResizingConsole.current) {
      // Calculem la nova alçada (des de baix)
      const newHeight = window.innerHeight - e.clientY;
      if (newHeight > 100 && newHeight < window.innerHeight - 100) { // Límits
        setConsoleHeight(newHeight);
        document.body.style.cursor = 'row-resize';
      }
    }
  }, []);

  // Listeners globals per al ratolí
  useEffect(() => {
    window.addEventListener('mousemove', resize);
    window.addEventListener('mouseup', stopResizing);
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [resize, stopResizing]);

  return (
    // CONTENIDOR PRINCIPAL
    <div style={{
      display: 'flex',
      width: '100vw',
      height: '100vh',
      background: '#050505',
      color: '#0f0',
      overflow: 'hidden',
      fontFamily: "'Consolas', 'Courier New', monospace",
      fontSize: '16px',
      userSelect: (isResizingSidebar.current || isResizingConsole.current) ? 'none' : 'auto' // Evitar seleccionar text mentre arrosseguem
    }}>

      {/* 🚨 MODAL */}
      <DangerModal result={routerRisk} onClose={dismissRisk} />

      {/* =================================================================================
          COLUMNA ESQUERRA: TOPBAR + MAPA + CONSOLA (FLEX 1)
         ================================================================================= */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        height: '100%',
        minWidth: 0,
        overflow: 'hidden'
      }}>

        {/* 1. BARRA SUPERIOR */}
        <TopBar
          scanning={scanning}
          activeNodes={devices.length}
          onScan={startScan}
          onHistoryToggle={() => setShowHistory(!showHistory)}
          showHistory={showHistory}
          identity={identity}
        />

        {/* 2. MAPA 3D (Ocupa l'espai restant) */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          {showHistory && (
            <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 20 }}>
              <HistoryPanel
                onClose={() => setShowHistory(false)}
                onLoadSession={(oldDevices) => { loadSession(oldDevices); setShowHistory(false); }}
              />
            </div>
          )}

          <NetworkScene
            devices={devices}
            onDeviceSelect={selectDevice}
            selectedIp={selectedDevice?.ip}
            intruders={intruders}
          />
        </div>

        {/* 🤏 RESIZER HORITZONTAL (Barra verda per arrossegar la consola) */}
        <div 
            onMouseDown={startResizingConsole}
            style={{
                height: '2px',
                background: '#004400',
                cursor: 'row-resize',
                zIndex: 15,
                transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#00ff00'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#004400'}
        />

        {/* 3. CONSOLA / SNIFFER - ALÇADA DINÀMICA */}
        <div style={{ 
            height: `${consoleHeight}px`, 
            zIndex: 10,
            boxShadow: '0 -5px 20px rgba(0,0,0,0.5)',
            background: '#000'
        }}>
            <ConsoleLogs logs={consoleLogs} devices={devices}/>
        </div>

      </div>

      {/* 🤏 RESIZER VERTICAL (Barra lateral per arrossegar el sidebar) */}
      <div 
        onMouseDown={startResizingSidebar}
        style={{
            width: '2px',
            background: '#004400',
            cursor: 'col-resize',
            zIndex: 40,
            transition: 'background 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = '#00ff00'}
        onMouseLeave={(e) => e.currentTarget.style.background = '#004400'}
      />

      {/* =================================================================================
          COLUMNA DRETA: SIDEBAR (AMPLADA DINÀMICA)
         ================================================================================= */}
      <div style={{
        width: `${sidebarWidth}px`, 
        minWidth: '300px',
        flexShrink: 0,
        height: '100vh',
        background: '#020202',
        // borderLeft: '2px solid #004400', // Ja no cal, fem servir el resizer com a vora
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '-10px 0 30px rgba(0, 50, 0, 0.2)',
        position: 'relative',
        zIndex: 30
      }}>

        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'linear-gradient(rgba(0, 20, 0, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 20, 0, 0.1) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
          opacity: 0.3
        }}></div>

        {selectedDevice ? (
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <DeviceDetailPanel
              device={selectedDevice}
              auditResults={auditResults}
              consoleLogs={consoleLogs}
              auditing={auditing}
              onAudit={() => startAudit(selectedDevice.ip)}
              isJammed={jammedDevices.includes(selectedDevice.ip)}
              onToggleJam={() => toggleJammer(selectedDevice.ip)}
              onRouterAudit={checkRouterSecurity}
            />
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: '#004400', textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: '5rem', marginBottom: 20, opacity: 0.3, textShadow: '0 0 20px #0f0' }}>⌖</div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: 10, color: '#0f0' }}>AWAITING TARGET</h3>
            <p style={{ fontSize: '1rem', opacity: 0.7 }}>SELECT A NODE FROM THE NETWORK GRID</p>
          </div>
        )}
      </div>

    </div>
  );
}

export default App;