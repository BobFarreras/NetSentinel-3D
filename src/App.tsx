import { useState, useRef, useEffect, useCallback, lazy, Suspense } from 'react';
import { TopBar } from './ui/components/layout/TopBar';
import { HistoryPanel } from './ui/components/hud/HistoryPanel';
import { ConsoleLogs } from './ui/components/panels/ConsoleLogs';
import { DetachedWindowPortal } from './ui/components/layout/DetachedWindowPortal';
import { windowingAdapter, type DetachablePanelId } from './adapters/windowingAdapter';
import { useNetworkManager } from './ui/hooks/useNetworkManager';
import type { DeviceDTO } from './shared/dtos/NetworkDTOs';

const NetworkScene = lazy(async () => {
  const mod = await import('./ui/components/3d/NetworkScene');
  return { default: mod.NetworkScene };
});

const DeviceDetailPanel = lazy(async () => {
  const mod = await import('./ui/components/hud/DeviceDetailPanel');
  return { default: mod.DeviceDetailPanel };
});

const RadarPanel = lazy(async () => {
  const mod = await import('./ui/components/hud/RadarPanel');
  return { default: mod.RadarPanel };
});

const ExternalAuditPanel = lazy(async () => {
  const mod = await import('./ui/components/hud/ExternalAuditPanel');
  return { default: mod.ExternalAuditPanel };
});

function App() {
  const detachedContext = windowingAdapter.parseDetachedContextFromLocation();
  const {
    devices, selectedDevice, scanning, auditing,
    auditResults, consoleLogs,
    startScan, startAudit, selectDevice, loadSession, jammedDevices,
    toggleJammer, checkRouterSecurity,
    systemLogs, clearSystemLogs,
    intruders, identity
  } = useNetworkManager({
    enableAutoBootstrap: !detachedContext,
    enableScannerHydration: !detachedContext || detachedContext.panel === "device" || detachedContext.panel === "scene3d",
  });

  const [showHistory, setShowHistory] = useState(false);
  const [showRadar, setShowRadar] = useState(false);
  const [showExternalAudit, setShowExternalAudit] = useState(false);
  const [externalAuditTarget, setExternalAuditTarget] = useState<DeviceDTO | null>(null);
  const [externalAuditScenarioId, setExternalAuditScenarioId] = useState<string | null>(null);
  const [detachedExternalTarget, setDetachedExternalTarget] = useState<DeviceDTO | null>(null);
  const [detachedExternalScenarioId, setDetachedExternalScenarioId] = useState<string | null>(null);
  const [detachedExternalAutoRunToken, setDetachedExternalAutoRunToken] = useState(0);
  const [detachedPanelReady, setDetachedPanelReady] = useState(!detachedContext);
  const [detachedPanels, setDetachedPanels] = useState({
    console: false,
    device: false,
    radar: false,
    external: false,
    scene3d: false,
  });
  const [detachedModes, setDetachedModes] = useState<Record<DetachablePanelId, "portal" | "tauri" | null>>({
    console: null,
    device: null,
    radar: null,
    external: null,
    scene3d: null,
  });

  // --- ESTADOS DE TAMAÑO (RESIZABLE) ---
  const [sidebarWidth, setSidebarWidth] = useState(450); // Amplada inicial Sidebar
  const [consoleHeight, setConsoleHeight] = useState(250); // Alçada inicial Consola
  const [radarWidth, setRadarWidth] = useState(520); // Anchura inicial del carril lateral (radar/external)
  const [dockSplitRatio, setDockSplitRatio] = useState(0.5); // Reparto interno Radar/External cuando conviven

  // Refs para gestionar el arrastre sin lag
  const resizeMode = useRef<null | 'sidebar' | 'console' | 'radar' | 'dock_split'>(null);
  const dragStartX = useRef(0);
  const dragStartY = useRef(0);
  const startSidebarWidth = useRef(450);
  const startConsoleHeight = useRef(250);
  const startRadarWidth = useRef(520);
  const startDockSplitRatio = useRef(0.5);

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

  const startResizingDockSplit = useCallback((e: React.MouseEvent) => {
    resizeMode.current = 'dock_split';
    dragStartX.current = e.clientX;
    startDockSplitRatio.current = dockSplitRatio;
  }, [dockSplitRatio]);

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
      return;
    }

    if (resizeMode.current === 'dock_split') {
      const delta = e.clientX - dragStartX.current;
      const laneWidth = Math.max(360, radarWidth);
      const next = startDockSplitRatio.current + delta / laneWidth;
      setDockSplitRatio(Math.max(0.28, Math.min(0.72, next)));
      document.body.style.cursor = 'col-resize';
    }
  }, [radarWidth, setSidebarWidth, setConsoleHeight, setRadarWidth]);

  // Listeners globales de raton
  useEffect(() => {
    window.addEventListener('mousemove', resize);
    window.addEventListener('mouseup', stopResizing);
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [resize, stopResizing]);

  const detachBtnStyle: React.CSSProperties = {
    width: 22,
    height: 22,
    border: '1px solid #007744',
    background: '#001b0f',
    color: '#00ff88',
    cursor: 'pointer',
    fontSize: 12,
    lineHeight: '18px',
    padding: 0,
    borderRadius: 2,
  };

  const dockPanel = useCallback(async (key: DetachablePanelId) => {
    if (detachedModes[key] === "tauri") {
      await windowingAdapter.closeDetachedPanelWindow(key);
    }
    setDetachedPanels(prev => ({ ...prev, [key]: false }));
    setDetachedModes(prev => ({ ...prev, [key]: null }));
  }, [detachedModes]);

  const undockPanel = useCallback(async (key: DetachablePanelId) => {
    const targetIp = key === "external" ? externalAuditTarget?.ip : key === "device" ? selectedDevice?.ip : undefined;
    const scenarioId = key === "external" ? (externalAuditScenarioId || undefined) : undefined;
    const openedTauri = await windowingAdapter.openDetachedPanelWindow({ panel: key, targetIp, scenarioId });
    setDetachedPanels(prev => ({ ...prev, [key]: true }));
    setDetachedModes(prev => ({ ...prev, [key]: openedTauri ? "tauri" : "portal" }));
  }, [externalAuditScenarioId, externalAuditTarget?.ip, selectedDevice?.ip]);

  const showDockRadar = showRadar && !detachedPanels.radar;
  const showDockExternal = showExternalAudit && !detachedPanels.external;
  const showDockArea = showDockRadar || showDockExternal;
  const showDockScene = !detachedPanels.scene3d;
  const showDockConsole = !detachedPanels.console;
  const showDockDevice = !detachedPanels.device;

  useEffect(() => {
    let unlisten: (() => void) | null = null;
    const boot = async () => {
      unlisten = await windowingAdapter.listenDockPanel((panel) => {
        void windowingAdapter.closeDetachedPanelWindow(panel);
        setDetachedPanels(prev => ({ ...prev, [panel]: false }));
        setDetachedModes(prev => ({ ...prev, [panel]: null }));
      });
    };
    void boot();
    return () => {
      if (unlisten) unlisten();
    };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const panels: DetachablePanelId[] = ["console", "device", "radar", "external", "scene3d"];
      panels.forEach((panel) => {
        if (!detachedPanels[panel]) return;
        if (detachedModes[panel] !== "tauri") return;
        void windowingAdapter.isDetachedPanelWindowOpen(panel).then((open) => {
          if (open) return;
          setDetachedPanels(prev => ({ ...prev, [panel]: false }));
          setDetachedModes(prev => ({ ...prev, [panel]: null }));
        });
      });
    }, 700);

    return () => {
      window.clearInterval(timer);
    };
  }, [detachedModes, detachedPanels]);

  useEffect(() => {
    let unlisten: (() => void) | null = null;
    const boot = async () => {
      unlisten = await windowingAdapter.listenExternalAuditContext((payload) => {
        setDetachedExternalTarget(payload.targetDevice || null);
        setDetachedExternalScenarioId(payload.scenarioId || null);
        if (payload.autoRun) {
          setDetachedExternalAutoRunToken((prev) => prev + 1);
        }
      });
    };
    void boot();
    return () => {
      if (unlisten) unlisten();
    };
  }, []);

  useEffect(() => {
    if (!showRadar && detachedModes.radar === "tauri") {
      void dockPanel("radar");
    }
  }, [dockPanel, detachedModes.radar, showRadar]);

  useEffect(() => {
    if (!showExternalAudit && detachedModes.external === "tauri") {
      void dockPanel("external");
    }
  }, [dockPanel, detachedModes.external, showExternalAudit]);

  useEffect(() => {
    if (!showDockScene && detachedModes.scene3d === "tauri") {
      // noop: mantener desacoplado hasta que el usuario reacople.
    }
  }, [detachedModes.scene3d, showDockScene]);

  const DockHeader: React.FC<{ title: string; onUndock: () => void }> = ({ title, onUndock }) => (
    <div
      style={{
        height: 30,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 8px',
        background: '#030908',
        borderBottom: '1px solid #004400',
        color: '#88ffcc',
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: 0.6,
      }}
    >
      <span>{title}</span>
      <button
        onClick={onUndock}
        style={detachBtnStyle}
        title="Desacoplar panel"
        aria-label={`UNLOCK_${title}`}
      >
        ↗
      </button>
    </div>
  );

  const InlinePanelHeader: React.FC<{ title: string; onUndock: () => void }> = ({ title, onUndock }) => (
    <div
      style={{
        height: 28,
        borderBottom: '1px solid #004400',
        background: '#030908',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 8px',
        flexShrink: 0,
      }}
    >
      <span style={{ color: '#88ffcc', fontSize: 11, fontWeight: 700, letterSpacing: 0.6 }}>{title}</span>
      <button onClick={onUndock} style={detachBtnStyle} aria-label={`UNLOCK_${title}`} title="Desacoplar panel">↗</button>
    </div>
  );

  const DetachedShell: React.FC<{ title: string; dockAria: string; onDock: () => void; children: React.ReactNode }> = ({
    title,
    dockAria,
    onDock,
    children,
  }) => (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: '#000' }}>
      <div
        style={{
          height: 30,
          borderBottom: '1px solid #004400',
          background: '#030908',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 8px',
          flexShrink: 0,
        }}
      >
        <span style={{ color: '#88ffcc', fontSize: 12, fontWeight: 700, letterSpacing: 0.6 }}>{title}</span>
        <button onClick={onDock} style={detachBtnStyle} aria-label={dockAria} title="Volver al panel principal">↙</button>
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>{children}</div>
    </div>
  );

  const detachedTargetDevice = detachedContext?.targetIp
    ? (devices.find((d) => d.ip === detachedContext.targetIp) || null)
    : selectedDevice;

  const detachedExternalTargetDevice = detachedExternalTarget || detachedTargetDevice;
  const detachedExternalScenario = detachedExternalScenarioId || detachedContext?.scenarioId || externalAuditScenarioId;

  useEffect(() => {
    if (!detachedContext) {
      setDetachedPanelReady(true);
      return;
    }

    // Diferimos el montaje pesado para evitar congelacion al abrir/arrastrar ventana.
    setDetachedPanelReady(false);
    const timer = window.setTimeout(() => {
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          setDetachedPanelReady(true);
        });
      });
    }, 260);

    return () => {
      window.clearTimeout(timer);
    };
  }, [detachedContext?.panel]);

  useEffect(() => {
    if (!detachedContext) return;
    const panel = detachedContext.panel;
    const onPageHide = () => {
      void windowingAdapter.emitDockPanel(panel);
    };
    window.addEventListener("pagehide", onPageHide);
    return () => {
      window.removeEventListener("pagehide", onPageHide);
    };
  }, [detachedContext]);

  if (detachedContext) {
    const panel = detachedContext.panel;
    return (
      <div
        style={{
          width: "100vw",
          height: "100vh",
          background: "#000",
          color: "#0f0",
          fontFamily: "'Consolas', 'Courier New', monospace",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            height: 34,
            background: "#03110a",
            borderBottom: "1px solid #0a3",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start",
            padding: "0 10px",
            flexShrink: 0,
          }}
        >
          <span style={{ color: "#8cfcc7", fontSize: 12, fontWeight: 700, letterSpacing: 0.6 }}>
            DETACHED: {panel.toUpperCase()}
          </span>
        </div>
        <div style={{ flex: 1, minHeight: 0 }}>
          {!detachedPanelReady && (
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
                gap: 10,
                color: "#66ffcc",
                letterSpacing: 0.6,
                fontSize: 12,
              }}
            >
              <div
                style={{
                  width: 180,
                  height: 6,
                  border: "1px solid #0a3",
                  background: "rgba(0,255,136,0.08)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: "42%",
                    height: "100%",
                    background: "#00ff88",
                    boxShadow: "0 0 10px rgba(0,255,136,0.8)",
                    animation: "nsDetachedLoad 1s linear infinite",
                  }}
                />
              </div>
              <span>Inicializando panel...</span>
              <style>{`
                @keyframes nsDetachedLoad {
                  0% { transform: translateX(-120%); }
                  100% { transform: translateX(320%); }
                }
              `}</style>
            </div>
          )}

          {detachedPanelReady && (
            <>
          {panel === "console" && (
            <ConsoleLogs
              logs={systemLogs}
              devices={devices}
              selectedDevice={selectedDevice}
              onClearSystemLogs={clearSystemLogs}
            />
          )}
          {panel === "radar" && (
            <Suspense fallback={null}>
              <RadarPanel onClose={() => {}} />
            </Suspense>
          )}
          {panel === "external" && (
            <Suspense fallback={null}>
              <ExternalAuditPanel
                key={`detached-ext-${detachedExternalAutoRunToken}-${detachedExternalTargetDevice?.ip || "none"}-${detachedExternalScenario || "none"}`}
                onClose={() => {}}
                targetDevice={detachedExternalTargetDevice}
                identity={identity}
                defaultScenarioId={detachedExternalScenario}
                autoRun={Boolean(detachedExternalTargetDevice && detachedExternalScenario)}
                embedded={true}
              />
            </Suspense>
          )}
          {panel === "scene3d" && (
            <Suspense fallback={null}>
              <NetworkScene
                devices={devices}
                onDeviceSelect={selectDevice}
                selectedIp={selectedDevice?.ip}
                intruders={intruders}
                identity={identity}
              />
            </Suspense>
          )}
          {panel === "device" && (
            detachedTargetDevice ? (
              <Suspense fallback={null}>
                <DeviceDetailPanel
                  device={detachedTargetDevice}
                  auditResults={auditResults}
                  consoleLogs={consoleLogs}
                  auditing={auditing}
                  onAudit={() => startAudit(detachedTargetDevice.ip)}
                  isJammed={jammedDevices.includes(detachedTargetDevice.ip)}
                  onToggleJam={() => toggleJammer(detachedTargetDevice.ip)}
                  onRouterAudit={checkRouterSecurity}
                  onOpenLabAudit={(d) => {
                    setExternalAuditTarget(d);
                    setExternalAuditScenarioId(d.isGateway ? "router_recon_ping_tracert" : "device_http_headers");
                  }}
                />
              </Suspense>
            ) : (
              <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#66ffcc" }}>
                Sin dispositivo objetivo para esta ventana.
              </div>
            )
          )}
            </>
          )}
        </div>
      </div>
    );
  }

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
          onExternalAuditToggle={() => {
            const next = !showExternalAudit;
            setShowExternalAudit(next);
            if (next) {
              setExternalAuditTarget(null);
              setExternalAuditScenarioId(null);
            }
          }}
          showExternalAudit={showExternalAudit}
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
            {showDockArea && (
              <>
                <div style={{ width: showDockScene ? `${radarWidth}px` : '100%', minWidth: 360, maxWidth: showDockScene ? 1000 : undefined, minHeight: 0, background: '#000', overflow: 'hidden', zIndex: 12, display: 'flex' }}>
                  {showDockRadar && showDockExternal ? (
                    <>
                      <div style={{ width: `${dockSplitRatio * 100}%`, minWidth: 200, display: 'flex', flexDirection: 'column' }}>
                        <DockHeader title="RADAR" onUndock={() => undockPanel('radar')} />
                        <div style={{ flex: 1, minHeight: 0 }}>
                          <Suspense fallback={null}>
                            <RadarPanel onClose={() => setShowRadar(false)} />
                          </Suspense>
                        </div>
                      </div>
                      <div
                        onMouseDown={startResizingDockSplit}
                        style={{ width: '4px', background: '#003300', cursor: 'col-resize' }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#00ff00'}
                        onMouseLeave={(e) => e.currentTarget.style.background = '#003300'}
                        aria-label="RESIZE_DOCK_SPLIT"
                      />
                      <div style={{ width: `${(1 - dockSplitRatio) * 100}%`, minWidth: 200, display: 'flex', flexDirection: 'column' }}>
                        <DockHeader title="EXTERNAL" onUndock={() => undockPanel('external')} />
                        <div style={{ flex: 1, minHeight: 0 }}>
                          <Suspense fallback={null}>
                            <ExternalAuditPanel
                              onClose={() => setShowExternalAudit(false)}
                              targetDevice={externalAuditTarget}
                              identity={identity}
                              defaultScenarioId={externalAuditScenarioId}
                              autoRun={Boolean(externalAuditTarget && externalAuditScenarioId)}
                              embedded={true}
                            />
                          </Suspense>
                        </div>
                      </div>
                    </>
                  ) : showDockRadar ? (
                    <div style={{ width: '100%', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                      <DockHeader title="RADAR" onUndock={() => undockPanel('radar')} />
                      <div style={{ flex: 1, minHeight: 0 }}>
                        <Suspense fallback={null}>
                          <RadarPanel onClose={() => setShowRadar(false)} />
                        </Suspense>
                      </div>
                    </div>
                  ) : (
                    <div style={{ width: '100%', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                      <DockHeader title="EXTERNAL" onUndock={() => undockPanel('external')} />
                      <div style={{ flex: 1, minHeight: 0 }}>
                        <Suspense fallback={null}>
                          <ExternalAuditPanel
                            onClose={() => setShowExternalAudit(false)}
                            targetDevice={externalAuditTarget}
                            identity={identity}
                            defaultScenarioId={externalAuditScenarioId}
                            autoRun={Boolean(externalAuditTarget && externalAuditScenarioId)}
                            embedded={true}
                          />
                        </Suspense>
                      </div>
                    </div>
                  )}
                </div>
                {showDockScene && (
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
                )}
              </>
            )}

            {showDockScene && (
              <div style={{ flex: 1, minWidth: 0, minHeight: 0, position: 'relative' }}>
                <Suspense fallback={null}>
                  <NetworkScene
                    devices={devices}
                    onDeviceSelect={selectDevice}
                    selectedIp={selectedDevice?.ip}
                    intruders={intruders}
                    identity={identity}
                    onUndockScene={() => { void undockPanel('scene3d'); }}
                  />
                </Suspense>
              </div>
            )}
          </div>
        </div>

        {/* Resizer horizontal (para arrastrar la consola) */}
        {showDockConsole && (
          <>
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
              background: '#000',
              position: 'relative',
            }}>
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                <InlinePanelHeader title="CONSOLE" onUndock={() => undockPanel('console')} />
                <div style={{ flex: 1, minHeight: 0 }}>
                <ConsoleLogs
                  logs={systemLogs}
                  devices={devices}
                  selectedDevice={selectedDevice} // Necesario para filtros por objetivo
                  onClearSystemLogs={clearSystemLogs}
                />
                </div>
              </div>
            </div>
          </>
        )}

      </div>

      {showDockDevice && (
      <>
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
              <InlinePanelHeader title="DEVICE" onUndock={() => undockPanel('device')} />
              <Suspense fallback={null}>
                <DeviceDetailPanel
                  device={selectedDevice}
                  auditResults={auditResults}
                  consoleLogs={consoleLogs}
                  auditing={auditing}
                  onAudit={() => startAudit(selectedDevice.ip)}
                  isJammed={jammedDevices.includes(selectedDevice.ip)}
                  onToggleJam={() => toggleJammer(selectedDevice.ip)}
                  onRouterAudit={checkRouterSecurity}
                  onOpenLabAudit={(d) => {
                    const scenarioId = d.isGateway ? "router_recon_ping_tracert" : "device_http_headers";
                    setExternalAuditTarget(d);
                    setExternalAuditScenarioId(scenarioId);
                    setShowExternalAudit(true);
                    if (detachedPanels.external && detachedModes.external === "tauri") {
                      void windowingAdapter.emitExternalAuditContext({ targetDevice: d, scenarioId, autoRun: true });
                    }
                  }}
                />
              </Suspense>
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: '#004400', textAlign: 'center', padding: 40 }}>
              <div style={{ fontSize: '5rem', marginBottom: 20, opacity: 0.3, textShadow: '0 0 20px #0f0' }}>⌖</div>
              <h3 style={{ fontSize: '1.5rem', marginBottom: 10, color: '#0f0' }}>AWAITING TARGET</h3>
              <p style={{ fontSize: '1rem', opacity: 0.7 }}>
                SELECT A NODE FROM THE NETWORK GRID
              </p>
            </div>
          )}
        </div>
      </>
      )}

      {detachedPanels.console && detachedModes.console === "portal" && (
        <DetachedWindowPortal title="NetSentinel - Console Logs" onClose={() => dockPanel('console')} width={980} height={420}>
          <DetachedShell title="CONSOLE" dockAria="DOCK_CONSOLE" onDock={() => dockPanel('console')}>
            <ConsoleLogs
              logs={systemLogs}
              devices={devices}
              selectedDevice={selectedDevice}
              onClearSystemLogs={clearSystemLogs}
            />
          </DetachedShell>
        </DetachedWindowPortal>
      )}

      {detachedPanels.device && detachedModes.device === "portal" && selectedDevice && (
        <DetachedWindowPortal title={`NetSentinel - Device ${selectedDevice.ip}`} onClose={() => dockPanel('device')} width={520} height={760}>
          <DetachedShell title="DEVICE" dockAria="DOCK_DEVICE" onDock={() => dockPanel('device')}>
            <div style={{ width: '100%', height: '100%', background: '#020202' }}>
              <Suspense fallback={null}>
                <DeviceDetailPanel
                  device={selectedDevice}
                  auditResults={auditResults}
                  consoleLogs={consoleLogs}
                  auditing={auditing}
                  onAudit={() => startAudit(selectedDevice.ip)}
                  isJammed={jammedDevices.includes(selectedDevice.ip)}
                  onToggleJam={() => toggleJammer(selectedDevice.ip)}
                  onRouterAudit={checkRouterSecurity}
                onOpenLabAudit={(d) => {
                  const scenarioId = d.isGateway ? "router_recon_ping_tracert" : "device_http_headers";
                  setExternalAuditTarget(d);
                  setExternalAuditScenarioId(scenarioId);
                  setShowExternalAudit(true);
                  if (detachedPanels.external && detachedModes.external === "tauri") {
                    void windowingAdapter.emitExternalAuditContext({ targetDevice: d, scenarioId, autoRun: true });
                  }
                }}
              />
            </Suspense>
            </div>
          </DetachedShell>
        </DetachedWindowPortal>
      )}

      {detachedPanels.radar && detachedModes.radar === "portal" && showRadar && (
        <DetachedWindowPortal title="NetSentinel - Radar" onClose={() => dockPanel('radar')} width={860} height={680}>
          <DetachedShell title="RADAR" dockAria="DOCK_RADAR" onDock={() => dockPanel('radar')}>
            <Suspense fallback={null}>
              <RadarPanel onClose={() => setShowRadar(false)} />
            </Suspense>
          </DetachedShell>
        </DetachedWindowPortal>
      )}

      {detachedPanels.external && detachedModes.external === "portal" && showExternalAudit && (
        <DetachedWindowPortal title="NetSentinel - External Audit" onClose={() => dockPanel('external')} width={860} height={680}>
          <DetachedShell title="EXTERNAL AUDIT" dockAria="DOCK_EXTERNAL" onDock={() => dockPanel('external')}>
            <Suspense fallback={null}>
              <ExternalAuditPanel
                onClose={() => setShowExternalAudit(false)}
                targetDevice={externalAuditTarget}
                identity={identity}
                defaultScenarioId={externalAuditScenarioId}
                autoRun={Boolean(externalAuditTarget && externalAuditScenarioId)}
                embedded={true}
              />
            </Suspense>
          </DetachedShell>
        </DetachedWindowPortal>
      )}

      {detachedPanels.scene3d && detachedModes.scene3d === "portal" && (
        <DetachedWindowPortal title="NetSentinel - Network Scene" onClose={() => dockPanel('scene3d')} width={1200} height={780}>
          <DetachedShell title="NETWORK SCENE" dockAria="DOCK_SCENE3D" onDock={() => dockPanel('scene3d')}>
            <Suspense fallback={null}>
              <NetworkScene
                devices={devices}
                onDeviceSelect={selectDevice}
                selectedIp={selectedDevice?.ip}
                intruders={intruders}
                identity={identity}
              />
            </Suspense>
          </DetachedShell>
        </DetachedWindowPortal>
      )}

    </div>
  );
}

export default App;
