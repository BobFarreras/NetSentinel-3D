// src/ui/features/radar/components/RadarPanel.tsx
// Panel Radar: composicion de UI (scope + intel + legal) y conexion con el hook de estado del radar.

import React, { useEffect, useRef, useState } from "react";
import { useRadarPanelState } from "../hooks/useRadarPanelState";
import { HUD_TYPO } from "../../../styles/hudTokens";
import { RadarHeader } from "./radar/RadarHeader";
import { RadarIntelPanel } from "./radar/RadarIntelPanel";
import { RadarLegalModal } from "./radar/RadarLegalModal";
import { RadarScope } from "./radar/RadarScope";

interface RadarPanelProps {
  onClose: () => void;
}

export const RadarPanel: React.FC<RadarPanelProps> = ({ onClose }) => {
  const state = useRadarPanelState();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [isNarrow, setIsNarrow] = useState(false);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    if (typeof ResizeObserver === "undefined") return;

    // Histeresis para evitar "saltos" al arrastrar el separador cerca del breakpoint.
    // Ajustado: el Radar aguanta mas tiempo en modo wide antes de pasar a stacked (narrow).
    // Narrow < 640, Wide > 700.
    const NARROW_AT = 640;
    const WIDE_AT = 700;

    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect?.width ?? 0;
      if (!w) return;
      setIsNarrow((prev) => {
        if (prev && w > WIDE_AT) return false;
        if (!prev && w < NARROW_AT) return true;
        return prev;
      });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={rootRef}
      style={{
        width: "100%",
        height: "100%",
        minWidth: 0,
        minHeight: 240,
        background: "#050607",
        border: "1px solid #0a3",
        boxShadow: "0 0 0 1px rgba(0,255,136,0.12), 0 25px 80px rgba(0,0,0,0.65)",
        position: "relative",
        overflow: "hidden",
        fontFamily: HUD_TYPO.mono,
        display: "flex",
        flexDirection: "column",
      }}
    >
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

      <RadarHeader
        accepted={state.accepted}
        autoRefresh={state.autoRefresh}
        autoTick={state.autoTick}
        scanning={state.scanning}
        compact={isNarrow}
        onToggleAuto={state.setAutoRefresh}
        onScan={() => {
          void state.scan();
        }}
        onClose={onClose}
      />

      {/*
        Body con scroll: en paneles docked muy pequenos (triple split), evita que el scope se aplaste
        y permite acceder a filtros/acciones sin recortes.
      */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: isNarrow ? "column" : "row",
          // Solo activamos scroll general en modo narrow (stacked). En modo wide,
          // cada subpanel gestiona su scroll para evitar doble-scroll y "UI rota".
          overflowY: isNarrow ? "auto" : "hidden",
          overflowX: "hidden",
          // Padding para que la barra de scroll no tape contenido (especialmente en Windows).
          paddingRight: isNarrow ? 10 : 0,
        }}
      >
        <div
          style={{
            flex: isNarrow ? "0 0 auto" : 1,
            minWidth: 0,
            minHeight: isNarrow ? 280 : 0,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <RadarScope
            accepted={state.accepted}
            scanning={state.scanning}
            error={state.error}
            networks={state.networks}
            filteredNetworks={state.filteredNetworks}
            nodes={state.nodes}
            selectedBssid={state.selectedBssid}
            lastScanAt={state.lastScanAt}
            onSelectNode={state.setSelectedBssid}
          />
        </div>

        <RadarIntelPanel
          selected={state.selected}
          showIntelHelp={state.showIntelHelp}
          riskFilter={state.riskFilter}
          bandFilter={state.bandFilter}
          channelFilter={state.channelFilter}
          search={state.search}
          availableChannels={state.availableChannels}
          onToggleHelp={state.toggleIntelHelp}
          onChangeRiskFilter={state.setRiskFilter}
          onChangeBandFilter={state.setBandFilter}
          onChangeChannelFilter={state.setChannelFilter}
          onChangeSearch={state.setSearch}
          layout={isNarrow ? "bottom" : "side"}
        />
      </div>

      {!state.accepted && <RadarLegalModal onClose={onClose} onAccept={state.acceptLegal} />}
    </div>
  );
};
