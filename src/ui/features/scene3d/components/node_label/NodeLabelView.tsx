// src/ui/features/scene3d/components/node_label/NodeLabelView.tsx
// Presentacion pura del label 3D (HTML): layout/estilos/animaciones; sin logica de paleta ni confianza.

import React from "react";
import { Html } from "@react-three/drei";
import type { DeviceType } from "../../../../../shared/dtos/NetworkDTOs";
import { SCENE_TOKENS } from "../sceneTokens";
import { NodeLabelIcon } from "./NodeLabelIcon";
import { getNodeLabelCssText } from "./nodeLabelStyles";

export const NodeLabelView: React.FC<{
  title: string;
  subtitle: string;
  meta?: string;
  type: DeviceType;
  confidenceBadge: { pct: number; level: "HIGH" | "MED" | "LOW" };
  palette: { fg: string; glow: string; border: string };
  isSelected: boolean;
  variant: "default" | "router";
  rows?: Array<{ label: string; value: string }>;
}> = ({ title, subtitle, meta, type, confidenceBadge, palette, isSelected, variant, rows }) => {
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
      <style>{getNodeLabelCssText(palette.glow)}</style>
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
          opacity: isSelected ? 1 : 0.9,
          transform: isSelected ? "translateY(-14px) scale(1.18)" : "translateY(-10px) scale(1.10)",
          position: "relative",
          filter: isSelected ? "drop-shadow(0 0 14px rgba(255,215,0,0.32))" : "none",
          animation: isSelected
            ? "nsSelectedPulse 1.15s ease-in-out infinite, nsFlicker 2.8s ease-in-out infinite"
            : "nsLabelGlow 2.2s ease-in-out infinite, nsFlicker 3.2s ease-in-out infinite",
          backdropFilter: "blur(6px)",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)",
            backgroundSize: "100% 3px",
            opacity: 0.22,
            pointerEvents: "none",
          }}
        />

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
              <NodeLabelIcon type={type} color={palette.fg} />
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
            <div
              className="nsType2"
              style={{
                marginTop: 10,
                fontSize: 15,
                opacity: 0.92,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {subtitle}
            </div>

            {meta && (
              <div
                className="nsType3"
                style={{
                  marginTop: 8,
                  fontSize: 14,
                  opacity: 0.78,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {meta}
              </div>
            )}
          </>
        )}
      </div>
    </Html>
  );
};

