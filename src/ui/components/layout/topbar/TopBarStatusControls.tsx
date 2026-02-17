// src/ui/components/layout/topbar/TopBarStatusControls.tsx
// Estado a la derecha en TopBar: contador de nodos + controles de ventana (min/max/close) en runtime Tauri.

import React from "react";
import { windowingAdapter } from "../../../../adapters/windowingAdapter";
import { topbarWinBtn } from "./topbarStyles";

export const TopBarStatusControls: React.FC<{
  activeNodes: number;
  nodesLabel: string;
  onMinimize: () => void | Promise<void>;
  onToggleMaximize: () => void | Promise<void>;
  onCloseWindow: () => void | Promise<void>;
  isMaximized: boolean;
  tMinimize: string;
  tMaximize: string;
  tRestore: string;
  tClose: string;
}> = (props) => {
  const { activeNodes, nodesLabel, onMinimize, onToggleMaximize, onCloseWindow, isMaximized, tMinimize, tMaximize, tRestore, tClose } =
    props;

  return (
    <div
      style={{
        fontSize: "0.8rem",
        color: "#88ff88",
        fontFamily: "monospace",
        borderLeft: "1px solid #004400",
        paddingLeft: "10px",
        whiteSpace: "nowrap",
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      <span>
        {nodesLabel}: <b style={{ color: "#fff" }}>{activeNodes}</b>
      </span>

      {windowingAdapter.isTauriRuntime() && (
        <div style={{ display: "flex", gap: 6, marginLeft: 6 }} aria-label="TOPBAR_WINDOW_CONTROLS">
          <button style={topbarWinBtn} onClick={() => void onMinimize()} aria-label="WIN_MINIMIZE" title={tMinimize}>
            _
          </button>
          <button
            style={topbarWinBtn}
            onClick={() => void onToggleMaximize()}
            aria-label="WIN_MAXIMIZE"
            title={isMaximized ? tRestore : tMaximize}
          >
            {isMaximized ? "▢" : "□"}
          </button>
          <button
            style={{ ...topbarWinBtn, border: "1px solid rgba(255,85,85,0.35)", color: "rgba(255,85,85,0.95)" }}
            onClick={() => void onCloseWindow()}
            aria-label="WIN_CLOSE"
            title={tClose}
          >
            X
          </button>
        </div>
      )}
    </div>
  );
};

