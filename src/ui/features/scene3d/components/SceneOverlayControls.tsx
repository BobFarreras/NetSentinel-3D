// src/ui/features/scene3d/components/SceneOverlayControls.tsx
// Controles superpuestos de la escena 3D (undock + toggle labels) con layout responsive (wrap) y estilos cyberpunk.

import React from "react";
import { SCENE_TOKENS } from "./sceneTokens";

export const SceneOverlayControls: React.FC<{
  onUndockScene: (() => void) | null;
  showLabels: boolean;
  onToggleLabels: () => void;
  t: (key: any) => string;
}> = ({ onUndockScene, showLabels, onToggleLabels, t }) => {
  return (
    <div
      style={{
        position: "absolute",
        top: 12,
        right: 12,
        zIndex: 80,
        display: "flex",
        gap: 6,
        flexWrap: "wrap",
        justifyContent: "flex-end",
        maxWidth: "calc(100% - 24px)",
        pointerEvents: "auto",
      }}
      aria-label="SCENE_OVERLAY_CONTROLS"
    >
      {onUndockScene && (
        <button
          onClick={onUndockScene}
          title={t("scene.controls.undock")}
          aria-label="UNLOCK_SCENE3D"
          style={{
            width: 34,
            height: 34,
            borderRadius: 2,
            background: "linear-gradient(180deg, rgba(0,0,0,0.75), rgba(0,0,0,0.35))",
            border: "1px solid rgba(0,255,136,0.35)",
            boxShadow: "0 0 16px rgba(0,255,136,0.18)",
            color: SCENE_TOKENS.accentGreen,
            cursor: "pointer",
            display: "grid",
            placeItems: "center",
            fontFamily: SCENE_TOKENS.fontMono,
            userSelect: "none",
            fontSize: 16,
            lineHeight: "16px",
            padding: 0,
            flex: "0 0 auto",
          }}
        >
          ↗
        </button>
      )}

      <button
        onClick={onToggleLabels}
        title={showLabels ? t("scene.controls.hideCards") : t("scene.controls.showCards")}
        aria-label="TOGGLE_NODE_LABELS"
        style={{
          width: 34,
          height: 34,
          borderRadius: 2,
          background: "linear-gradient(180deg, rgba(0,0,0,0.75), rgba(0,0,0,0.35))",
          border: `1px solid ${showLabels ? "rgba(0,229,255,0.55)" : "rgba(0,255,136,0.35)"}`,
          boxShadow: showLabels ? "0 0 16px rgba(0,229,255,0.25)" : "0 0 16px rgba(0,255,136,0.18)",
          color: showLabels ? SCENE_TOKENS.accentCyan : SCENE_TOKENS.accentGreen,
          cursor: "pointer",
          display: "grid",
          placeItems: "center",
          fontFamily: SCENE_TOKENS.fontMono,
          userSelect: "none",
          flex: "0 0 auto",
        }}
      >
        {showLabels ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
            <path d="M4 4l16 16" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </div>
  );
};

