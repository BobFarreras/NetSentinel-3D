// src/ui/features/radar/components/radar/RadarLegalModal.tsx
// Modal de consentimiento: gate para activar Radar View antes del primer escaneo (recon pasivo WiFi).
import React from "react";

type RadarLegalModalProps = {
  onClose: () => void;
  onAccept: () => void;
};

export const RadarLegalModal: React.FC<RadarLegalModalProps> = ({ onClose, onAccept }) => {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "rgba(0,0,0,0.88)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 18,
      }}
    >
      <div
        style={{
          width: 560,
          border: "1px solid rgba(0,255,136,0.25)",
          background: "rgba(0,8,4,0.95)",
          boxShadow: "0 0 40px rgba(0,255,136,0.12)",
          padding: 14,
          color: "#b7ffe2",
        }}
      >
        <div style={{ color: "#00ff88", fontWeight: 900, letterSpacing: 1, marginBottom: 8 }}>AVISO LEGAL</div>
        <div style={{ fontSize: 12, lineHeight: 1.55, opacity: 0.92 }}>
          Esta funcionalidad esta destinada a auditoria y formacion en redes propias o con autorizacion explicita. No
          uses esta herramienta para interferir o acceder a redes ajenas.
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 12 }}>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.18)",
              color: "rgba(183,255,226,0.75)",
              padding: "8px 10px",
              cursor: "pointer",
              fontSize: 12,
            }}
          >
            CANCELAR
          </button>
          <button
            onClick={onAccept}
            style={{
              background: "rgba(0,140,60,0.18)",
              border: "1px solid rgba(0,255,136,0.45)",
              color: "#00ff88",
              padding: "8px 10px",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: 0.6,
            }}
          >
            ACEPTO Y CONTINUO
          </button>
        </div>
      </div>
    </div>
  );
};
