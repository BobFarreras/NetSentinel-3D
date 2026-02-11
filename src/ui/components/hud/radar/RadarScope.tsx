// src/ui/components/hud/radar/RadarScope.tsx
import React from "react";
import type { WifiNetworkDTO } from "../../../../shared/dtos/NetworkDTOs";
import { riskStyle } from "./radarUtils";
import type { RadarNode } from "./radarUtils";

type RadarScopeProps = {
  accepted: boolean;
  scanning: boolean;
  error: string | null;
  networks: WifiNetworkDTO[];
  filteredNetworks: WifiNetworkDTO[];
  nodes: RadarNode[];
  selectedBssid: string | null;
  lastScanAt: number | null;
  onSelectNode: (bssid: string) => void;
};

export const RadarScope: React.FC<RadarScopeProps> = ({
  accepted,
  scanning,
  error,
  networks,
  filteredNetworks,
  nodes,
  selectedBssid,
  lastScanAt,
  onSelectNode,
}) => {
  return (
    <div style={{ flex: 1, padding: 14, position: "relative" }}>
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          borderRadius: 10,
          border: "1px solid rgba(0,255,136,0.12)",
          background:
            "radial-gradient(circle at 50% 50%, rgba(0,255,136,0.08) 0%, rgba(0,0,0,0.85) 62%, rgba(0,0,0,0.95) 100%)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: "-20%",
            transformOrigin: "50% 50%",
            animation: accepted ? "nsSweep 2.2s linear infinite" : "none",
            opacity: accepted ? 0.7 : 0.15,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: "2px",
              height: "55%",
              transform: "translate(-50%, -100%)",
              background: "linear-gradient(180deg, rgba(0,255,136,0.0), rgba(0,255,136,0.55), rgba(0,255,136,0.0))",
              boxShadow: "0 0 18px rgba(0,255,136,0.35)",
            }}
          />
        </div>

        {["22%", "44%", "66%", "88%"].map((s) => (
          <div
            key={s}
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: s,
              height: s,
              transform: "translate(-50%,-50%)",
              borderRadius: "50%",
              border: "1px dashed rgba(0,255,136,0.12)",
            }}
          />
        ))}

        <div
          title="HOST"
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: 10,
            height: 10,
            transform: "translate(-50%,-50%)",
            borderRadius: "50%",
            background: "#00ff88",
            boxShadow: "0 0 18px rgba(0,255,136,0.55)",
            animation: "nsBlink 1.2s ease-in-out infinite",
          }}
        />

        {nodes.map((n) => {
          const style = riskStyle(n.riskLevel);
          const isSelected = selectedBssid === n.bssid;
          const isConnected = Boolean(n.isConnected);
          return (
            <button
              key={n.bssid}
              onClick={() => onSelectNode(n.bssid)}
              aria-label={`NODE ${n.ssid} CH ${n.channel ?? "?"}`}
              title={`${n.ssid} [CH ${n.channel ?? "?"}] / ${style.label}${isConnected ? " / CONNECTED" : ""}`}
              style={{
                position: "absolute",
                left: `calc(50% + ${n.x * 45}%)`,
                top: `calc(50% + ${n.y * 45}%)`,
                width: isSelected ? 10 : 8,
                height: isSelected ? 10 : 8,
                transform: "translate(-50%,-50%)",
                borderRadius: "50%",
                border: `1px solid ${
                  isSelected
                    ? "#ffffff"
                    : isConnected
                      ? "rgba(0,229,255,0.85)"
                      : "rgba(255,255,255,0.25)"
                }`,
                background: style.dot,
                boxShadow: [
                  isConnected ? "0 0 0 2px rgba(0,229,255,0.55)" : "",
                  isConnected ? "0 0 18px rgba(0,229,255,0.25)" : "",
                  `0 0 ${isSelected ? 24 : 14}px ${style.glow}`,
                ]
                  .filter(Boolean)
                  .join(", "),
                cursor: "pointer",
                padding: 0,
              }}
            />
          );
        })}

        {accepted && !scanning && !error && filteredNetworks.length === 0 && (
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
              width: "80%",
              maxWidth: 420,
              textAlign: "center",
              color: "rgba(183,255,226,0.75)",
              fontSize: 12,
              lineHeight: 1.55,
            }}
          >
            <div style={{ color: "#00ff88", fontWeight: 900, letterSpacing: 0.8, marginBottom: 6 }}>NO SE DETECTAN REDES</div>
            <div style={{ opacity: 0.9 }}>
              Si estas en Windows, puede requerirse permiso de ubicacion para escanear WiFi. Verifica que el WiFi esta
              activado y pulsa <b>SCAN AIRWAVES</b>.
            </div>
          </div>
        )}

        <div
          style={{
            position: "absolute",
            left: 12,
            bottom: 10,
            color: "#6fe9b7",
            fontSize: 11,
            opacity: 0.8,
          }}
        >
          {error
            ? `ERROR: ${error}`
            : `NETWORKS: ${networks.length} / VISIBLE: ${filteredNetworks.length} / LAST: ${lastScanAt ? new Date(lastScanAt).toLocaleTimeString() : "-"}`}
        </div>
      </div>
    </div>
  );
};
