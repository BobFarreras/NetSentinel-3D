// src/ui/components/layout/main_docked/DockedConsole.tsx
// Consola docked: panel inferior con header y componente ConsoleLogs, con separador redimensionable.

import React from "react";
import type { DeviceDTO } from "../../../../shared/dtos/NetworkDTOs";
import { ConsoleLogs } from "../../../features/console_logs/components/ConsoleLogs";
import { InlinePanelHeader } from "./PanelHeaders";
import type { DetachablePanelId } from "../../../../adapters/windowingAdapter";

export const DockedConsole: React.FC<{
  show: boolean;
  consoleHeight: number;
  startResizingConsole: (e: React.MouseEvent) => void;
  undockPanel: (panel: DetachablePanelId) => void;
  undockTitle: string;
  closeTitle: string;
  systemLogs: string[];
  devices: DeviceDTO[];
  selectedDevice: DeviceDTO | null;
  jammedDevices: string[];
  clearSystemLogs: () => void;
}> = ({
  show,
  consoleHeight,
  startResizingConsole,
  undockPanel,
  undockTitle,
  closeTitle,
  systemLogs,
  devices,
  selectedDevice,
  jammedDevices,
  clearSystemLogs,
}) => {
  if (!show) return null;
  return (
    <>
      <div
        onMouseDown={startResizingConsole}
        style={{ height: "2px", background: "#004400", cursor: "row-resize", zIndex: 15, transition: "background 0.2s" }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "#00ff00")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "#004400")}
      />

      <div style={{ height: `${consoleHeight}px`, minHeight: 0, zIndex: 10, boxShadow: "0 -5px 20px rgba(0,0,0,0.5)", background: "#000", position: "relative" }}>
        <div style={{ height: "100%", display: "flex", flexDirection: "column", minHeight: 0 }}>
          <InlinePanelHeader title="CONSOLE" onUndock={() => void undockPanel("console")} undockTitle={undockTitle} closeTitle={closeTitle} />
          <div style={{ flex: 1, minHeight: 0 }}>
            <ConsoleLogs logs={systemLogs} devices={devices} selectedDevice={selectedDevice} jammedIps={jammedDevices} onClearSystemLogs={clearSystemLogs} />
          </div>
        </div>
      </div>
    </>
  );
};

