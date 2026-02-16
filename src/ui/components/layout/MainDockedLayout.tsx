// src/ui/components/layout/MainDockedLayout.tsx
// Layout principal acoplado: organiza HUD/Scene/Console y paneles laterales con soporte de docking/undocking.

import type React from "react";
import type { DeviceDTO, HostIdentity, OpenPortDTO } from "../../../shared/dtos/NetworkDTOs";
import { TopBar } from "./TopBar";
import { HistoryPanel } from "../../features/history/components/HistoryPanel";
import type { DetachablePanelId } from "../../../adapters/windowingAdapter";
import { useI18n } from "../../i18n";
import { DockedLeftArea } from "./main_docked/DockedLeftArea";
import { DockedScene } from "./main_docked/DockedScene";
import { DockedConsole } from "./main_docked/DockedConsole";
import { DockedDeviceSidebar } from "./main_docked/DockedDeviceSidebar";
import { DetachedPanels } from "./main_docked/DetachedPanels";

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
  const { t } = useI18n();
  const undockTitle = t("common.undockPanel");
  const closeTitle = t("common.closePanel");
  const dockTitle = t("common.dockPanel");
  const detachedConsoleTitle = t("layout.detached.consoleTitle");
  const detachedDeviceTitlePrefix = t("layout.detached.deviceTitlePrefix");
  const detachedRadarTitle = t("layout.detached.radarTitle");
  const detachedAttackLabTitle = t("layout.detached.attackLabTitle");
  const detachedSceneTitle = t("layout.detached.sceneTitle");
  const detachedSettingsTitle = t("layout.detached.settingsTitle");

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
            <DockedLeftArea
              showDockRadar={showDockRadar}
              showDockAttackLab={showDockAttackLab}
              showDockSettings={showDockSettings}
              showDockScene={showDockScene}
              radarWidth={radarWidth}
              dockSplitRatio={dockSplitRatio}
              dockTripleLeftRatio={dockTripleLeftRatio}
              dockTripleRightRatio={dockTripleRightRatio}
              dockSettingsSplitRatio={dockSettingsSplitRatio}
              startResizingDockSplit={startResizingDockSplit}
              startResizingDockSettingsSplit={startResizingDockSettingsSplit}
              startResizingDockTripleLeft={startResizingDockTripleLeft}
              startResizingDockTripleRight={startResizingDockTripleRight}
              startResizingRadar={startResizingRadar}
              undockPanel={undockPanel}
              closeAttackLab={closeAttackLab}
              setShowRadar={setShowRadar}
              setShowSettings={setShowSettings}
              identity={identity}
              devices={devices}
              attackLabTarget={attackLabTarget}
              attackLabScenarioId={attackLabScenarioId}
              attackLabAutoRunToken={attackLabAutoRunToken}
              undockTitle={undockTitle}
              closeTitle={closeTitle}
            />

            <DockedScene
              show={showDockScene}
              devices={devices}
              onDeviceSelect={selectDevice}
              selectedIp={selectedDevice?.ip}
              intruders={intruders}
              jammedIps={jammedDevices}
              identity={identity}
              onUndock={() => void undockPanel("scene3d")}
            />
          </div>
        </div>

        <DockedConsole
          show={showDockConsole}
          consoleHeight={consoleHeight}
          startResizingConsole={startResizingConsole}
          undockPanel={undockPanel}
          undockTitle={undockTitle}
          closeTitle={closeTitle}
          systemLogs={systemLogs}
          devices={devices}
          selectedDevice={selectedDevice}
          jammedDevices={jammedDevices}
          clearSystemLogs={clearSystemLogs}
        />
        </div>

        <DockedDeviceSidebar
          show={showDockDevice}
          sidebarWidth={sidebarWidth}
          startResizingSidebar={startResizingSidebar}
          selectedDevice={selectedDevice}
          selectDevice={selectDevice}
          undockPanel={undockPanel}
          undockTitle={undockTitle}
          closeTitle={closeTitle}
          t={t}
          auditResults={auditResults}
          consoleLogs={consoleLogs}
          auditing={auditing}
          startAudit={startAudit}
          jammedDevices={jammedDevices}
          jamPendingDevices={jamPendingDevices}
          toggleJammer={toggleJammer}
          checkRouterSecurity={checkRouterSecurity}
          onOpenLabAudit={onOpenLabAudit}
          identity={identity}
        />
      </div>

      <DetachedPanels
        detachedPanels={detachedPanels}
        detachedModes={detachedModes}
        dockPanel={dockPanel}
        dockTitle={dockTitle}
        detachedConsoleTitle={detachedConsoleTitle}
        detachedDeviceTitlePrefix={detachedDeviceTitlePrefix}
        detachedRadarTitle={detachedRadarTitle}
        detachedAttackLabTitle={detachedAttackLabTitle}
        detachedSceneTitle={detachedSceneTitle}
        detachedSettingsTitle={detachedSettingsTitle}
        systemLogs={systemLogs}
        devices={devices}
        selectedDevice={selectedDevice}
        selectDevice={selectDevice}
        jammedDevices={jammedDevices}
        clearSystemLogs={clearSystemLogs}
        showRadar={showRadar}
        setShowRadar={setShowRadar}
        showAttackLab={showAttackLab}
        closeAttackLab={closeAttackLab}
        attackLabTarget={attackLabTarget}
        attackLabScenarioId={attackLabScenarioId}
        attackLabAutoRunToken={attackLabAutoRunToken}
        identity={identity}
        showSettings={showSettings}
        setShowSettings={setShowSettings}
        intruders={intruders}
        auditResults={auditResults}
        consoleLogs={consoleLogs}
        auditing={auditing}
        startAudit={startAudit}
        jamPendingDevices={jamPendingDevices}
        toggleJammer={toggleJammer}
        checkRouterSecurity={checkRouterSecurity}
        onOpenLabAudit={onOpenLabAudit}
      />
    </div>
  );
};
