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
  const [observedWidth, setObservedWidth] = useState<number>(0);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    // Objetivo UX: no cambiar a stacked hasta que el contenedor sea realmente muy pequeno.
    // Nota: en runtime Tauri a veces el ResizeObserver no dispara justo al montar (o el panel se monta en un
    // contenedor con width transitorio). Por eso hacemos una medicion inicial via getBoundingClientRect + RAF.
    // Si el panel es estrecho pero aún supera NARROW_AT, el scope puede quedar aplastado
    // porque el Intel lateral consume 290px. Por eso la regla real es: stacked cuando el scope
    // tendría menos de ~260px de ancho util.
    const INTEL_SIDE_WIDTH = 190;
    const MIN_SCOPE_SIDE = 160;
    const MIN_SCOPE_SIDE_EXIT = 240; // histeresis al volver a modo wide

    const applyWidth = (w: number) => {
      if (!w) return;
      setObservedWidth(w);
      setIsNarrow((prev) => {
        const scopeW = w - INTEL_SIDE_WIDTH;
        if (prev && scopeW > MIN_SCOPE_SIDE_EXIT) return false;
        if (!prev && scopeW < MIN_SCOPE_SIDE) return true;
        return prev;
      });

      // Debug opt-in sin ensuciar UI: localStorage ns.debug.radar=1
      try {
        if (localStorage.getItem("ns.debug.radar") === "1") {
          // eslint-disable-next-line no-console
          console.log("[radar] width=", Math.round(w));
        }
      } catch {
        // ignore
      }
    };

    // Histeresis para evitar "saltos" al arrastrar el separador cerca del breakpoint.
    // Ajustado: el Radar aguanta mas tiempo en modo wide antes de pasar a stacked (narrow).
    // Narrow < NARROW_AT, Wide > WIDE_AT.

    // Medicion inicial (evita estados pegados tras HMR o mounts transitorios).
    const raf = requestAnimationFrame(() => applyWidth(el.getBoundingClientRect().width));

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver((entries) => {
        const w = entries[0]?.contentRect?.width ?? 0;
        applyWidth(w);
      });
      ro.observe(el);
    }

    return () => {
      cancelAnimationFrame(raf);
      ro?.disconnect();
    };
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
        error={state.error}
        networksCount={state.networks.length}
        visibleCount={state.filteredNetworks.length}
        lastScanAt={state.lastScanAt}
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
        {/* Debug opt-in: muestra ancho observado para diagnosticar breakpoints en runtime. */}
        {false && (
          <div style={{ position: "absolute", top: 48, right: 10, zIndex: 50, fontSize: 10, color: "#00ff88" }}>
            w={Math.round(observedWidth)} narrow={String(isNarrow)}
          </div>
        )}
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
            filteredNetworks={state.filteredNetworks}
            nodes={state.nodes}
            selectedBssid={state.selectedBssid}
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
