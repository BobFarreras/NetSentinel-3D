// src/ui/features/radar/components/radar/intel/RadarIntelSelectionDetails.tsx
// Detalles del WiFi seleccionado (SSID/BSSID/vendor/security) y accion para abrir Attack Lab con contexto.

import React from "react";
import type { WifiNetworkDTO } from "../../../../../../shared/dtos/NetworkDTOs";

type RadarIntelSelectionDetailsProps = {
  selected: WifiNetworkDTO | null;
  onOpenAudit: () => void;
};

export const RadarIntelSelectionDetails: React.FC<RadarIntelSelectionDetailsProps> = ({ selected, onOpenAudit }) => {
  if (!selected) {
    return (
      <div style={{ color: "rgba(183,255,226,0.7)", fontSize: 12, lineHeight: 1.45 }}>
        Selecciona un nodo del radar para ver detalles.
      </div>
    );
  }

  return (
    <div style={{ fontSize: 12, lineHeight: 1.5 }}>
      <div style={{ fontWeight: 800, color: "#eafff4", marginBottom: 8 }}>
        {selected.ssid}{" "}
        <span style={{ color: "rgba(183,255,226,0.6)", fontWeight: 600 }}>[CH {selected.channel ?? "?"}]</span>
      </div>

      <div>
        Link:{" "}
        <span style={{ color: selected.isConnected ? "#00e5ff" : "rgba(183,255,226,0.75)", fontWeight: 800 }}>
          {selected.isConnected ? "CONNECTED" : "NEARBY"}
        </span>
      </div>
      <div>
        BSSID: <span style={{ color: "#00ff88" }}>{selected.bssid}</span>
      </div>
      <div>
        Vendor: <span style={{ color: "#ffe066" }}>{selected.vendor}</span>
      </div>
      <div>
        Security: <span style={{ color: "#b7ffe2" }}>{selected.securityType}</span>
      </div>
      <div>
        RSSI: <span style={{ color: "#b7ffe2" }}>{selected.signalLevel} dBm</span>
      </div>

      {!selected.isConnected && (
        <div style={{ marginTop: 20, paddingTop: 10, borderTop: "1px dashed rgba(255, 80, 80, 0.4)" }}>
          <div style={{ color: "#00ff88", fontWeight: 800, marginBottom: 6, fontSize: 10, letterSpacing: 1 }}>
            COUNTERMEASURES
          </div>
          <button
            onClick={onOpenAudit}
            style={{
              width: "100%",
              background: "rgba(0, 255, 136, 0.1)",
              border: "1px solid #00ff88",
              color: "#00ff88",
              padding: "8px",
              cursor: "pointer",
              fontSize: 11,
              fontWeight: "bold",
              fontFamily: "monospace",
              textTransform: "uppercase",
              boxShadow: "0 0 10px rgba(0,255,136,0.1)",
              transition: "all 0.2s",
            }}
          >
            ⚙️ OPEN AUDIT CONSOLE
          </button>
        </div>
      )}

      <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid rgba(0,255,136,0.14)" }}>
        {selected.isTargetable ? (
          <div style={{ color: "#ff6666", fontWeight: 800 }}>ALERTA: configuracion debil</div>
        ) : (
          <div style={{ color: "#00ff88", fontWeight: 800 }}>ESTADO: configuracion aceptable</div>
        )}
      </div>
    </div>
  );
};

