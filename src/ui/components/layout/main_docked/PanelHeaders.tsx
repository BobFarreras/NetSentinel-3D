// src/ui/components/layout/main_docked/PanelHeaders.tsx
// Cabeceras reutilizables para paneles docked/detached (titulacion + botones undock/dock/cerrar) manteniendo estilo HUD.

import type React from "react";

const detachBtnStyle: React.CSSProperties = {
  width: 22,
  height: 22,
  border: "1px solid #007744",
  background: "#001b0f",
  color: "#00ff88",
  cursor: "pointer",
  fontSize: 12,
  lineHeight: "18px",
  padding: 0,
  borderRadius: 2,
};

export const DockHeader: React.FC<{
  title: string;
  onUndock: () => void;
  onClose?: () => void;
  undockTitle: string;
  closeTitle: string;
}> = ({ title, onUndock, onClose, undockTitle, closeTitle }) => (
  <div
    style={{
      height: 30,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 8px",
      background: "#030908",
      borderBottom: "1px solid #004400",
      color: "#88ffcc",
      fontSize: 12,
      fontWeight: 700,
      letterSpacing: 0.6,
    }}
  >
    <span>{title}</span>
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <button onClick={onUndock} style={detachBtnStyle} title={undockTitle} aria-label={`UNLOCK_${title.replace(/\s+/g, "_")}`}>
        ↗
      </button>
      {onClose && (
        <button
          onClick={onClose}
          style={{ ...detachBtnStyle, borderColor: "#550000", color: "#ff6677", background: "#120003" }}
          title={closeTitle}
          aria-label={`CLOSE_${title.replace(/\s+/g, "_")}`}
        >
          X
        </button>
      )}
    </div>
  </div>
);

export const InlinePanelHeader: React.FC<{
  title: string;
  onUndock: () => void;
  onClose?: () => void;
  undockTitle: string;
  closeTitle: string;
}> = ({ title, onUndock, onClose, undockTitle, closeTitle }) => (
  <div
    style={{
      height: 28,
      borderBottom: "1px solid #004400",
      background: "#030908",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 8px",
      flexShrink: 0,
    }}
  >
    <span style={{ color: "#88ffcc", fontSize: 11, fontWeight: 700, letterSpacing: 0.6 }}>{title}</span>
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <button onClick={onUndock} style={detachBtnStyle} aria-label={`UNLOCK_${title.replace(/\s+/g, "_")}`} title={undockTitle}>
        ↗
      </button>
      {onClose && (
        <button
          onClick={onClose}
          style={{ ...detachBtnStyle, borderColor: "#550000", color: "#ff6677", background: "#120003" }}
          title={closeTitle}
          aria-label={`CLOSE_${title.replace(/\s+/g, "_")}`}
        >
          X
        </button>
      )}
    </div>
  </div>
);

export const DetachedShell: React.FC<{
  title: string;
  dockAria: string;
  onDock: () => void;
  dockTitle: string;
  children: React.ReactNode;
}> = ({ title, dockAria, onDock, dockTitle, children }) => (
  <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "#000" }}>
    <div
      style={{
        height: 30,
        borderBottom: "1px solid #004400",
        background: "#030908",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 8px",
        flexShrink: 0,
      }}
    >
      <span style={{ color: "#88ffcc", fontSize: 12, fontWeight: 700, letterSpacing: 0.6 }}>{title}</span>
      <button onClick={onDock} style={detachBtnStyle} aria-label={dockAria} title={dockTitle}>
        ↙
      </button>
    </div>
    <div style={{ flex: 1, minHeight: 0 }}>{children}</div>
  </div>
);

