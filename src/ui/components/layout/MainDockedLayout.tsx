// src/ui/components/layout/MainDockedLayout.tsx
// Layout principal acoplado: organiza HUD/Scene/Console y paneles laterales con soporte de docking/undocking.

import { lazy, Suspense } from "react";
import type { DeviceDTO, HostIdentity, OpenPortDTO } from "../../../shared/dtos/NetworkDTOs";
import { TopBar } from "./TopBar";
import { HistoryPanel } from "../../features/history/components/HistoryPanel";
import { ConsoleLogs } from "../../features/console_logs/components/ConsoleLogs";
import { DetachedWindowPortal } from "./DetachedWindowPortal";
import type { DetachablePanelId } from "../../../adapters/windowingAdapter";

const NetworkScene = lazy(async () => {
  const mod = await import("../../features/scene3d/components/NetworkScene");
  return { default: mod.NetworkScene };
});

const DeviceDetailPanel = lazy(async () => {
  const mod = await import("../../features/device_detail/components/DeviceDetailPanel");
  return { default: mod.DeviceDetailPanel };
});

const RadarPanel = lazy(async () => {
  const mod = await import("../../features/radar/components/RadarPanel");
  return { default: mod.RadarPanel };
});

const AttackLabPanel = lazy(async () => {
  const mod = await import("../../features/attack_lab/panel/AttackLabPanel");
  return { default: mod.AttackLabPanel };
});

const SettingsPanel = lazy(async () => {
  const mod = await import("../../features/settings/components/SettingsPanel");
  return { default: mod.SettingsPanel };
});

interface MainDockedLayoutProps {
  scanning: boolean;
  devices: DeviceDTO[];
  showHistory: boolean;
  setShowHistory: (next: boolean) => void;
  showRadar: boolean;
  setShowRadar: (next: boolean) => void;
  showAttackLab: boolean;
  onToggleAttackLab: () => void;
  closeAttackLab: () => void;
  showSettings: boolean;
  setShowSettings: (next: boolean) => void;
  identity: HostIdentity | null;
  startScan: (range?: string) => void;
  loadSession: (devices: DeviceDTO[]) => void;
  showDockRadar: boolean;
  showDockAttackLab: boolean;
  showDockScene: boolean;
  showDockConsole: boolean;
  showDockDevice: boolean;
  radarWidth: number;
  dockSplitRatio: number;
  dockTripleLeftRatio: number;
  dockTripleRightRatio: number;
  dockSettingsSplitRatio: number;
  consoleHeight: number;
  sidebarWidth: number;
  startResizingDockSplit: (e: React.MouseEvent) => void;
  startResizingDockSettingsSplit: (e: React.MouseEvent) => void;
  startResizingDockTripleLeft: (e: React.MouseEvent) => void;
  startResizingDockTripleRight: (e: React.MouseEvent) => void;
  startResizingRadar: (e: React.MouseEvent) => void;
  startResizingConsole: (e: React.MouseEvent) => void;
  startResizingSidebar: (e: React.MouseEvent) => void;
  undockPanel: (panel: DetachablePanelId) => void;
  dockPanel: (panel: DetachablePanelId) => void;
  selectedDevice: DeviceDTO | null;
  selectDevice: (device: DeviceDTO | null) => void;
  intruders: string[];
  systemLogs: string[];
  clearSystemLogs: () => void;
  auditResults: OpenPortDTO[];
  consoleLogs: string[];
  auditing: boolean;
  startAudit: (ip: string) => void;
  jammedDevices: string[];
  jamPendingDevices: string[];
  toggleJammer: (ip: string) => void;
  checkRouterSecurity: (ip: string) => void;
  attackLabTarget: DeviceDTO | null;
  attackLabScenarioId: string | null;
  attackLabAutoRunToken: number;
  onOpenLabAudit: (device: DeviceDTO) => void;
  detachedPanels: Record<DetachablePanelId, boolean>;
  detachedModes: Record<DetachablePanelId, "portal" | "tauri" | null>;
  isResizing: boolean;
  showDockSettings: boolean;
}

const detachBtnStyle: React.CSSProperties = {
  width: 22,
  height: 22,
  border: "1px solid #007744",
  background: "#001b0f",
  color: "#00ff88",
  cursor: "pointer",
  fontSize: 12,
  lineHeight: "18px",
  padding: 0,
  borderRadius: 2,
};

const DockHeader: React.FC<{ title: string; onUndock: () => void }> = ({ title, onUndock }) => (
  <div
    style={{
      height: 30,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 8px",
      background: "#030908",
      borderBottom: "1px solid #004400",
      color: "#88ffcc",
      fontSize: 12,
      fontWeight: 700,
      letterSpacing: 0.6,
    }}
  >
    <span>{title}</span>
    <button onClick={onUndock} style={detachBtnStyle} title="Desacoplar panel" aria-label={`UNLOCK_${title.replace(/\s+/g, "_")}`}>
      ↗
    </button>
  </div>
);

const InlinePanelHeader: React.FC<{ title: string; onUndock: () => void }> = ({ title, onUndock }) => (
  <div
    style={{
      height: 28,
      borderBottom: "1px solid #004400",
      background: "#030908",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 8px",
      flexShrink: 0,
    }}
  >
    <span style={{ color: "#88ffcc", fontSize: 11, fontWeight: 700, letterSpacing: 0.6 }}>{title}</span>
    <button onClick={onUndock} style={detachBtnStyle} aria-label={`UNLOCK_${title.replace(/\s+/g, "_")}`} title="Desacoplar panel">↗</button>
  </div>
);

const DetachedShell: React.FC<{ title: string; dockAria: string; onDock: () => void; children: React.ReactNode }> = ({
  title,
  dockAria,
  onDock,
  children,
}) => (
  <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "#000" }}>
    <div
      style={{
        height: 30,
        borderBottom: "1px solid #004400",
        background: "#030908",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 8px",
        flexShrink: 0,
      }}
    >
      <span style={{ color: "#88ffcc", fontSize: 12, fontWeight: 700, letterSpacing: 0.6 }}>{title}</span>
      <button onClick={onDock} style={detachBtnStyle} aria-label={dockAria} title="Volver al panel principal">↙</button>
    </div>
    <div style={{ flex: 1, minHeight: 0 }}>{children}</div>
  </div>
);

export const MainDockedLayout = ({
  scanning,
  devices,
  showHistory,
  setShowHistory,
  showRadar,
  setShowRadar,
  showAttackLab,
  onToggleAttackLab,
  closeAttackLab,
  showSettings,
  setShowSettings,
  identity,
  startScan,
  loadSession,
  showDockRadar,
  showDockAttackLab,
  showDockScene,
  showDockConsole,
  showDockDevice,
  radarWidth,
  dockSplitRatio,
  dockTripleLeftRatio,
  dockTripleRightRatio,
  dockSettingsSplitRatio,
  consoleHeight,
  sidebarWidth,
  startResizingDockSplit,
  startResizingDockSettingsSplit,
  startResizingDockTripleLeft,
  startResizingDockTripleRight,
  startResizingRadar,
  startResizingConsole,
  startResizingSidebar,
  undockPanel,
  dockPanel,
  selectedDevice,
  selectDevice,
  intruders,
  systemLogs,
  clearSystemLogs,
  auditResults,
  consoleLogs,
  auditing,
  startAudit,
  jammedDevices,
  jamPendingDevices,
  toggleJammer,
  checkRouterSecurity,
  attackLabTarget,
  attackLabScenarioId,
  attackLabAutoRunToken,
  onOpenLabAudit,
  detachedPanels,
  detachedModes,
  isResizing,
  showDockSettings,
}: MainDockedLayoutProps) => {
  const showDockArea = showDockRadar || showDockAttackLab || showDockSettings;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100vw",
        height: "100vh",
        background: "#050505",
        color: "#0f0",
        overflow: "hidden",
        fontFamily: "'Consolas', 'Courier New', monospace",
        fontSize: "16px",
        userSelect: isResizing ? "none" : "auto",
        boxSizing: "border-box",
        // Borde global para "cerrar" el HUD y eliminar el efecto de ventana sin limite (especialmente abajo).
        border: "1px solid #0a3a2a",
        borderBottom: "4px solid rgba(0,255,136,0.22)",
        boxShadow:
          "inset 0 -1px 0 rgba(0,255,136,0.18), inset 0 0 0 1px rgba(0,0,0,0.55), 0 14px 34px rgba(0,0,0,0.55)",
      }}
    >
      <TopBar
        scanning={scanning}
        activeNodes={devices.length}
        onScan={() => startScan()}
        onHistoryToggle={() => setShowHistory(!showHistory)}
        showHistory={showHistory}
        onRadarToggle={() => setShowRadar(!showRadar)}
        showRadar={showRadar}
        onAttackLabToggle={onToggleAttackLab}
        showAttackLab={showAttackLab}
        onSettingsToggle={() => setShowSettings(!showSettings)}
        showSettings={showSettings}
        identity={identity}
      />

      <div style={{ flex: 1, minHeight: 0, display: "flex", overflow: "hidden" }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", position: "relative", height: "100%", minWidth: 0, overflow: "hidden" }}>
          <div style={{ flex: 1, position: "relative", overflow: "hidden", minHeight: 0 }}>
          {showHistory && (
            <div style={{ position: "absolute", top: 20, left: 20, zIndex: 20 }}>
              <HistoryPanel
                onClose={() => setShowHistory(false)}
                onLoadSession={(oldDevices) => {
                  loadSession(oldDevices);
                  setShowHistory(false);
                }}
              />
            </div>
          )}

          <div style={{ position: "absolute", inset: 0, display: "flex", minHeight: 0 }}>
            {showDockArea && (
              <>
                <div style={{ width: showDockScene ? `${radarWidth}px` : "100%", minWidth: 360, minHeight: 0, background: "#000", overflow: "hidden", zIndex: 12, display: "flex" }}>
                  {showDockSettings && showDockRadar && showDockAttackLab ? (
                    // Triple split: Radar | Attack Lab | Settings. Cada uno se ajusta con separadores.
                    <div style={{ display: "flex", width: "100%", minHeight: 0 }}>
                      <div style={{ width: `${dockTripleLeftRatio * 100}%`, minWidth: 220, display: "flex", flexDirection: "column", minHeight: 0 }}>
                        <DockHeader title="RADAR" onUndock={() => void undockPanel("radar")} />
                        <div style={{ flex: 1, minHeight: 0 }}>
                          <Suspense fallback={null}>
                            <RadarPanel onClose={() => setShowRadar(false)} />
                          </Suspense>
                        </div>
                      </div>
                      <div
                        onMouseDown={startResizingDockTripleLeft}
                        style={{ width: "4px", background: "#003300", cursor: "col-resize", zIndex: 25, flexShrink: 0 }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#00ff00")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "#003300")}
                        aria-label="RESIZE_DOCK_TRIPLE_LEFT"
                      />
                      <div style={{ width: `${(dockTripleRightRatio - dockTripleLeftRatio) * 100}%`, minWidth: 240, display: "flex", flexDirection: "column", minHeight: 0 }}>
                        <DockHeader title="ATTACK LAB" onUndock={() => void undockPanel("attack_lab")} />
                        <div style={{ flex: 1, minHeight: 0 }}>
                          <Suspense fallback={null}>
                            <AttackLabPanel
                              onClose={closeAttackLab}
                              targetDevice={attackLabTarget}
                              identity={identity}
                              defaultScenarioId={attackLabScenarioId}
                              autoRunToken={attackLabAutoRunToken}
                              embedded={true}
                            />
                          </Suspense>
                        </div>
                      </div>
                      <div
                        onMouseDown={startResizingDockTripleRight}
                        style={{ width: "4px", background: "#003300", cursor: "col-resize", zIndex: 25, flexShrink: 0 }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#00ff00")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "#003300")}
                        aria-label="RESIZE_DOCK_TRIPLE_RIGHT"
                      />
                      <div style={{ width: `${(1 - dockTripleRightRatio) * 100}%`, minWidth: 300, display: "flex", flexDirection: "column", minHeight: 0 }}>
                        <DockHeader title="SETTINGS" onUndock={() => void undockPanel("settings")} />
                        <div style={{ flex: 1, minHeight: 0 }}>
                          <Suspense fallback={null}>
                            <SettingsPanel onClose={() => setShowSettings(false)} />
                          </Suspense>
                        </div>
                      </div>
                    </div>
                  ) : showDockSettings && showDockRadar && !showDockAttackLab ? (
                    // Split 2 columnas: Radar | Settings (con resize independiente).
                    <div style={{ display: "flex", width: "100%", minHeight: 0 }}>
                      <div style={{ width: `${dockSettingsSplitRatio * 100}%`, minWidth: 260, minHeight: 0, display: "flex", flexDirection: "column" }}>
                        <DockHeader title="RADAR" onUndock={() => void undockPanel("radar")} />
                        <div style={{ flex: 1, minHeight: 0 }}>
                          <Suspense fallback={null}>
                            <RadarPanel onClose={() => setShowRadar(false)} />
                          </Suspense>
                        </div>
                      </div>
                      <div
                        onMouseDown={startResizingDockSettingsSplit}
                        style={{ width: "4px", background: "#003300", cursor: "col-resize", zIndex: 25, flexShrink: 0 }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#00ff00")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "#003300")}
                        aria-label="RESIZE_DOCK_SETTINGS_SPLIT"
                      />
                      <div style={{ width: `${(1 - dockSettingsSplitRatio) * 100}%`, minWidth: 320, minHeight: 0, display: "flex", flexDirection: "column" }}>
                        <DockHeader title="SETTINGS" onUndock={() => void undockPanel("settings")} />
                        <div style={{ flex: 1, minHeight: 0 }}>
                          <Suspense fallback={null}>
                            <SettingsPanel onClose={() => setShowSettings(false)} />
                          </Suspense>
                        </div>
                      </div>
                    </div>
                  ) : showDockSettings && showDockAttackLab && !showDockRadar ? (
                    // Split 2 columnas: Attack Lab | Settings (con resize independiente).
                    <div style={{ display: "flex", width: "100%", minHeight: 0 }}>
                      <div style={{ width: `${dockSettingsSplitRatio * 100}%`, minWidth: 260, minHeight: 0, display: "flex", flexDirection: "column" }}>
                        <DockHeader title="ATTACK LAB" onUndock={() => void undockPanel("attack_lab")} />
                        <div style={{ flex: 1, minHeight: 0 }}>
                          <Suspense fallback={null}>
                            <AttackLabPanel
                              onClose={closeAttackLab}
                              targetDevice={attackLabTarget}
                              identity={identity}
                              defaultScenarioId={attackLabScenarioId}
                              autoRunToken={attackLabAutoRunToken}
                              embedded={true}
                            />
                          </Suspense>
                        </div>
                      </div>
                      <div
                        onMouseDown={startResizingDockSettingsSplit}
                        style={{ width: "4px", background: "#003300", cursor: "col-resize", zIndex: 25, flexShrink: 0 }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#00ff00")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "#003300")}
                        aria-label="RESIZE_DOCK_SETTINGS_SPLIT"
                      />
                      <div style={{ width: `${(1 - dockSettingsSplitRatio) * 100}%`, minWidth: 320, minHeight: 0, display: "flex", flexDirection: "column" }}>
                        <DockHeader title="SETTINGS" onUndock={() => void undockPanel("settings")} />
                        <div style={{ flex: 1, minHeight: 0 }}>
                          <Suspense fallback={null}>
                            <SettingsPanel onClose={() => setShowSettings(false)} />
                          </Suspense>
                        </div>
                      </div>
                    </div>
                  ) : showDockSettings ? (
                    <div style={{ width: "100%", minHeight: 0, display: "flex", flexDirection: "column" }}>
                      <DockHeader title="SETTINGS" onUndock={() => void undockPanel("settings")} />
                      <div style={{ flex: 1, minHeight: 0 }}>
                        <Suspense fallback={null}>
                          <SettingsPanel onClose={() => setShowSettings(false)} />
                        </Suspense>
                      </div>
                    </div>
                  ) : showDockRadar && showDockAttackLab ? (
                    <>
                      <div style={{ width: `${dockSplitRatio * 100}%`, minWidth: 200, display: "flex", flexDirection: "column" }}>
                        <DockHeader title="RADAR" onUndock={() => void undockPanel("radar")} />
                        <div style={{ flex: 1, minHeight: 0 }}>
                          <Suspense fallback={null}>
                            <RadarPanel onClose={() => setShowRadar(false)} />
                          </Suspense>
                        </div>
                      </div>
                      <div
                        onMouseDown={startResizingDockSplit}
                        style={{ width: "4px", background: "#003300", cursor: "col-resize" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#00ff00")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "#003300")}
                        aria-label="RESIZE_DOCK_SPLIT"
                      />
                      <div style={{ width: `${(1 - dockSplitRatio) * 100}%`, minWidth: 200, display: "flex", flexDirection: "column" }}>
                        <DockHeader title="ATTACK LAB" onUndock={() => void undockPanel("attack_lab")} />
                        <div style={{ flex: 1, minHeight: 0 }}>
                          <Suspense fallback={null}>
                            <AttackLabPanel
                              onClose={closeAttackLab}
                              targetDevice={attackLabTarget}
                              identity={identity}
                              defaultScenarioId={attackLabScenarioId}
                              autoRunToken={attackLabAutoRunToken}
                              embedded={true}
                            />
                          </Suspense>
                        </div>
                      </div>
                    </>
                  ) : showDockRadar ? (
                    <div style={{ width: "100%", minHeight: 0, display: "flex", flexDirection: "column" }}>
                      <DockHeader title="RADAR" onUndock={() => void undockPanel("radar")} />
                      <div style={{ flex: 1, minHeight: 0 }}>
                        <Suspense fallback={null}>
                          <RadarPanel onClose={() => setShowRadar(false)} />
                        </Suspense>
                      </div>
                    </div>
                  ) : (
                    <div style={{ width: "100%", minHeight: 0, display: "flex", flexDirection: "column" }}>
                      <DockHeader title="ATTACK LAB" onUndock={() => void undockPanel("attack_lab")} />
                      <div style={{ flex: 1, minHeight: 0 }}>
                        <Suspense fallback={null}>
                          <AttackLabPanel
                            onClose={closeAttackLab}
                            targetDevice={attackLabTarget}
                            identity={identity}
                            defaultScenarioId={attackLabScenarioId}
                            autoRunToken={attackLabAutoRunToken}
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
                    style={{ width: "2px", background: "#004400", cursor: "col-resize", zIndex: 13, transition: "background 0.2s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#00ff00")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "#004400")}
                  />
                )}
              </>
            )}

            {showDockScene && (
              <div style={{ flex: 1, minWidth: 0, minHeight: 0, position: "relative" }}>
                <Suspense fallback={null}>
                  <NetworkScene
                    devices={devices}
                    onDeviceSelect={selectDevice}
                    selectedIp={selectedDevice?.ip}
                    intruders={intruders}
                    identity={identity}
                    onUndockScene={() => void undockPanel("scene3d")}
                  />
                </Suspense>
              </div>
            )}
          </div>
        </div>

        {showDockConsole && (
          <>
            <div
              onMouseDown={startResizingConsole}
              style={{ height: "2px", background: "#004400", cursor: "row-resize", zIndex: 15, transition: "background 0.2s" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#00ff00")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#004400")}
            />

            <div style={{ height: `${consoleHeight}px`, minHeight: 0, zIndex: 10, boxShadow: "0 -5px 20px rgba(0,0,0,0.5)", background: "#000", position: "relative" }}>
              <div style={{ height: "100%", display: "flex", flexDirection: "column", minHeight: 0 }}>
                <InlinePanelHeader title="CONSOLE" onUndock={() => void undockPanel("console")} />
                <div style={{ flex: 1, minHeight: 0 }}>
                  <ConsoleLogs logs={systemLogs} devices={devices} selectedDevice={selectedDevice} jammedIps={jammedDevices} onClearSystemLogs={clearSystemLogs} />
                </div>
              </div>
            </div>
          </>
        )}
        </div>

        {showDockDevice && (
        <>
          <div
            onMouseDown={startResizingSidebar}
            style={{ width: "2px", background: "#004400", cursor: "col-resize", zIndex: 40, transition: "background 0.2s" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#00ff00")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#004400")}
          />

          <div style={{ width: `${sidebarWidth}px`, minWidth: "300px", flexShrink: 0, height: "100%", background: "#020202", display: "flex", flexDirection: "column", boxShadow: "-10px 0 30px rgba(0, 50, 0, 0.2)", position: "relative", zIndex: 30 }}>
            <div
              style={{
                position: "absolute",
                inset: 0,
                pointerEvents: "none",
                backgroundImage: "linear-gradient(rgba(0, 20, 0, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 20, 0, 0.1) 1px, transparent 1px)",
                backgroundSize: "20px 20px",
                opacity: 0.3,
              }}
            />

            {selectedDevice ? (
              <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                <InlinePanelHeader title="DEVICE" onUndock={() => void undockPanel("device")} />
                <Suspense fallback={null}>
                  <DeviceDetailPanel
                    device={selectedDevice}
                    auditResults={auditResults}
                    consoleLogs={consoleLogs}
                    auditing={auditing}
                    onAudit={() => startAudit(selectedDevice.ip)}
                    isJammed={jammedDevices.includes(selectedDevice.ip)}
                    isJamPending={jamPendingDevices.includes(selectedDevice.ip)}
                    onToggleJam={() => toggleJammer(selectedDevice.ip)}
                    onRouterAudit={checkRouterSecurity}
                    onOpenLabAudit={onOpenLabAudit}
                  />
                </Suspense>
              </div>
            ) : (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", color: "#004400", textAlign: "center", padding: 40 }}>
                <div style={{ fontSize: "5rem", marginBottom: 20, opacity: 0.3, textShadow: "0 0 20px #0f0" }}>⌖</div>
                <h3 style={{ fontSize: "1.5rem", marginBottom: 10, color: "#0f0" }}>AWAITING TARGET</h3>
                <p style={{ fontSize: "1rem", opacity: 0.7 }}>SELECT A NODE FROM THE NETWORK GRID</p>
              </div>
            )}
          </div>
        </>
      )}
      </div>

      {detachedPanels.console && detachedModes.console === "portal" && (
        <DetachedWindowPortal title="NetSentinel - Console Logs" onClose={() => void dockPanel("console")} width={980} height={420}>
          <DetachedShell title="CONSOLE" dockAria="DOCK_CONSOLE" onDock={() => void dockPanel("console")}>
            <ConsoleLogs logs={systemLogs} devices={devices} selectedDevice={selectedDevice} jammedIps={jammedDevices} onClearSystemLogs={clearSystemLogs} />
          </DetachedShell>
        </DetachedWindowPortal>
      )}

      {detachedPanels.device && detachedModes.device === "portal" && selectedDevice && (
        <DetachedWindowPortal title={`NetSentinel - Device ${selectedDevice.ip}`} onClose={() => void dockPanel("device")} width={520} height={760}>
          <DetachedShell title="DEVICE" dockAria="DOCK_DEVICE" onDock={() => void dockPanel("device")}>
            <div style={{ width: "100%", height: "100%", background: "#020202" }}>
              <Suspense fallback={null}>
                <DeviceDetailPanel
                  device={selectedDevice}
                  auditResults={auditResults}
                  consoleLogs={consoleLogs}
                  auditing={auditing}
                  onAudit={() => startAudit(selectedDevice.ip)}
                  isJammed={jammedDevices.includes(selectedDevice.ip)}
                  isJamPending={jamPendingDevices.includes(selectedDevice.ip)}
                  onToggleJam={() => toggleJammer(selectedDevice.ip)}
                  onRouterAudit={checkRouterSecurity}
                  onOpenLabAudit={onOpenLabAudit}
                />
              </Suspense>
            </div>
          </DetachedShell>
        </DetachedWindowPortal>
      )}

      {detachedPanels.radar && detachedModes.radar === "portal" && showRadar && (
        <DetachedWindowPortal title="NetSentinel - Radar" onClose={() => void dockPanel("radar")} width={860} height={680}>
          <DetachedShell title="RADAR" dockAria="DOCK_RADAR" onDock={() => void dockPanel("radar")}>
            <Suspense fallback={null}>
              <RadarPanel onClose={() => setShowRadar(false)} />
            </Suspense>
          </DetachedShell>
        </DetachedWindowPortal>
      )}

      {detachedPanels.attack_lab && detachedModes.attack_lab === "portal" && showAttackLab && (
        <DetachedWindowPortal title="NetSentinel - Attack Lab" onClose={() => void dockPanel("attack_lab")} width={860} height={680}>
          <DetachedShell title="ATTACK LAB" dockAria="DOCK_ATTACK_LAB" onDock={() => void dockPanel("attack_lab")}>
            <Suspense fallback={null}>
              <AttackLabPanel
                onClose={closeAttackLab}
                targetDevice={attackLabTarget}
                identity={identity}
                defaultScenarioId={attackLabScenarioId}
                autoRunToken={attackLabAutoRunToken}
                embedded={true}
              />
            </Suspense>
          </DetachedShell>
        </DetachedWindowPortal>
      )}

      {detachedPanels.scene3d && detachedModes.scene3d === "portal" && (
        <DetachedWindowPortal title="NetSentinel - Network Scene" onClose={() => void dockPanel("scene3d")} width={1200} height={780}>
          <DetachedShell title="NETWORK SCENE" dockAria="DOCK_SCENE3D" onDock={() => void dockPanel("scene3d")}>
            <Suspense fallback={null}>
              <NetworkScene devices={devices} onDeviceSelect={selectDevice} selectedIp={selectedDevice?.ip} intruders={intruders} identity={identity} />
            </Suspense>
          </DetachedShell>
        </DetachedWindowPortal>
      )}

      {detachedPanels.settings && detachedModes.settings === "portal" && showSettings && (
        <DetachedWindowPortal title="NetSentinel - Settings / Field Manual" onClose={() => void dockPanel("settings")} width={980} height={740}>
          <DetachedShell title="SETTINGS" dockAria="DOCK_SETTINGS" onDock={() => void dockPanel("settings")}>
            <Suspense fallback={null}>
              <SettingsPanel onClose={() => setShowSettings(false)} />
            </Suspense>
          </DetachedShell>
        </DetachedWindowPortal>
      )}
    </div>
  );
};
