// src/ui/features/radar/components/radar/RadarIntelPanel.tsx
// Panel Intel del Radar: compone header/ayuda/filtros/detalles del WiFi seleccionado y delega acciones a helpers.

import React from "react";
import type { WifiNetworkDTO } from "../../../../../shared/dtos/NetworkDTOs";
import type { BandFilter, RiskFilter } from "./radarTypes";
import { RadarIntelHeader } from "./intel/RadarIntelHeader";
import { RadarIntelHelpCard } from "./intel/RadarIntelHelpCard";
import { RadarIntelFilters } from "./intel/RadarIntelFilters";
import { RadarIntelSelectionDetails } from "./intel/RadarIntelSelectionDetails";
import { openWifiAttackLabFromSelection } from "../../logic/openWifiAttackLabFromSelection";

type RadarIntelPanelProps = {
  selected: WifiNetworkDTO | null;
  showIntelHelp: boolean;
  riskFilter: RiskFilter;
  bandFilter: BandFilter;
  channelFilter: number | null;
  search: string;
  availableChannels: number[];
  onToggleHelp: () => void;
  onChangeRiskFilter: (value: RiskFilter) => void;
  onChangeBandFilter: (value: BandFilter) => void;
  onChangeChannelFilter: (value: number | null) => void;
  onChangeSearch: (value: string) => void;
  layout?: "side" | "bottom";
};

export const RadarIntelPanel: React.FC<RadarIntelPanelProps> = ({
  selected,
  showIntelHelp,
  riskFilter,
  bandFilter,
  channelFilter,
  search,
  availableChannels,
  onToggleHelp,
  onChangeRiskFilter,
  onChangeBandFilter,
  onChangeChannelFilter,
  onChangeSearch,
  layout = "side",
}) => {
  const canInlineOpenAudit = layout === "bottom" && !!selected && !selected.isConnected;

  return (
    <div
      style={{
        width: layout === "side" ? 290 : "100%",
        borderLeft: layout === "side" ? "1px solid rgba(0,255,136,0.18)" : "none",
        borderTop: layout === "bottom" ? "1px solid rgba(0,255,136,0.18)" : "none",
        padding: 12,
        background: "linear-gradient(180deg, rgba(0,10,5,0.75), rgba(0,0,0,0.55))",
        color: "#b7ffe2",
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        overflow: "hidden",
        flexShrink: 0,
      }}
    >
      <RadarIntelHeader showIntelHelp={showIntelHelp} onToggleHelp={onToggleHelp} />

      {/* Scroll del panel completo: en ventanas pequenas, evita cortar filtros/botones. */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          // Deja espacio para scrollbar cuando existe, evitando que tape texto/controles.
          paddingRight: 10,
        }}
      >
        {showIntelHelp && <RadarIntelHelpCard />}

        <RadarIntelFilters
          layout={layout}
          riskFilter={riskFilter}
          bandFilter={bandFilter}
          channelFilter={channelFilter}
          search={search}
          availableChannels={availableChannels}
          onChangeRiskFilter={onChangeRiskFilter}
          onChangeBandFilter={onChangeBandFilter}
          onChangeChannelFilter={onChangeChannelFilter}
          onChangeSearch={onChangeSearch}
          inlineAuditAction={
            canInlineOpenAudit
              ? {
                  enabled: !!selected,
                  onClick: () => {
                    if (!selected) return;
                    openWifiAttackLabFromSelection(selected);
                  },
                }
              : null
          }
        />

        <RadarIntelSelectionDetails
          selected={selected}
          onOpenAudit={() => {
            if (!selected) return;
            openWifiAttackLabFromSelection(selected);
          }}
          showAuditButton={layout !== "bottom"}
        />
      </div>
    </div>
  );
};
