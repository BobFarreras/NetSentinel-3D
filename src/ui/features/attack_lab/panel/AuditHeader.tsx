// src/ui/features/attack_lab/panel/AuditHeader.tsx
// Cabecera del Attack Lab: tabs LAB/CUSTOM, status y control de cierre.

import React from "react";

const btnStyle = (active: boolean): React.CSSProperties => ({
  background: active ? "rgba(0,255,136,0.12)" : "transparent",
  border: `1px solid ${active ? "rgba(0,255,136,0.45)" : "rgba(0,255,136,0.18)"}`,
  color: active ? "#00ff88" : "rgba(183,255,226,0.85)",
  padding: "6px 10px",
  cursor: "pointer",
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: 0.4,
  fontFamily: "'Consolas', 'Courier New', monospace",
});

interface AuditHeaderProps {
  mode: "LAB" | "CUSTOM";
  setMode: (m: "LAB" | "CUSTOM") => void;
  status: string;
  isAutoRun: boolean;
  compact?: boolean;
  onClose: () => void;
}

export const AuditHeader: React.FC<AuditHeaderProps> = ({ mode, setMode, status, isAutoRun, compact = false, onClose }) => {
  return (
    <div style={{
      height: "auto",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 12px",
      borderBottom: "1px solid rgba(0,255,136,0.25)",
      background: "linear-gradient(180deg, rgba(0,20,10,0.7), rgba(0,0,0,0.2))",
      flexShrink: 0,
      flexWrap: "wrap",
      rowGap: 6,
      minHeight: 44,
    }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, minWidth: 0 }}>
        <div style={{ color: "#00ff88", fontWeight: 900, letterSpacing: 1.2, whiteSpace: "nowrap" }}>ATTACK LAB</div>
        {!compact && (
          <div style={{ color: "rgba(183,255,226,0.75)", fontSize: 12, whiteSpace: "nowrap" }}>System Override Console</div>
        )}
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
        <button onClick={() => setMode("LAB")} style={btnStyle(mode === "LAB")}>LAB</button>
        <button onClick={() => setMode("CUSTOM")} style={btnStyle(mode === "CUSTOM")}>CUSTOM</button>
        <div
          title={status}
          style={{
            color: "rgba(183,255,226,0.75)",
            fontSize: 12,
            maxWidth: compact ? 140 : 320,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {status}
        </div>
        {isAutoRun && mode === "LAB" && (
          <div style={{ color: "rgba(0,229,255,0.9)", fontSize: 12, fontWeight: 900, letterSpacing: 0.8 }}>AUTO</div>
        )}
        <button onClick={onClose} style={btnStyle(false)}>{compact ? "X" : "CLOSE"}</button>
      </div>
    </div>
  );
};
