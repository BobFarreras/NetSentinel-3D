// src/ui/components/layout/DetachedPanelView.tsx
// Vista contenedora para ventanas desacopladas: monta el panel adecuado segun el contexto parseado desde la URL.

import { lazy, Suspense } from "react";
import { ConsoleLogs } from "../../features/console_logs/components/ConsoleLogs";
import type { DeviceDTO, HostIdentity, OpenPortDTO } from "../../../shared/dtos/NetworkDTOs";

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

interface DetachedPanelViewProps {
  panel: "console" | "device" | "radar" | "attack_lab" | "scene3d";
  detachedPanelReady: boolean;
  systemLogs: string[];
  devices: DeviceDTO[];
  selectedDevice: DeviceDTO | null;
  clearSystemLogs: () => void;
  detachedTargetDevice: DeviceDTO | null;
  auditResults: OpenPortDTO[];
  consoleLogs: string[];
  auditing: boolean;
  startAudit: (ip: string) => void;
  jammedDevices: string[];
  jamPendingDevices: string[];
  toggleJammer: (ip: string) => void;
  checkRouterSecurity: (ip: string) => void;
  onOpenLabAudit: (d: DeviceDTO) => void;
  detachedAttackLabTargetDevice: DeviceDTO | null;
  identity: HostIdentity | null;
  detachedAttackLabScenario: string | null;
  detachedAttackLabAutoRunToken: number;
  intruders: string[];
  selectDevice: (d: DeviceDTO | null) => void;
}

export const DetachedPanelView = ({
  panel,
  detachedPanelReady,
  systemLogs,
  devices,
  selectedDevice,
  clearSystemLogs,
  detachedTargetDevice,
  auditResults,
  consoleLogs,
  auditing,
  startAudit,
  jammedDevices,
  jamPendingDevices,
  toggleJammer,
  checkRouterSecurity,
  onOpenLabAudit,
  detachedAttackLabTargetDevice,
  identity,
  detachedAttackLabScenario,
  detachedAttackLabAutoRunToken,
  intruders,
  selectDevice,
}: DetachedPanelViewProps) => {
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
            {panel === "attack_lab" && (
              <Suspense fallback={null}>
                <AttackLabPanel
                  key={`detached-attack-lab-${detachedAttackLabAutoRunToken}-${detachedAttackLabTargetDevice?.ip || "none"}-${detachedAttackLabScenario || "none"}`}
                  onClose={() => {}}
                  targetDevice={detachedAttackLabTargetDevice}
                  identity={identity}
                  defaultScenarioId={detachedAttackLabScenario}
                  autoRun={Boolean(detachedAttackLabTargetDevice && detachedAttackLabScenario)}
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
                    isJamPending={jamPendingDevices.includes(detachedTargetDevice.ip)}
                    onToggleJam={() => toggleJammer(detachedTargetDevice.ip)}
                    onRouterAudit={checkRouterSecurity}
                    onOpenLabAudit={onOpenLabAudit}
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
};
