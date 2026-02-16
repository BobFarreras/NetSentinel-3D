// src/ui/components/layout/main_docked/DetachedPanels.tsx
// Ventanas desacopladas: renderiza DetachedWindowPortal para cada panel cuando el modo detached es "portal".

import React, { Suspense, lazy } from "react";
import type { DeviceDTO, HostIdentity, OpenPortDTO } from "../../../../shared/dtos/NetworkDTOs";
import { DetachedWindowPortal } from "../DetachedWindowPortal";
import { DetachedShell } from "./PanelHeaders";
import type { DetachablePanelId } from "../../../../adapters/windowingAdapter";
import { getRouterCandidates } from "../../../utils/routerCandidates";
import { ConsoleLogs } from "../../../features/console_logs/components/ConsoleLogs";

const NetworkScene = lazy(async () => {
  const mod = await import("../../../features/scene3d/components/NetworkScene");
  return { default: mod.NetworkScene };
});

const DeviceDetailPanel = lazy(async () => {
  const mod = await import("../../../features/device_detail/components/DeviceDetailPanel");
  return { default: mod.DeviceDetailPanel };
});

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

export const DetachedPanels: React.FC<{
  detachedPanels: Record<DetachablePanelId, boolean>;
  detachedModes: Record<DetachablePanelId, "portal" | "tauri" | null>;
  dockPanel: (panel: DetachablePanelId) => void;
  dockTitle: string;
  detachedConsoleTitle: string;
  detachedDeviceTitlePrefix: string;
  detachedRadarTitle: string;
  detachedAttackLabTitle: string;
  detachedSceneTitle: string;
  detachedSettingsTitle: string;
  systemLogs: string[];
  devices: DeviceDTO[];
  selectedDevice: DeviceDTO | null;
  selectDevice: (device: DeviceDTO | null) => void;
  jammedDevices: string[];
  clearSystemLogs: () => void;
  showRadar: boolean;
  setShowRadar: (next: boolean) => void;
  showAttackLab: boolean;
  closeAttackLab: () => void;
  attackLabTarget: DeviceDTO | null;
  attackLabScenarioId: string | null;
  attackLabAutoRunToken: number;
  identity: HostIdentity | null;
  showSettings: boolean;
  setShowSettings: (next: boolean) => void;
  intruders: string[];
  auditResults: OpenPortDTO[];
  consoleLogs: string[];
  auditing: boolean;
  startAudit: (ip: string) => void;
  jamPendingDevices: string[];
  toggleJammer: (ip: string) => void;
  checkRouterSecurity: (ip: string) => void;
  onOpenLabAudit: (device: DeviceDTO) => void;
}> = ({
  detachedPanels,
  detachedModes,
  dockPanel,
  dockTitle,
  detachedConsoleTitle,
  detachedDeviceTitlePrefix,
  detachedRadarTitle,
  detachedAttackLabTitle,
  detachedSceneTitle,
  detachedSettingsTitle,
  systemLogs,
  devices,
  selectedDevice,
  selectDevice,
  jammedDevices,
  clearSystemLogs,
  showRadar,
  setShowRadar,
  showAttackLab,
  closeAttackLab,
  attackLabTarget,
  attackLabScenarioId,
  attackLabAutoRunToken,
  identity,
  showSettings,
  setShowSettings,
  intruders,
  auditResults,
  consoleLogs,
  auditing,
  startAudit,
  jamPendingDevices,
  toggleJammer,
  checkRouterSecurity,
  onOpenLabAudit,
}) => (
  <>
    {detachedPanels.console && detachedModes.console === "portal" && (
      <DetachedWindowPortal title={detachedConsoleTitle} onClose={() => void dockPanel("console")} width={980} height={420}>
        <DetachedShell title="CONSOLE" dockAria="DOCK_CONSOLE" onDock={() => void dockPanel("console")} dockTitle={dockTitle}>
          <ConsoleLogs logs={systemLogs} devices={devices} selectedDevice={selectedDevice} jammedIps={jammedDevices} onClearSystemLogs={clearSystemLogs} />
        </DetachedShell>
      </DetachedWindowPortal>
    )}

    {detachedPanels.device && detachedModes.device === "portal" && selectedDevice && (
      <DetachedWindowPortal title={`${detachedDeviceTitlePrefix} ${selectedDevice.ip}`} onClose={() => void dockPanel("device")} width={520} height={760}>
        <DetachedShell title="DEVICE" dockAria="DOCK_DEVICE" onDock={() => void dockPanel("device")} dockTitle={dockTitle}>
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
      <DetachedWindowPortal title={detachedRadarTitle} onClose={() => void dockPanel("radar")} width={860} height={680}>
        <DetachedShell title="RADAR" dockAria="DOCK_RADAR" onDock={() => void dockPanel("radar")} dockTitle={dockTitle}>
          <Suspense fallback={null}>
            <RadarPanel onClose={() => setShowRadar(false)} />
          </Suspense>
        </DetachedShell>
      </DetachedWindowPortal>
    )}

    {detachedPanels.attack_lab && detachedModes.attack_lab === "portal" && showAttackLab && (
      <DetachedWindowPortal title={detachedAttackLabTitle} onClose={() => void dockPanel("attack_lab")} width={860} height={680}>
        <DetachedShell title="ATTACK LAB" dockAria="DOCK_ATTACK_LAB" onDock={() => void dockPanel("attack_lab")} dockTitle={dockTitle}>
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
        </DetachedShell>
      </DetachedWindowPortal>
    )}

    {detachedPanels.scene3d && detachedModes.scene3d === "portal" && (
      <DetachedWindowPortal title={detachedSceneTitle} onClose={() => void dockPanel("scene3d")} width={1200} height={780}>
        <DetachedShell title="NETWORK SCENE" dockAria="DOCK_SCENE3D" onDock={() => void dockPanel("scene3d")} dockTitle={dockTitle}>
          <Suspense fallback={null}>
            <NetworkScene devices={devices} onDeviceSelect={selectDevice} selectedIp={selectedDevice?.ip} intruders={intruders} jammedIps={jammedDevices} identity={identity} />
          </Suspense>
        </DetachedShell>
      </DetachedWindowPortal>
    )}

    {detachedPanels.settings && detachedModes.settings === "portal" && showSettings && (
      <DetachedWindowPortal title={detachedSettingsTitle} onClose={() => void dockPanel("settings")} width={980} height={740}>
        <DetachedShell title="SETTINGS" dockAria="DOCK_SETTINGS" onDock={() => void dockPanel("settings")} dockTitle={dockTitle}>
          <Suspense fallback={null}>
            <SettingsPanel onClose={() => setShowSettings(false)} identity={identity} />
          </Suspense>
        </DetachedShell>
      </DetachedWindowPortal>
    )}
  </>
);

