// src/ui/components/layout/main_docked/DockedLeftArea.tsx
// Area docked izquierda: renderiza Radar/Attack Lab/Settings con split doble/triple y separadores redimensionables.

import React, { Suspense, lazy } from "react";
import type { DeviceDTO, HostIdentity } from "../../../../shared/dtos/NetworkDTOs";
import { getRouterCandidates } from "../../../utils/routerCandidates";
import { DockHeader } from "./PanelHeaders";
import type { DetachablePanelId } from "../../../../adapters/windowingAdapter";

const RadarPanel = lazy(async () => {
  const mod = await import("../../../features/radar/components/RadarPanel");
  return { default: mod.RadarPanel };
});

const AttackLabPanel = lazy(async () => {
  const mod = await import("../../../features/attack_lab/panel/AttackLabPanel");
  return { default: mod.AttackLabPanel };
});

const SettingsPanel = lazy(async () => {
  const mod = await import("../../../features/settings/components/SettingsPanel");
  return { default: mod.SettingsPanel };
});

export const DockedLeftArea: React.FC<{
  showDockRadar: boolean;
  showDockAttackLab: boolean;
  showDockSettings: boolean;
  showDockScene: boolean;
  radarWidth: number;
  dockSplitRatio: number;
  dockTripleLeftRatio: number;
  dockTripleRightRatio: number;
  dockSettingsSplitRatio: number;
  startResizingDockSplit: (e: React.MouseEvent) => void;
  startResizingDockSettingsSplit: (e: React.MouseEvent) => void;
  startResizingDockTripleLeft: (e: React.MouseEvent) => void;
  startResizingDockTripleRight: (e: React.MouseEvent) => void;
  startResizingRadar: (e: React.MouseEvent) => void;
  undockPanel: (panel: DetachablePanelId) => void;
  closeAttackLab: () => void;
  setShowRadar: (next: boolean) => void;
  setShowSettings: (next: boolean) => void;
  identity: HostIdentity | null;
  devices: DeviceDTO[];
  attackLabTarget: DeviceDTO | null;
  attackLabScenarioId: string | null;
  attackLabAutoRunToken: number;
  undockTitle: string;
  closeTitle: string;
}> = ({
  showDockRadar,
  showDockAttackLab,
  showDockSettings,
  showDockScene,
  radarWidth,
  dockSplitRatio,
  dockTripleLeftRatio,
  dockTripleRightRatio,
  dockSettingsSplitRatio,
  startResizingDockSplit,
  startResizingDockSettingsSplit,
  startResizingDockTripleLeft,
  startResizingDockTripleRight,
  startResizingRadar,
  undockPanel,
  closeAttackLab,
  setShowRadar,
  setShowSettings,
  identity,
  devices,
  attackLabTarget,
  attackLabScenarioId,
  attackLabAutoRunToken,
  undockTitle,
  closeTitle,
}) => {
  const showDockArea = showDockRadar || showDockAttackLab || showDockSettings;
  if (!showDockArea) return null;

  return (
    <>
      <div style={{ width: showDockScene ? `${radarWidth}px` : "100%", minWidth: 360, minHeight: 0, background: "#000", overflow: "hidden", zIndex: 12, display: "flex" }}>
        {showDockSettings && showDockRadar && showDockAttackLab ? (
          // Triple split: Radar | Attack Lab | Settings. Cada uno se ajusta con separadores.
          <div style={{ display: "flex", width: "100%", minHeight: 0 }}>
            <div style={{ width: `${dockTripleLeftRatio * 100}%`, minWidth: 220, display: "flex", flexDirection: "column", minHeight: 0 }}>
              <DockHeader title="RADAR" onUndock={() => void undockPanel("radar")} onClose={() => setShowRadar(false)} undockTitle={undockTitle} closeTitle={closeTitle} />
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
              <DockHeader title="ATTACK LAB" onUndock={() => void undockPanel("attack_lab")} onClose={closeAttackLab} undockTitle={undockTitle} closeTitle={closeTitle} />
              <div style={{ flex: 1, minHeight: 0 }}>
                <Suspense fallback={null}>
                  <AttackLabPanel
                    onClose={closeAttackLab}
                    targetDevice={attackLabTarget}
                    availableDevices={devices}
                    availableRouters={getRouterCandidates(devices, identity)}
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
              <DockHeader title="SETTINGS" onUndock={() => void undockPanel("settings")} onClose={() => setShowSettings(false)} undockTitle={undockTitle} closeTitle={closeTitle} />
              <div style={{ flex: 1, minHeight: 0 }}>
                <Suspense fallback={null}>
                  <SettingsPanel onClose={() => setShowSettings(false)} identity={identity} />
                </Suspense>
              </div>
            </div>
          </div>
        ) : showDockSettings && showDockRadar && !showDockAttackLab ? (
          // Split 2 columnas: Radar | Settings (con resize independiente).
          <div style={{ display: "flex", width: "100%", minHeight: 0 }}>
            <div style={{ width: `${dockSettingsSplitRatio * 100}%`, minWidth: 260, minHeight: 0, display: "flex", flexDirection: "column" }}>
              <DockHeader title="RADAR" onUndock={() => void undockPanel("radar")} onClose={() => setShowRadar(false)} undockTitle={undockTitle} closeTitle={closeTitle} />
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
              <DockHeader title="SETTINGS" onUndock={() => void undockPanel("settings")} onClose={() => setShowSettings(false)} undockTitle={undockTitle} closeTitle={closeTitle} />
              <div style={{ flex: 1, minHeight: 0 }}>
                <Suspense fallback={null}>
                  <SettingsPanel onClose={() => setShowSettings(false)} identity={identity} />
                </Suspense>
              </div>
            </div>
          </div>
        ) : showDockSettings && showDockAttackLab && !showDockRadar ? (
          // Split 2 columnas: Attack Lab | Settings (con resize independiente).
          <div style={{ display: "flex", width: "100%", minHeight: 0 }}>
            <div style={{ width: `${dockSettingsSplitRatio * 100}%`, minWidth: 260, minHeight: 0, display: "flex", flexDirection: "column" }}>
              <DockHeader title="ATTACK LAB" onUndock={() => void undockPanel("attack_lab")} onClose={closeAttackLab} undockTitle={undockTitle} closeTitle={closeTitle} />
              <div style={{ flex: 1, minHeight: 0 }}>
                <Suspense fallback={null}>
                  <AttackLabPanel
                    onClose={closeAttackLab}
                    targetDevice={attackLabTarget}
                    availableDevices={devices}
                    availableRouters={getRouterCandidates(devices, identity)}
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
              <DockHeader title="SETTINGS" onUndock={() => void undockPanel("settings")} onClose={() => setShowSettings(false)} undockTitle={undockTitle} closeTitle={closeTitle} />
              <div style={{ flex: 1, minHeight: 0 }}>
                <Suspense fallback={null}>
                  <SettingsPanel onClose={() => setShowSettings(false)} identity={identity} />
                </Suspense>
              </div>
            </div>
          </div>
        ) : showDockSettings ? (
          <div style={{ width: "100%", minHeight: 0, display: "flex", flexDirection: "column" }}>
            <DockHeader title="SETTINGS" onUndock={() => void undockPanel("settings")} onClose={() => setShowSettings(false)} undockTitle={undockTitle} closeTitle={closeTitle} />
            <div style={{ flex: 1, minHeight: 0 }}>
              <Suspense fallback={null}>
                <SettingsPanel onClose={() => setShowSettings(false)} identity={identity} />
              </Suspense>
            </div>
          </div>
        ) : showDockRadar && showDockAttackLab ? (
          <>
            <div style={{ width: `${dockSplitRatio * 100}%`, minWidth: 200, display: "flex", flexDirection: "column" }}>
              <DockHeader title="RADAR" onUndock={() => void undockPanel("radar")} onClose={() => setShowRadar(false)} undockTitle={undockTitle} closeTitle={closeTitle} />
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
              <DockHeader title="ATTACK LAB" onUndock={() => void undockPanel("attack_lab")} onClose={closeAttackLab} undockTitle={undockTitle} closeTitle={closeTitle} />
              <div style={{ flex: 1, minHeight: 0 }}>
                <Suspense fallback={null}>
                  <AttackLabPanel
                    onClose={closeAttackLab}
                    targetDevice={attackLabTarget}
                    availableDevices={devices}
                    availableRouters={getRouterCandidates(devices, identity)}
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
            <DockHeader title="RADAR" onUndock={() => void undockPanel("radar")} onClose={() => setShowRadar(false)} undockTitle={undockTitle} closeTitle={closeTitle} />
            <div style={{ flex: 1, minHeight: 0 }}>
              <Suspense fallback={null}>
                <RadarPanel onClose={() => setShowRadar(false)} />
              </Suspense>
            </div>
          </div>
        ) : (
          <div style={{ width: "100%", minHeight: 0, display: "flex", flexDirection: "column" }}>
            <DockHeader title="ATTACK LAB" onUndock={() => void undockPanel("attack_lab")} onClose={closeAttackLab} undockTitle={undockTitle} closeTitle={closeTitle} />
            <div style={{ flex: 1, minHeight: 0 }}>
              <Suspense fallback={null}>
                <AttackLabPanel
                  onClose={closeAttackLab}
                  targetDevice={attackLabTarget}
                  availableDevices={devices}
                  availableRouters={getRouterCandidates(devices, identity)}
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
  );
};

