// src/ui/components/layout/topbar/TopBarBrand.tsx
// Marca compacta de la TopBar (NS/NETSENTINEL) + indicador de escaneo con pulso retro.

import React from "react";

export const TopBarBrand: React.FC<{
  compact: boolean;
  scanning: boolean;
  scanTitle: string;
}> = ({ compact, scanning, scanTitle }) => {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "0 8px",
        height: 30,
        border: "1px solid rgba(0,255,136,0.22)",
        background: "rgba(0,0,0,0.35)",
        borderRadius: 2,
        boxShadow: "inset 0 0 0 1px rgba(0,229,255,0.04)",
        flexShrink: 0,
      }}
      title="NetSentinel"
    >
      <span style={{ color: "#00ff88", fontFamily: "monospace", fontWeight: 950, letterSpacing: 1.2 }}>
        {compact ? "NS" : "NETSENTINEL"}
      </span>

      {scanning && (
        <span
          title={scanTitle}
          style={{
            width: 8,
            height: 8,
            borderRadius: 99,
            background: "#00ff88",
            boxShadow: "0 0 12px rgba(0,255,136,0.65)",
            animation: "nsScanPulse 1.0s ease-in-out infinite",
          }}
        />
      )}

      <style>{`
        @keyframes nsScanPulse {
          0% { transform: scale(0.9); opacity: 0.55; }
          50% { transform: scale(1.25); opacity: 1; }
          100% { transform: scale(0.9); opacity: 0.55; }
        }
      `}</style>
    </div>
  );
};

