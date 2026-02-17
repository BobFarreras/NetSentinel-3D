// src/ui/features/attack_lab/panel/wordlist/wordlistManagerModalStyles.ts
// Estilos compartidos del modal Password Vault (WordlistManagerModal): overlay, contenedor y controles cyberpunk reutilizables.

import type React from "react";

export const overlayStyle: React.CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: "rgba(0, 10, 5, 0.85)",
  backdropFilter: "blur(5px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 99999,
  padding: 20,
};

export const modalContainerStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: 600,
  height: "650px",
  maxHeight: "90vh",
  background: "#050505",
  border: "1px solid #00ff88",
  boxShadow: "0 0 50px rgba(0, 255, 136, 0.25)",
  display: "flex",
  flexDirection: "column",
  position: "relative",
  fontFamily: "'Consolas', monospace",
  overflow: "hidden",
  borderRadius: "4px",
  animation: "fadeIn 0.2s ease-out",
};

export const tabBarStyle: React.CSSProperties = {
  display: "flex",
  gap: 8,
  padding: "10px 12px",
  borderBottom: "1px solid rgba(0,255,136,0.15)",
  background: "rgba(0,0,0,0.45)",
  flexShrink: 0,
};

export const tabBtn = (active: boolean): React.CSSProperties => ({
  height: 28,
  padding: "0 10px",
  borderRadius: 2,
  border: `1px solid ${active ? "rgba(0,229,255,0.55)" : "rgba(0,255,136,0.25)"}`,
  background: active ? "rgba(0,229,255,0.12)" : "rgba(0,0,0,0.35)",
  color: active ? "#00e5ff" : "#00ff88",
  cursor: "pointer",
  fontFamily: "'Consolas', monospace",
  fontSize: 11,
  fontWeight: 900,
  letterSpacing: 0.8,
  textTransform: "uppercase",
});

export const inputStyle: React.CSSProperties = {
  width: "100%",
  height: 34,
  background: "rgba(0,0,0,0.65)",
  border: "1px solid rgba(0,229,255,0.25)",
  color: "#b7ffe2",
  borderRadius: 2,
  fontFamily: "'Consolas', monospace",
  fontSize: 12,
  padding: "0 10px",
  outline: "none",
};

export const btnStyle = (variant: "primary" | "danger" | "ghost"): React.CSSProperties => {
  if (variant === "primary") {
    return {
      height: 34,
      padding: "0 14px",
      borderRadius: 2,
      border: "1px solid rgba(0,255,136,0.35)",
      background: "rgba(0,255,136,0.12)",
      color: "#00ff88",
      cursor: "pointer",
      fontFamily: "'Consolas', monospace",
      fontSize: 12,
      fontWeight: 900,
      letterSpacing: 0.8,
      textTransform: "uppercase",
    };
  }
  if (variant === "danger") {
    return {
      height: 34,
      padding: "0 14px",
      borderRadius: 2,
      border: "1px solid rgba(255,85,85,0.45)",
      background: "rgba(255,85,85,0.08)",
      color: "#ff6677",
      cursor: "pointer",
      fontFamily: "'Consolas', monospace",
      fontSize: 12,
      fontWeight: 900,
      letterSpacing: 0.8,
      textTransform: "uppercase",
    };
  }
  return {
    height: 34,
    padding: "0 12px",
    borderRadius: 2,
    border: "1px solid rgba(0,255,136,0.25)",
    background: "rgba(0,0,0,0.35)",
    color: "rgba(183,255,226,0.85)",
    cursor: "pointer",
    fontFamily: "'Consolas', monospace",
    fontSize: 12,
    fontWeight: 900,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  };
};

export const modalCssText = `
  @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
  .word-chip { transition: all 0.1s; user-select: none; }
  .word-chip.selected {
      background: #00ff88 !important; color: #000 !important; border-color: #00ff88 !important; font-weight: bold;
  }
  .word-chip:hover { border-color: #555; background: #161616; }
  .word-chip.selected:hover { background: #00cc6a !important; }
  .cyber-scrollbar::-webkit-scrollbar { width: 6px; }
  .cyber-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
`;

