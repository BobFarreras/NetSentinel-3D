import React from "react";
import { useRadarPanelState } from "../../hooks/modules/useRadarPanelState";
import { RadarHeader } from "./radar/RadarHeader";
import { RadarIntelPanel } from "./radar/RadarIntelPanel";
import { RadarLegalModal } from "./radar/RadarLegalModal";
import { RadarScope } from "./radar/RadarScope";

interface RadarPanelProps {
  onClose: () => void;
}

export const RadarPanel: React.FC<RadarPanelProps> = ({ onClose }) => {
  const state = useRadarPanelState();

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        minWidth: 320,
        minHeight: 240,
        background: "#050607",
        border: "1px solid #0a3",
        boxShadow: "0 0 0 1px rgba(0,255,136,0.12), 0 25px 80px rgba(0,0,0,0.65)",
        position: "relative",
        overflow: "hidden",
        fontFamily: "'Consolas', 'Courier New', monospace",
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
        onToggleAuto={state.setAutoRefresh}
        onScan={() => {
          void state.scan();
        }}
        onClose={onClose}
      />

      <div style={{ display: "flex", height: "calc(100% - 44px)" }}>
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
        />
      </div>

      {!state.accepted && <RadarLegalModal onClose={onClose} onAccept={state.acceptLegal} />}
    </div>
  );
};
