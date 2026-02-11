import React from "react";
import { Html } from "@react-three/drei";
import type { DeviceType } from "../../../shared/dtos/NetworkDTOs";
import { SCENE_TOKENS } from "./sceneTokens";
import { useNodeLabelState } from "../../hooks/modules/useNodeLabelState";

const Icon: React.FC<{ type: DeviceType; color: string }> = ({ type, color }) => {
  // Iconos SVG minimalistas, estilo terminal/cyberpunk (stroke neon).
  const common = { stroke: color, fill: "none", strokeWidth: 2.2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (type) {
    case "PHONE":
      return (
        <svg width="28" height="28" viewBox="0 0 24 24">
          <rect x="8" y="2.5" width="8" height="19" rx="2" {...common} />
          <path d="M11 18.5h2" {...common} />
        </svg>
      );
    case "PC":
      return (
        <svg width="28" height="28" viewBox="0 0 24 24">
          <rect x="3" y="4" width="18" height="12" rx="2" {...common} />
          <path d="M8 20h8" {...common} />
          <path d="M10 16v4" {...common} />
          <path d="M14 16v4" {...common} />
        </svg>
      );
    case "TV":
      return (
        <svg width="28" height="28" viewBox="0 0 24 24">
          <rect x="4" y="5" width="16" height="11" rx="2" {...common} />
          <path d="M9 20h6" {...common} />
        </svg>
      );
    case "SPEAKER":
      return (
        <svg width="28" height="28" viewBox="0 0 24 24">
          <rect x="7" y="3" width="10" height="18" rx="2" {...common} />
          <path d="M12 9.5v0.1" {...common} />
          <circle cx="12" cy="15" r="2.5" {...common} />
        </svg>
      );
    case "ROUTER":
      return (
        <svg width="28" height="28" viewBox="0 0 24 24">
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
        <svg width="28" height="28" viewBox="0 0 24 24">
          <rect x="8" y="8" width="8" height="8" rx="2" {...common} />
          <path d="M12 3v3" {...common} />
          <path d="M12 18v3" {...common} />
          <path d="M3 12h3" {...common} />
          <path d="M18 12h3" {...common} />
        </svg>
      );
    default:
      return (
        <svg width="28" height="28" viewBox="0 0 24 24">
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
  variant?: "default" | "router";
  rows?: Array<{ label: string; value: string }>;
}> = ({ title, subtitle, meta, type, confidence, isSelected = false, variant = "default", rows }) => {
  const { palette, confidenceBadge } = useNodeLabelState({ type, confidence });

  return (
    <Html
      center
      distanceFactor={10}
      position={[0, 2.2, 0]}
      style={{ pointerEvents: "none" }}
      pointerEvents="none"
      sprite
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
          0% { transform: translateY(-14px) scale(1.18); }
          50% { transform: translateY(-14px) scale(1.26); }
          100% { transform: translateY(-14px) scale(1.18); }
        }
        @keyframes nsTypeIn {
          0% { clip-path: inset(0 100% 0 0); opacity: 0.75; }
          100% { clip-path: inset(0 0 0 0); opacity: 1; }
        }
        @keyframes nsFlicker {
          0%, 100% { filter: none; }
          50% { filter: brightness(1.08) contrast(1.05); }
        }
        .nsType1 { animation: nsTypeIn 0.85s steps(18, end) forwards; }
        .nsType2 { animation: nsTypeIn 0.95s steps(22, end) forwards; animation-delay: 0.10s; }
        .nsType3 { animation: nsTypeIn 1.05s steps(26, end) forwards; animation-delay: 0.18s; }
      `}</style>
      <div
        style={{
          minWidth: variant === "router" ? 380 : 320,
          maxWidth: variant === "router" ? 520 : 440,
          padding: "14px 16px",
          background: "linear-gradient(180deg, rgba(0,0,0,0.88), rgba(0,0,0,0.55))",
          border: `1px solid ${palette.border}`,
          boxShadow: `0 0 0 1px rgba(0,0,0,0.55), 0 0 18px ${palette.glow}`,
          fontFamily: SCENE_TOKENS.fontMono,
          letterSpacing: 0.35,
          color: palette.fg,
          opacity: isSelected ? 1 : 0.90,
          transform: isSelected ? "translateY(-14px) scale(1.18)" : "translateY(-10px) scale(1.10)",
          position: "relative",
          filter: isSelected ? "drop-shadow(0 0 14px rgba(255,215,0,0.32))" : "none",
          animation: isSelected ? "nsSelectedPulse 1.15s ease-in-out infinite, nsFlicker 2.8s ease-in-out infinite" : "nsLabelGlow 2.2s ease-in-out infinite, nsFlicker 3.2s ease-in-out infinite",
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
            <div style={{ width: 34, height: 34, display: "grid", placeItems: "center" }}>
              <Icon type={type} color={palette.fg} />
            </div>
            <div
              className="nsType1"
              style={{
                fontWeight: 950,
                fontSize: 18,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                textShadow: `0 0 12px ${palette.glow}`,
              }}
            >
              {title}
            </div>
          </div>
          <div
            style={{
              fontSize: 12,
              opacity: 0.92,
              border: `1px solid ${palette.border}`,
              padding: "4px 10px",
              whiteSpace: "nowrap",
              letterSpacing: 0.45,
            }}
          >
            {confidenceBadge.level} {confidenceBadge.pct}%
          </div>
        </div>

        {variant === "router" && rows && rows.length > 0 ? (
          <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
            {rows.slice(0, 6).map((r) => (
              <div key={r.label} style={{ display: "grid", gridTemplateColumns: "112px 1fr", gap: 10, minWidth: 0 }}>
                <div style={{ fontSize: 12, opacity: 0.72 }}>{r.label}</div>
                <div style={{ fontSize: 14, opacity: 0.92, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {r.value}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="nsType2" style={{ marginTop: 10, fontSize: 15, opacity: 0.92, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {subtitle}
            </div>

            {meta && (
              <div className="nsType3" style={{ marginTop: 8, fontSize: 14, opacity: 0.78, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {meta}
              </div>
            )}
          </>
        )}
      </div>
    </Html>
  );
};
