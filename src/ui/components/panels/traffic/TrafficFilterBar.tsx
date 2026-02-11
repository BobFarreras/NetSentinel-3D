// src/ui/components/panels/traffic/TrafficFilterBar.tsx
import React from "react";
import type { DeviceDTO } from "../../../../shared/dtos/NetworkDTOs";
import type { FilterMode } from "../../../hooks/modules/useTrafficPanelState";

type TrafficFilterBarProps = {
  packetsCount: number;
  jammedPacketsCount: number;
  filterMode: FilterMode;
  targetLabel: string;
  selectedDevice?: DeviceDTO | null;
  onFilterChange: (mode: FilterMode) => void;
  onClear?: () => void;
};

interface FilterBtnProps {
  label: string;
  active: boolean;
  onClick: () => void;
  color?: string;
  disabled?: boolean;
}

const FilterBtn: React.FC<FilterBtnProps> = ({ label, active, onClick, color = "#00ff00", disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      background: active ? `${color}22` : "transparent",
      border: `1px solid ${active ? color : "#333"}`,
      color: disabled ? "#333" : active ? color : "#666",
      fontSize: "0.65rem",
      padding: "2px 6px",
      cursor: disabled ? "not-allowed" : "pointer",
      marginRight: "4px",
      fontWeight: "bold",
      fontFamily: "monospace",
    }}
  >
    {label}
  </button>
);

export const TrafficFilterBar: React.FC<TrafficFilterBarProps> = ({
  packetsCount,
  jammedPacketsCount,
  filterMode,
  targetLabel,
  selectedDevice,
  onFilterChange,
  onClear,
}) => {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "6px",
        borderBottom: "1px solid #004400",
        background: "#020202",
        flexShrink: 0,
      }}
    >
      <div style={{ display: "flex", gap: "5px" }}>
        <FilterBtn label={`ALL (${packetsCount})`} active={filterMode === "ALL"} onClick={() => onFilterChange("ALL")} />
        <FilterBtn
          label={`💀 JAMMED (${jammedPacketsCount})`}
          active={filterMode === "JAMMED"}
          onClick={() => onFilterChange("JAMMED")}
          color="#ff5555"
        />
        <FilterBtn
          label={targetLabel}
          active={filterMode === "TARGET"}
          onClick={() => onFilterChange("TARGET")}
          disabled={!selectedDevice}
          color="#ffff00"
        />
      </div>

      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        {onClear && (
          <button
            onClick={onClear}
            style={{
              background: "#440000",
              border: "1px solid #ff3333",
              color: "#ffcccc",
              cursor: "pointer",
              fontSize: "0.65rem",
              padding: "2px 8px",
              fontWeight: "bold",
              fontFamily: "monospace",
            }}
          >
            🗑️ CLR
          </button>
        )}
      </div>
    </div>
  );
};
