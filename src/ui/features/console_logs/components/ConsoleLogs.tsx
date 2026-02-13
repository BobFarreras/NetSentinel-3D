// src/ui/features/console_logs/components/ConsoleLogs.tsx
// Panel Console Logs: composicion de pestañas (SYSTEM/TRAFFIC/RADAR) y render de vistas con su estado asociado.

import React from "react";
import type { DeviceDTO } from "../../../../shared/dtos/NetworkDTOs";
import { TrafficPanel } from "../../../components/panels/TrafficPanel";
import { HUD_TYPO } from "../../../styles/hudTokens";
import { useConsoleLogsState } from "../hooks/useConsoleLogsState";
import { ConsoleLogsHeader } from "./ConsoleLogsHeader";
import { CONSOLE_COLORS } from "./consoleLogsStyles";
import { RadarLogsView } from "./RadarLogsView";
import { SystemLogsView } from "./SystemLogsView";

interface ConsoleLogsProps {
  logs: string[];
  devices: DeviceDTO[];
  selectedDevice?: DeviceDTO | null;
  onClearSystemLogs: () => void;
}

export const ConsoleLogs: React.FC<ConsoleLogsProps> = ({ logs, devices, selectedDevice, onClearSystemLogs }) => {
  const state = useConsoleLogsState();

  return (
    <div
      style={{
        height: "100%",
        minHeight: 0,
        background: CONSOLE_COLORS.bg,
        borderTop: `2px solid ${CONSOLE_COLORS.border}`,
        display: "flex",
        flexDirection: "column",
        padding: "0 5px",
        fontFamily: HUD_TYPO.mono,
      }}
    >
      <style>{`
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #001100; }
        ::-webkit-scrollbar-thumb { background: #0a3a2a; }
        ::-webkit-scrollbar-thumb:hover { background: #00ff88; }
      `}</style>

      <ConsoleLogsHeader
        activeTab={state.activeTab}
        isTrafficActive={state.traffic.isActive}
        trafficSpeed={state.traffic.speed}
        isLoading={state.isLoading}
        onSelectTab={state.setActiveTab}
        onToggleTraffic={() => {
          void state.handleToggleTraffic();
        }}
        onClear={() => state.handleClearByTab(onClearSystemLogs)}
      />

      <div style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
        {state.activeTab === "SYSTEM" ? (
          <SystemLogsView logs={logs} />
        ) : state.activeTab === "RADAR" ? (
          <RadarLogsView
            logs={state.radar.logs}
            selectedBssid={state.wifiSel.selectedBssid}
            onSelectBssid={state.wifiSel.setSelectedBssid}
          />
        ) : (
          <TrafficPanel
            isActive={state.traffic.isActive}
            speed={state.traffic.speed}
            packets={state.traffic.packets}
            jammedPackets={state.traffic.jammedPackets}
            devices={devices}
            selectedDevice={selectedDevice}
            compactMode={true}
            onToggle={() => {}}
            onClear={state.traffic.clearPackets}
          />
        )}
      </div>
    </div>
  );
};
