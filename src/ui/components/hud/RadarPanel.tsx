import React, { useMemo, useState } from "react";
import type { WifiNetworkDTO } from "../../../shared/dtos/NetworkDTOs";
import { useWifiRadar } from "../../hooks/modules/useWifiRadar";

interface RadarPanelProps {
  onClose: () => void;
}

type RiskColor = {
  dot: string;
  glow: string;
  label: string;
};

const riskStyle = (riskLevel: string): RiskColor => {
  const lvl = (riskLevel || "").toUpperCase();
  if (lvl === "HARDENED") return { dot: "#00ff88", glow: "rgba(0,255,136,0.35)", label: "HARDENED" };
  if (lvl === "STANDARD") return { dot: "#ffe066", glow: "rgba(255,224,102,0.35)", label: "STANDARD" };
  if (lvl === "LEGACY") return { dot: "#ff5555", glow: "rgba(255,85,85,0.35)", label: "LEGACY" };
  if (lvl === "OPEN") return { dot: "#ff3333", glow: "rgba(255,51,51,0.35)", label: "OPEN" };
  return { dot: "#aaaaaa", glow: "rgba(170,170,170,0.2)", label: "UNKNOWN" };
};

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

const hashToAngleDeg = (seed: string) => {
  // Hash estable para distribuir nodos en el radar sin jitter.
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return h % 360;
};

export const RadarPanel: React.FC<RadarPanelProps> = ({ onClose }) => {
  const { scanning, networks, error, lastScanAt, scan } = useWifiRadar();
  const [selected, setSelected] = useState<WifiNetworkDTO | null>(null);
  const [accepted, setAccepted] = useState<boolean>(() => {
    return localStorage.getItem("netsentinel.radar.legalAccepted") === "true";
  });

  const nodes = useMemo(() => {
    return networks.map((n) => {
      const angle = (hashToAngleDeg(n.bssid) * Math.PI) / 180;
      const dist = clamp(n.distanceMock ?? 60, 5, 60);
      // 0..1 => 0.1..0.95 del radio
      const r = clamp((dist - 5) / (60 - 5), 0, 1);
      const radius = 0.12 + r * 0.78;
      return {
        ...n,
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
      };
    });
  }, [networks]);

  const acceptLegal = () => {
    localStorage.setItem("netsentinel.radar.legalAccepted", "true");
    setAccepted(true);
  };

  return (
    <div
      style={{
        width: 720,
        height: 520,
        background: "#050607",
        border: "1px solid #0a3",
        boxShadow: "0 0 0 1px rgba(0,255,136,0.12), 0 25px 80px rgba(0,0,0,0.65)",
        position: "relative",
        overflow: "hidden",
        fontFamily: "'Consolas', 'Courier New', monospace",
      }}
    >
      {/* Estetica CRT: scanlines + glow + sweep */}
      <style>{`
        .ns-crt::before {
          content: "";
          position: absolute;
          inset: 0;
          background:
            radial-gradient(60% 60% at 50% 40%, rgba(0,255,136,0.08), transparent 60%),
            linear-gradient(transparent 0px, rgba(0,0,0,0.25) 2px, transparent 4px);
          background-size: auto, 100% 4px;
          pointer-events: none;
          mix-blend-mode: screen;
          opacity: 0.9;
        }
        @keyframes nsSweep {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes nsBlink {
          0%, 100% { opacity: 0.85; }
          50% { opacity: 0.35; }
        }
      `}</style>

      <div className="ns-crt" style={{ position: "absolute", inset: 0, pointerEvents: "none" }} />

      {/* Cabecera */}
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
          <div style={{ color: "#00ff88", fontWeight: 800, letterSpacing: 1.2 }}>
            RADAR VIEW
          </div>
          <div style={{ color: "#6fe9b7", fontSize: 12, opacity: 0.75 }}>
            WIFI SPECTRUM / PHASE 0 RECON
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={scan}
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

      {/* Cuerpo */}
      <div style={{ display: "flex", height: "calc(100% - 44px)" }}>
        {/* Radar */}
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
            {/* Sweep line */}
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
                  background:
                    "linear-gradient(180deg, rgba(0,255,136,0.0), rgba(0,255,136,0.55), rgba(0,255,136,0.0))",
                  boxShadow: "0 0 18px rgba(0,255,136,0.35)",
                }}
              />
            </div>

            {/* Grid */}
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

            {/* Centro (host) */}
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

            {/* Nodos */}
            {nodes.map((n) => {
              const style = riskStyle(n.riskLevel);
              const isSelected = selected?.bssid === n.bssid;
              return (
                <button
                  key={n.bssid}
                  onClick={() => setSelected(n)}
                  title={`${n.ssid} [CH ${n.channel ?? "?"}] / ${style.label}`}
                  style={{
                    position: "absolute",
                    left: `calc(50% + ${n.x * 45}%)`,
                    top: `calc(50% + ${n.y * 45}%)`,
                    width: isSelected ? 10 : 8,
                    height: isSelected ? 10 : 8,
                    transform: "translate(-50%,-50%)",
                    borderRadius: "50%",
                    border: `1px solid ${isSelected ? "#ffffff" : "rgba(255,255,255,0.25)"}`,
                    background: style.dot,
                    boxShadow: `0 0 ${isSelected ? 24 : 14}px ${style.glow}`,
                    cursor: "pointer",
                    padding: 0,
                  }}
                />
              );
            })}

            {/* Estado */}
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
              {error ? `ERROR: ${error}` : `NETWORKS: ${networks.length} / LAST: ${lastScanAt ? new Date(lastScanAt).toLocaleTimeString() : "-"}`}
            </div>
          </div>
        </div>

        {/* Detalle */}
        <div
          style={{
            width: 290,
            borderLeft: "1px solid rgba(0,255,136,0.18)",
            padding: 12,
            background: "linear-gradient(180deg, rgba(0,10,5,0.75), rgba(0,0,0,0.55))",
            color: "#b7ffe2",
          }}
        >
          <div style={{ color: "#00ff88", fontWeight: 800, letterSpacing: 1, marginBottom: 10 }}>
            NODE INTEL
          </div>

          {!selected ? (
            <div style={{ color: "rgba(183,255,226,0.7)", fontSize: 12, lineHeight: 1.45 }}>
              Selecciona un nodo del radar para ver detalles.
              <div style={{ marginTop: 10, fontSize: 11, opacity: 0.75 }}>
                Leyenda:
                <div>VERDE: Hardened</div>
                <div>AMARILLO: Standard</div>
                <div>ROJO: Legacy/Open</div>
              </div>
            </div>
          ) : (
            <div style={{ fontSize: 12, lineHeight: 1.5 }}>
              <div style={{ fontWeight: 800, color: "#eafff4", marginBottom: 8 }}>
                {selected.ssid}{" "}
                <span style={{ color: "rgba(183,255,226,0.6)", fontWeight: 600 }}>
                  [CH {selected.channel ?? "?"}]
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
              <div>
                Risk:{" "}
                <span style={{ color: riskStyle(selected.riskLevel).dot, fontWeight: 800 }}>
                  {riskStyle(selected.riskLevel).label}
                </span>
              </div>
              <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid rgba(0,255,136,0.14)" }}>
                {selected.isTargetable ? (
                  <div style={{ color: "#ff6666", fontWeight: 800 }}>
                    ALERTA: configuracion debil (modo educativo)
                  </div>
                ) : (
                  <div style={{ color: "#00ff88", fontWeight: 800 }}>
                    ESTADO: configuracion aceptable
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Aviso legal primer uso */}
      {!accepted && (
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
            <div style={{ color: "#00ff88", fontWeight: 900, letterSpacing: 1, marginBottom: 8 }}>
              AVISO LEGAL
            </div>
            <div style={{ fontSize: 12, lineHeight: 1.55, opacity: 0.92 }}>
              Esta funcionalidad esta destinada a auditoria y formacion en redes propias o con autorizacion explicita.
              No uses esta herramienta para interferir o acceder a redes ajenas.
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
                onClick={acceptLegal}
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
      )}
    </div>
  );
};
