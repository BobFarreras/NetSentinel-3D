// src/ui/components/hud/radar/RadarHeader.tsx
import React from "react";

type RadarHeaderProps = {
  accepted: boolean;
  autoRefresh: boolean;
  autoTick: number;
  scanning: boolean;
  onToggleAuto: (checked: boolean) => void;
  onScan: () => void;
  onClose: () => void;
};

export const RadarHeader: React.FC<RadarHeaderProps> = ({
  accepted,
  autoRefresh,
  autoTick,
  scanning,
  onToggleAuto,
  onScan,
  onClose,
}) => {
  return (
    <div
      style={{
        height: 44,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 12px",
        borderBottom: "1px solid rgba(0,255,136,0.25)",
        background: "linear-gradient(180deg, rgba(0,20,10,0.7), rgba(0,0,0,0.2))",
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
        <div style={{ color: "#00ff88", fontWeight: 800, letterSpacing: 1.2 }}>RADAR VIEW</div>
        <div style={{ color: "#6fe9b7", fontSize: 12, opacity: 0.75 }}>WIFI SPECTRUM / PHASE 0 RECON</div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            color: "#6fe9b7",
            fontSize: 12,
            opacity: 0.85,
          }}
        >
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={(e) => onToggleAuto(e.target.checked)}
            disabled={!accepted}
            style={{ accentColor: "#00ff88" }}
          />
          AUTO{accepted && autoRefresh ? ` (${autoTick}s)` : ""}
        </label>

        <button
          onClick={onScan}
          disabled={scanning || !accepted}
          style={{
            background: scanning ? "rgba(0,80,40,0.5)" : "rgba(0,140,60,0.18)",
            border: "1px solid rgba(0,255,136,0.45)",
            color: accepted ? "#00ff88" : "#2f6",
            fontWeight: 700,
            padding: "6px 10px",
            cursor: scanning || !accepted ? "not-allowed" : "pointer",
            textTransform: "uppercase",
            letterSpacing: 0.8,
            fontSize: 12,
          }}
        >
          {scanning ? "SCANNING..." : "SCAN AIRWAVES"}
        </button>

        <button
          onClick={onClose}
          style={{
            background: "transparent",
            border: "1px solid rgba(0,255,136,0.25)",
            color: "#6fe9b7",
            padding: "6px 10px",
            cursor: "pointer",
            fontSize: 12,
          }}
        >
          CLOSE
        </button>
      </div>
    </div>
  );
};
