// src/ui/components/panels/console_logs/ConsoleLogsHeader.tsx
import React from "react";
import type { ConsoleTab } from "../../../hooks/modules/useConsoleLogsState";
import { CONSOLE_COLORS, formatSpeed } from "./consoleLogsStyles";

type ConsoleLogsHeaderProps = {
  activeTab: ConsoleTab;
  isTrafficActive: boolean;
  trafficSpeed: number;
  isLoading: boolean;
  onSelectTab: (tab: ConsoleTab) => void;
  onToggleTraffic: () => void;
  onClear: () => void;
};

type TabButtonProps = {
  label: string;
  active: boolean;
  onClick: () => void;
};

const TabButton: React.FC<TabButtonProps> = ({ label, active, onClick }) => (
  <div
    onClick={onClick}
    style={{
      padding: "0 10px",
      cursor: "pointer",
      color: active ? CONSOLE_COLORS.accent : CONSOLE_COLORS.border,
      borderBottom: active ? `2px solid ${CONSOLE_COLORS.accent}` : "none",
      fontSize: "0.8rem",
      fontWeight: "bold",
      textShadow: active ? `0 0 4px ${CONSOLE_COLORS.accent}` : "none",
    }}
  >
    {label}
  </div>
);

export const ConsoleLogsHeader: React.FC<ConsoleLogsHeaderProps> = ({
  activeTab,
  isTrafficActive,
  trafficSpeed,
  isLoading,
  onSelectTab,
  onToggleTraffic,
  onClear,
}) => {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        height: "35px",
        borderBottom: `1px solid ${CONSOLE_COLORS.border}`,
        marginBottom: "5px",
      }}
    >
      <div style={{ display: "flex", gap: "10px" }}>
        <TabButton label="SYSTEM LOGS" active={activeTab === "SYSTEM"} onClick={() => onSelectTab("SYSTEM")} />
        <TabButton label="LIVE TRAFFIC" active={activeTab === "TRAFFIC"} onClick={() => onSelectTab("TRAFFIC")} />
        <TabButton label="RADAR LOGS" active={activeTab === "RADAR"} onClick={() => onSelectTab("RADAR")} />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        {activeTab === "TRAFFIC" && (
          <>
            <span
              style={{
                color: isTrafficActive ? CONSOLE_COLORS.cyan : "#444",
                fontSize: "0.8rem",
                textShadow: isTrafficActive ? `0 0 4px ${CONSOLE_COLORS.cyan}` : "none",
              }}
            >
              {isTrafficActive ? formatSpeed(trafficSpeed) : "OFFLINE"}
            </span>
            <button
              onClick={onToggleTraffic}
              disabled={isLoading}
              style={{
                background: isTrafficActive ? "#2a0a0a" : "#062012",
                color: isTrafficActive ? CONSOLE_COLORS.textErr : CONSOLE_COLORS.accent,
                border: `1px solid ${isTrafficActive ? CONSOLE_COLORS.textErr : CONSOLE_COLORS.accent}`,
                fontSize: "0.7rem",
                cursor: "pointer",
                padding: "2px 8px",
                fontWeight: "bold",
              }}
            >
              {isLoading ? "..." : isTrafficActive ? "⏹ STOP" : "▶ START"}
            </button>
          </>
        )}

        <button
          onClick={onClear}
          style={{
            background: "transparent",
            border: "1px solid #444",
            color: "#666",
            cursor: "pointer",
            fontSize: "0.7rem",
          }}
        >
          🗑️
        </button>
      </div>
    </div>
  );
};
