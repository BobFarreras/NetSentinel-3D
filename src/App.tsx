import { useState, useRef, useEffect, useCallback } from 'react';
import { TopBar } from './ui/components/layout/TopBar';
import { NetworkScene } from './ui/components/3d/NetworkScene';
import { DeviceDetailPanel } from './ui/components/hud/DeviceDetailPanel';
import { HistoryPanel } from './ui/components/hud/HistoryPanel';
import { RadarPanel } from './ui/components/hud/RadarPanel';
import { ConsoleLogs } from './ui/components/panels/ConsoleLogs';
import { useNetworkManager } from './ui/hooks/useNetworkManager';
import { DangerModal } from './ui/components/DangerModal';

function App() {
  const {
    devices, selectedDevice, scanning, auditing,
    auditResults, consoleLogs,
    startScan, startAudit, selectDevice, loadSession, jammedDevices,
    toggleJammer, checkRouterSecurity, dismissRisk, routerRisk,
    clearLogs,
    intruders, identity
  } = useNetworkManager();

  const [showHistory, setShowHistory] = useState(false);
  const [showRadar, setShowRadar] = useState(false);

  // --- ESTADOS DE TAMAÑO (RESIZABLE) ---
  const [sidebarWidth, setSidebarWidth] = useState(450); // Amplada inicial Sidebar
  const [consoleHeight, setConsoleHeight] = useState(250); // Alçada inicial Consola
  const [radarWidth, setRadarWidth] = useState(520); // Anchura inicial del radar (panel izquierdo)

  // Refs para gestionar el arrastre sin lag
  const resizeMode = useRef<null | 'sidebar' | 'console' | 'radar'>(null);
  const dragStartX = useRef(0);
  const dragStartY = useRef(0);
  const startSidebarWidth = useRef(450);
  const startConsoleHeight = useRef(250);
  const startRadarWidth = useRef(520);

  // --- GESTION DEL RESIZE ---
  const startResizingSidebar = useCallback((e: React.MouseEvent) => {
    resizeMode.current = 'sidebar';
    dragStartX.current = e.clientX;
    startSidebarWidth.current = sidebarWidth;
  }, [sidebarWidth]);

  const startResizingConsole = useCallback((e: React.MouseEvent) => {
    resizeMode.current = 'console';
    dragStartY.current = e.clientY;
    startConsoleHeight.current = consoleHeight;
  }, [consoleHeight]);

  const startResizingRadar = useCallback((e: React.MouseEvent) => {
    resizeMode.current = 'radar';
    dragStartX.current = e.clientX;
    startRadarWidth.current = radarWidth;
  }, [radarWidth]);

  const stopResizing = useCallback(() => {
    resizeMode.current = null;
    document.body.style.cursor = 'default'; // Restaurar cursor
  }, []);

  const resize = useCallback((e: MouseEvent) => {
    if (resizeMode.current === 'sidebar') {
      // Arrastrar hacia la izquierda aumenta la anchura del sidebar.
      const delta = dragStartX.current - e.clientX;
      const next = Math.max(300, Math.min(800, startSidebarWidth.current + delta));
      setSidebarWidth(next);
      document.body.style.cursor = 'col-resize';
      return;
    }

    if (resizeMode.current === 'console') {
      // Resizer entre panel superior y consola: mover hacia arriba aumenta altura.
      const delta = dragStartY.current - e.clientY;
      const next = Math.max(120, Math.min(window.innerHeight - 160, startConsoleHeight.current + delta));
      setConsoleHeight(next);
      document.body.style.cursor = 'row-resize';
      return;
    }

    if (resizeMode.current === 'radar') {
      // Resizer entre radar (izquierda) y escena (derecha): mover hacia la derecha aumenta anchura.
      const delta = e.clientX - dragStartX.current;
      const next = Math.max(360, Math.min(820, startRadarWidth.current + delta));
      setRadarWidth(next);
      document.body.style.cursor = 'col-resize';
    }
  }, [setSidebarWidth, setConsoleHeight, setRadarWidth]);

  // Listeners globales de raton
  useEffect(() => {
    window.addEventListener('mousemove', resize);
    window.addEventListener('mouseup', stopResizing);
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [resize, stopResizing]);

  return (
    // Contenedor principal
    <div style={{
      display: 'flex',
      width: '100vw',
      height: '100vh',
      background: '#050505',
      color: '#0f0',
      overflow: 'hidden',
      fontFamily: "'Consolas', 'Courier New', monospace",
      fontSize: '16px',
      userSelect: (resizeMode.current !== null) ? 'none' : 'auto' // Evitar seleccionar texto mientras se arrastra
    }}>

      {/* Modal de riesgo */}
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

        {/* 1. Barra superior */}
        <TopBar
          scanning={scanning}
          activeNodes={devices.length}
          onScan={startScan}
          onHistoryToggle={() => setShowHistory(!showHistory)}
          showHistory={showHistory}
          onRadarToggle={() => setShowRadar(!showRadar)}
          showRadar={showRadar}
          identity={identity}
        />

        {/* 2. Zona superior: Radar (izquierda) + Mapa 3D (centro) */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden', minHeight: 0 }}>
          {showHistory && (
            <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 20 }}>
              <HistoryPanel
                onClose={() => setShowHistory(false)}
                onLoadSession={(oldDevices) => { loadSession(oldDevices); setShowHistory(false); }}
              />
            </div>
          )}

          <div style={{ position: 'absolute', inset: 0, display: 'flex', minHeight: 0 }}>
            {showRadar && (
              <>
                <div style={{ width: `${radarWidth}px`, minWidth: 360, maxWidth: 820, minHeight: 0, background: '#000', overflow: 'hidden', zIndex: 12 }}>
                  <RadarPanel onClose={() => setShowRadar(false)} />
                </div>
                <div
                  onMouseDown={startResizingRadar}
                  style={{
                    width: '2px',
                    background: '#004400',
                    cursor: 'col-resize',
                    zIndex: 13,
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#00ff00'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#004400'}
                />
              </>
            )}

            <div style={{ flex: 1, minWidth: 0, minHeight: 0 }}>
              <NetworkScene
                devices={devices}
                onDeviceSelect={selectDevice}
                selectedIp={selectedDevice?.ip}
                intruders={intruders}
              />
            </div>
          </div>
        </div>

        {/* Resizer horizontal (para arrastrar la consola) */}
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

        {/* 3. Consola / sniffer (altura dinamica) */}
     
        <div style={{
          height: `${consoleHeight}px`,
          minHeight: 0,
          zIndex: 10,
          boxShadow: '0 -5px 20px rgba(0,0,0,0.5)',
          background: '#000'
        }}>
          <ConsoleLogs
            logs={consoleLogs}
            devices={devices}
            selectedDevice={selectedDevice} // Necesario para filtros por objetivo
            onClearSystemLogs={clearLogs}
          />
        </div>

      </div>

      {/* Resizer vertical (para arrastrar el sidebar) */}
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
          Columna derecha: sidebar (anchura dinamica)
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
