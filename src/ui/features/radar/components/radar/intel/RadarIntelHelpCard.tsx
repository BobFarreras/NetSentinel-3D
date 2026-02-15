// src/ui/features/radar/components/radar/intel/RadarIntelHelpCard.tsx
// Tarjeta de ayuda del Intel Panel: explicacion breve del significado de filtros y estado del nodo.

import React from "react";

export const RadarIntelHelpCard: React.FC = () => {
  return (
    <div
      style={{
        marginBottom: 10,
        padding: 10,
        border: "1px solid rgba(0,255,136,0.18)",
        background: "rgba(0,0,0,0.35)",
        color: "rgba(183,255,226,0.85)",
        fontSize: 11,
        lineHeight: 1.45,
      }}
    >
      <div style={{ color: "#00ff88", fontWeight: 900, marginBottom: 6 }}>Guia rapida</div>
      <div style={{ marginBottom: 6 }}>
        <b>Riesgo</b>: filtro por seguridad inferida (cifrado/legacy/abierto).
      </div>
      <div style={{ marginBottom: 6 }}>
        <b>Banda</b>: 2.4/5GHz (si el AP no lo anuncia, aparece como UNK).
      </div>
      <div style={{ marginBottom: 6 }}>
        <b>Canal</b>: recorta el espectro a un canal concreto.
      </div>
      <div>
        <b>Q</b>: busqueda rapida por SSID/Vendor/BSSID.
      </div>
    </div>
  );
};

