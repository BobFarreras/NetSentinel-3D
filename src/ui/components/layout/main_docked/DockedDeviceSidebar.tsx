// src/ui/components/layout/main_docked/DockedDeviceSidebar.tsx
// Sidebar docked: panel de detalle del dispositivo seleccionado y separador redimensionable.

import React, { Suspense, lazy } from "react";
import type { DeviceDTO, HostIdentity, OpenPortDTO } from "../../../../shared/dtos/NetworkDTOs";
import { InlinePanelHeader } from "./PanelHeaders";
import type { DetachablePanelId } from "../../../../adapters/windowingAdapter";
import type { I18nKey } from "../../../i18n";

const DeviceDetailPanel = lazy(async () => {
  const mod = await import("../../../features/device_detail/components/DeviceDetailPanel");
  return { default: mod.DeviceDetailPanel };
});

export const DockedDeviceSidebar: React.FC<{
  show: boolean;
  sidebarWidth: number;
  startResizingSidebar: (e: React.MouseEvent) => void;
  selectedDevice: DeviceDTO | null;
  selectDevice: (device: DeviceDTO | null) => void;
  undockPanel: (panel: DetachablePanelId) => void;
  undockTitle: string;
  closeTitle: string;
  t: (k: I18nKey) => string;
  auditResults: OpenPortDTO[];
  consoleLogs: string[];
  auditing: boolean;
  startAudit: (ip: string) => void;
  jammedDevices: string[];
  jamPendingDevices: string[];
  toggleJammer: (ip: string) => void;
  checkRouterSecurity: (ip: string) => void;
  onOpenLabAudit: (device: DeviceDTO) => void;
  identity: HostIdentity | null;
}> = ({
  show,
  sidebarWidth,
  startResizingSidebar,
  selectedDevice,
  selectDevice,
  undockPanel,
  undockTitle,
  closeTitle,
  t,
  auditResults,
  consoleLogs,
  auditing,
  startAudit,
  jammedDevices,
  jamPendingDevices,
  toggleJammer,
  checkRouterSecurity,
  onOpenLabAudit,
}) => {
  if (!show) return null;
  return (
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
            <InlinePanelHeader title="DEVICE" onUndock={() => void undockPanel("device")} onClose={() => selectDevice(null)} undockTitle={undockTitle} closeTitle={closeTitle} />
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
            <h3 style={{ fontSize: "1.5rem", marginBottom: 10, color: "#0f0" }}>{t("layout.awaitingTarget.title")}</h3>
            <p style={{ fontSize: "1rem", opacity: 0.7 }}>{t("layout.awaitingTarget.subtitle")}</p>
          </div>
        )}
      </div>
    </>
  );
};

