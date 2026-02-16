// src/ui/components/layout/MainDockedLayout.tsx
// Layout principal acoplado: organiza HUD/Scene/Console y paneles laterales con soporte de docking/undocking.

import type React from "react";
import type { DeviceDTO, HostIdentity, OpenPortDTO } from "../../../shared/dtos/NetworkDTOs";
import { TopBar } from "./TopBar";
import { HistoryPanel } from "../../features/history/components/HistoryPanel";
import type { DetachablePanelId } from "../../../adapters/windowingAdapter";
import { DockedLeftArea } from "./main_docked/DockedLeftArea";
import { DockedScene } from "./main_docked/DockedScene";
import { DockedConsole } from "./main_docked/DockedConsole";
import { DockedDeviceSidebar } from "./main_docked/DockedDeviceSidebar";
import { DetachedPanels } from "./main_docked/DetachedPanels";
import { useMainDockedLayoutTitles } from "./main_docked/useMainDockedLayoutTitles";
import { mainDockedBodyStyle, mainDockedCenterColStyle, mainDockedCenterTopStyle, mainDockedRootStyle } from "./main_docked/mainDockedLayoutStyles";

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
  const titles = useMainDockedLayoutTitles();

  return (
    <div style={mainDockedRootStyle({ isResizing })}>
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

      <div style={mainDockedBodyStyle}>
        <div style={mainDockedCenterColStyle}>
          <div style={mainDockedCenterTopStyle}>
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
              undockTitle={titles.undockTitle}
              closeTitle={titles.closeTitle}
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
          undockTitle={titles.undockTitle}
          closeTitle={titles.closeTitle}
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
          undockTitle={titles.undockTitle}
          closeTitle={titles.closeTitle}
          t={titles.t}
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
        dockTitle={titles.dockTitle}
        detachedConsoleTitle={titles.detachedConsoleTitle}
        detachedDeviceTitlePrefix={titles.detachedDeviceTitlePrefix}
        detachedRadarTitle={titles.detachedRadarTitle}
        detachedAttackLabTitle={titles.detachedAttackLabTitle}
        detachedSceneTitle={titles.detachedSceneTitle}
        detachedSettingsTitle={titles.detachedSettingsTitle}
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
