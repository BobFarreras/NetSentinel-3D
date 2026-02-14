// src/ui/features/traffic/components/TrafficFilterBar.tsx
// Barra de filtros del TrafficPanel: seleccion de modo (ALL/JAMMED/TARGET) y accion de limpiar.
import React from "react";
import type { DeviceDTO } from "../../../../shared/dtos/NetworkDTOs";
import type { FilterMode } from "../hooks/useTrafficPanelState";
import { HUD_COLORS, HUD_TYPO } from "../../../styles/hudTokens";

type TrafficFilterBarProps = {
  packetsCount: number;
  jammedPacketsCount: number;
  jammedTargetsCount: number;
  filterMode: FilterMode;
  targetLabel: string;
  selectedDevice?: DeviceDTO | null;
  onFilterChange: (mode: FilterMode) => void;
  targetOptions: { ip: string; label: string }[];
  selectedTargetIp: string;
  onTargetChange: (ip: string) => void;
  onClear?: () => void;
};

interface FilterBtnProps {
  label: string;
  active: boolean;
  onClick: () => void;
  color?: string;
  disabled?: boolean;
  title?: string;
}

const FilterBtn: React.FC<FilterBtnProps> = ({ label, active, onClick, color = HUD_COLORS.accentGreen, disabled, title }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={title}
    style={{
      background: active ? `${color}22` : "transparent",
      border: `1px solid ${active ? color : "#333"}`,
      color: disabled ? "#333" : active ? color : "#666",
      fontSize: "0.65rem",
      padding: "2px 6px",
      cursor: disabled ? "not-allowed" : "pointer",
      marginRight: "4px",
      fontWeight: "bold",
      fontFamily: HUD_TYPO.mono,
    }}
  >
    {label}
  </button>
);

export const TrafficFilterBar: React.FC<TrafficFilterBarProps> = ({
  packetsCount,
  jammedPacketsCount,
  jammedTargetsCount,
  filterMode,
  targetLabel,
  selectedDevice,
  onFilterChange,
  targetOptions,
  selectedTargetIp,
  onTargetChange,
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
        background: HUD_COLORS.bgBase,
        flexShrink: 0,
      }}
    >
      <div style={{ display: "flex", gap: "5px" }}>
        <FilterBtn
          label={`ALL (${packetsCount})`}
          active={filterMode === "ALL"}
          onClick={() => onFilterChange("ALL")}
          title="ALL: trafico total observado en la red (no solo del target)."
        />
        <FilterBtn
          label={`💀 JAMMED (${jammedTargetsCount})`}
          active={filterMode === "JAMMED"}
          onClick={() => onFilterChange("JAMMED")}
          color="#ff5555"
          title={`JAMMED: targets con Kill Net activo (${jammedTargetsCount}) / paquetes marcados (${jammedPacketsCount}).`}
        />
        <FilterBtn
          label={targetLabel}
          active={filterMode === "TARGET"}
          onClick={() => onFilterChange("TARGET")}
          disabled={!selectedDevice}
          color="#ffff00"
          title="TARGET: solo trafico del dispositivo seleccionado (o fijado en el selector)."
        />
      </div>

      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            title={"ALL: trafico total observado.\nJAMMED: trafico afectado por Kill Net.\nTARGET: solo trafico del dispositivo seleccionado o elegido."}
            style={{
              width: 18,
              height: 18,
              borderRadius: 2,
              border: "1px solid rgba(0,255,136,0.25)",
              color: "rgba(183,255,226,0.75)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 11,
              cursor: "help",
              fontFamily: HUD_TYPO.mono,
            }}
            aria-label="TRAFFIC_FILTER_HELP"
          >
            ?
          </div>

          <select
            value={selectedTargetIp}
            onChange={(e) => onTargetChange(e.target.value)}
            aria-label="TRAFFIC_TARGET_SELECT"
            title="Selecciona un dispositivo para fijar TARGET sin cambiar el nodo seleccionado."
            style={{
              height: 22,
              maxWidth: 280,
              background: "rgba(0,0,0,0.55)",
              border: "1px solid rgba(0,255,136,0.18)",
              color: "rgba(183,255,226,0.85)",
              fontFamily: HUD_TYPO.mono,
              fontSize: 11,
              padding: "0 6px",
              outline: "none",
            }}
          >
            {targetOptions.map((o) => (
              <option key={o.ip || "__auto__"} value={o.ip}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

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
              fontFamily: HUD_TYPO.mono,
            }}
          >
            🗑️ CLR
          </button>
        )}
      </div>
    </div>
  );
};
