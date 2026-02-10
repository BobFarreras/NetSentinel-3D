import React, { useMemo } from "react";
import { Html } from "@react-three/drei";
import type { DeviceType } from "../../../shared/dtos/NetworkDTOs";

const COLORS: Record<DeviceType, { fg: string; glow: string; border: string }> = {
  ROUTER: { fg: "#77e8ff", glow: "rgba(0,229,255,0.35)", border: "rgba(0,229,255,0.55)" },
  PC: { fg: "#a9f5c9", glow: "rgba(0,255,136,0.25)", border: "rgba(0,255,136,0.45)" },
  PHONE: { fg: "#ff66cc", glow: "rgba(255,0,170,0.25)", border: "rgba(255,0,170,0.45)" },
  TV: { fg: "#ffd36b", glow: "rgba(255,211,107,0.25)", border: "rgba(255,211,107,0.45)" },
  SPEAKER: { fg: "#b388ff", glow: "rgba(179,136,255,0.25)", border: "rgba(179,136,255,0.45)" },
  IOT: { fg: "#ff7777", glow: "rgba(255,85,85,0.25)", border: "rgba(255,85,85,0.45)" },
  UNKNOWN: { fg: "#c9d1d9", glow: "rgba(201,209,217,0.15)", border: "rgba(201,209,217,0.25)" },
};

const Icon: React.FC<{ type: DeviceType; color: string }> = ({ type, color }) => {
  // Iconos SVG minimalistas, estilo terminal/cyberpunk (stroke neon).
  const common = { stroke: color, fill: "none", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (type) {
    case "PHONE":
      return (
        <svg width="14" height="14" viewBox="0 0 24 24">
          <rect x="8" y="2.5" width="8" height="19" rx="2" {...common} />
          <path d="M11 18.5h2" {...common} />
        </svg>
      );
    case "PC":
      return (
        <svg width="14" height="14" viewBox="0 0 24 24">
          <rect x="3" y="4" width="18" height="12" rx="2" {...common} />
          <path d="M8 20h8" {...common} />
          <path d="M10 16v4" {...common} />
          <path d="M14 16v4" {...common} />
        </svg>
      );
    case "TV":
      return (
        <svg width="14" height="14" viewBox="0 0 24 24">
          <rect x="4" y="5" width="16" height="11" rx="2" {...common} />
          <path d="M9 20h6" {...common} />
        </svg>
      );
    case "SPEAKER":
      return (
        <svg width="14" height="14" viewBox="0 0 24 24">
          <rect x="7" y="3" width="10" height="18" rx="2" {...common} />
          <path d="M12 9.5v0.1" {...common} />
          <circle cx="12" cy="15" r="2.5" {...common} />
        </svg>
      );
    case "ROUTER":
      return (
        <svg width="14" height="14" viewBox="0 0 24 24">
          <rect x="4" y="12" width="16" height="7" rx="2" {...common} />
          <path d="M8 12v-2" {...common} />
          <path d="M16 12v-2" {...common} />
          <path d="M9 16h0.01" {...common} />
          <path d="M12 16h0.01" {...common} />
          <path d="M15 16h0.01" {...common} />
        </svg>
      );
    case "IOT":
      return (
        <svg width="14" height="14" viewBox="0 0 24 24">
          <rect x="8" y="8" width="8" height="8" rx="2" {...common} />
          <path d="M12 3v3" {...common} />
          <path d="M12 18v3" {...common} />
          <path d="M3 12h3" {...common} />
          <path d="M18 12h3" {...common} />
        </svg>
      );
    default:
      return (
        <svg width="14" height="14" viewBox="0 0 24 24">
          <path d="M12 17h.01" {...common} />
          <path d="M9.2 9.2a3.2 3.2 0 1 1 5.6 2.2c-.9.7-1.6 1.2-1.6 2.6" {...common} />
        </svg>
      );
  }
};

export const NodeLabel: React.FC<{
  title: string;
  subtitle: string;
  meta?: string;
  type: DeviceType;
  confidence: number;
  isSelected?: boolean;
}> = ({ title, subtitle, meta, type, confidence, isSelected = false }) => {
  const palette = COLORS[type] || COLORS.UNKNOWN;

  const confText = useMemo(() => {
    const c = Math.max(0, Math.min(100, Math.round(confidence)));
    return `${c}%`;
  }, [confidence]);

  return (
    <Html
      center
      distanceFactor={10}
      position={[0, 2.2, 0]}
      style={{ pointerEvents: "none" }}
      transform
    >
      <style>{`
        @keyframes nsLabelGlow {
          0% { box-shadow: 0 0 0 1px rgba(0,0,0,0.55), 0 0 18px ${palette.glow}; }
          50% { box-shadow: 0 0 0 1px rgba(0,0,0,0.55), 0 0 28px ${palette.glow}; }
          100% { box-shadow: 0 0 0 1px rgba(0,0,0,0.55), 0 0 18px ${palette.glow}; }
        }
        @keyframes nsLabelScan {
          0% { transform: translateY(0); opacity: 0.10; }
          50% { transform: translateY(10px); opacity: 0.22; }
          100% { transform: translateY(0); opacity: 0.10; }
        }
        @keyframes nsSelectedPulse {
          0% { transform: translateY(-10px) scale(1.10); }
          50% { transform: translateY(-10px) scale(1.18); }
          100% { transform: translateY(-10px) scale(1.10); }
        }
      `}</style>
      <div
        style={{
          minWidth: 190,
          maxWidth: 260,
          padding: "9px 10px",
          background: "linear-gradient(180deg, rgba(0,0,0,0.88), rgba(0,0,0,0.55))",
          border: `1px solid ${palette.border}`,
          boxShadow: `0 0 0 1px rgba(0,0,0,0.55), 0 0 18px ${palette.glow}`,
          fontFamily: "'Consolas','Courier New',monospace",
          letterSpacing: 0.35,
          color: palette.fg,
          opacity: isSelected ? 1 : 0.90,
          transform: isSelected ? "translateY(-10px) scale(1.10)" : "translateY(-8px) scale(1.02)",
          position: "relative",
          filter: isSelected ? "drop-shadow(0 0 14px rgba(255,215,0,0.32))" : "none",
          animation: isSelected ? "nsSelectedPulse 1.2s ease-in-out infinite" : "nsLabelGlow 2.2s ease-in-out infinite",
          backdropFilter: "blur(6px)",
        }}
      >
        {/* scanlines */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)",
            backgroundSize: "100% 3px",
            opacity: 0.22,
            pointerEvents: "none",
          }}
        />

        {/* barra de escaneo (animada) */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 0,
            height: 10,
            background: `linear-gradient(90deg, transparent, ${palette.glow}, transparent)`,
            mixBlendMode: "screen",
            pointerEvents: "none",
            animation: "nsLabelScan 1.8s ease-in-out infinite",
          }}
        />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
            <div style={{ width: 16, height: 16, display: "grid", placeItems: "center" }}>
              <Icon type={type} color={palette.fg} />
            </div>
            <div style={{ fontWeight: 950, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {title}
            </div>
          </div>
          <div style={{ fontSize: 11, opacity: 0.92, border: `1px solid ${palette.border}`, padding: "2px 7px" }}>
            {confText}
          </div>
        </div>

        <div style={{ marginTop: 6, fontSize: 12, opacity: 0.92, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {subtitle}
        </div>

        {meta && (
          <div style={{ marginTop: 4, fontSize: 11, opacity: 0.75, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {meta}
          </div>
        )}
      </div>
    </Html>
  );
};
