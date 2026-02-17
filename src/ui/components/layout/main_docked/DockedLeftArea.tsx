// src/ui/components/layout/main_docked/DockedLeftArea.tsx
// Area docked izquierda: renderiza Radar/Attack Lab/Settings con split doble/triple y separadores redimensionables.

import React, { lazy } from "react";
import type { DeviceDTO, HostIdentity } from "../../../../shared/dtos/NetworkDTOs";
import { getRouterCandidates } from "../../../utils/routerCandidates";
import type { DetachablePanelId } from "../../../../adapters/windowingAdapter";
import { DockedPanelSlot } from "./left_area/DockedPanelSlot";
import { ResizeHandle } from "./left_area/ResizeHandle";

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

  const routerCandidates = getRouterCandidates(devices, identity);

  const radarSlot = (widthCss?: string, minWidthPx: number = 220) => (
    <DockedPanelSlot
      title="RADAR"
      panelId="radar"
      onUndock={undockPanel}
      onClose={() => setShowRadar(false)}
      undockTitle={undockTitle}
      closeTitle={closeTitle}
      minWidthPx={minWidthPx}
      widthCss={widthCss}
    >
      <RadarPanel onClose={() => setShowRadar(false)} />
    </DockedPanelSlot>
  );

  const attackLabSlot = (widthCss?: string, minWidthPx: number = 240) => (
    <DockedPanelSlot
      title="ATTACK LAB"
      panelId="attack_lab"
      onUndock={undockPanel}
      onClose={closeAttackLab}
      undockTitle={undockTitle}
      closeTitle={closeTitle}
      minWidthPx={minWidthPx}
      widthCss={widthCss}
    >
      <AttackLabPanel
        onClose={closeAttackLab}
        targetDevice={attackLabTarget}
        availableDevices={devices}
        availableRouters={routerCandidates}
        identity={identity}
        defaultScenarioId={attackLabScenarioId}
        autoRunToken={attackLabAutoRunToken}
        embedded={true}
      />
    </DockedPanelSlot>
  );

  const settingsSlot = (widthCss?: string, minWidthPx: number = 300) => (
    <DockedPanelSlot
      title="SETTINGS"
      panelId="settings"
      onUndock={undockPanel}
      onClose={() => setShowSettings(false)}
      undockTitle={undockTitle}
      closeTitle={closeTitle}
      minWidthPx={minWidthPx}
      widthCss={widthCss}
    >
      <SettingsPanel onClose={() => setShowSettings(false)} identity={identity} />
    </DockedPanelSlot>
  );

  return (
    <>
      <div style={{ width: showDockScene ? `${radarWidth}px` : "100%", minWidth: 360, minHeight: 0, background: "#000", overflow: "hidden", zIndex: 12, display: "flex" }}>
        {showDockSettings && showDockRadar && showDockAttackLab ? (
          // Triple split: Radar | Attack Lab | Settings. Cada uno se ajusta con separadores.
          <div style={{ display: "flex", width: "100%", minHeight: 0 }}>
            {radarSlot(`${dockTripleLeftRatio * 100}%`, 220)}
            <ResizeHandle
              onMouseDown={startResizingDockTripleLeft}
              widthPx={4}
              bg="#003300"
              hoverBg="#00ff00"
              ariaLabel="RESIZE_DOCK_TRIPLE_LEFT"
              zIndex={25}
            />
            {attackLabSlot(`${(dockTripleRightRatio - dockTripleLeftRatio) * 100}%`, 240)}
            <ResizeHandle
              onMouseDown={startResizingDockTripleRight}
              widthPx={4}
              bg="#003300"
              hoverBg="#00ff00"
              ariaLabel="RESIZE_DOCK_TRIPLE_RIGHT"
              zIndex={25}
            />
            {settingsSlot(`${(1 - dockTripleRightRatio) * 100}%`, 300)}
          </div>
        ) : showDockSettings && showDockRadar && !showDockAttackLab ? (
          // Split 2 columnas: Radar | Settings (con resize independiente).
          <div style={{ display: "flex", width: "100%", minHeight: 0 }}>
            {radarSlot(`${dockSettingsSplitRatio * 100}%`, 260)}
            <ResizeHandle
              onMouseDown={startResizingDockSettingsSplit}
              widthPx={4}
              bg="#003300"
              hoverBg="#00ff00"
              ariaLabel="RESIZE_DOCK_SETTINGS_SPLIT"
              zIndex={25}
            />
            {settingsSlot(`${(1 - dockSettingsSplitRatio) * 100}%`, 320)}
          </div>
        ) : showDockSettings && showDockAttackLab && !showDockRadar ? (
          // Split 2 columnas: Attack Lab | Settings (con resize independiente).
          <div style={{ display: "flex", width: "100%", minHeight: 0 }}>
            {attackLabSlot(`${dockSettingsSplitRatio * 100}%`, 260)}
            <ResizeHandle
              onMouseDown={startResizingDockSettingsSplit}
              widthPx={4}
              bg="#003300"
              hoverBg="#00ff00"
              ariaLabel="RESIZE_DOCK_SETTINGS_SPLIT"
              zIndex={25}
            />
            {settingsSlot(`${(1 - dockSettingsSplitRatio) * 100}%`, 320)}
          </div>
        ) : showDockSettings ? (
          settingsSlot("100%", 320)
        ) : showDockRadar && showDockAttackLab ? (
          <>
            {radarSlot(`${dockSplitRatio * 100}%`, 200)}
            <ResizeHandle
              onMouseDown={startResizingDockSplit}
              widthPx={4}
              bg="#003300"
              hoverBg="#00ff00"
              ariaLabel="RESIZE_DOCK_SPLIT"
              zIndex={25}
            />
            {attackLabSlot(`${(1 - dockSplitRatio) * 100}%`, 200)}
          </>
        ) : showDockRadar ? (
          radarSlot("100%", 220)
        ) : (
          attackLabSlot("100%", 240)
        )}
      </div>
      {showDockScene && (
        <ResizeHandle onMouseDown={startResizingRadar} widthPx={2} bg="#004400" hoverBg="#00ff00" zIndex={13} />
      )}
    </>
  );
};
