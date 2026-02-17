// src/ui/features/radar/components/radar/intel/RadarIntelFilters.tsx
// Bloque de filtros del Radar Intel: layout responsive y plegable en modo bottom para evitar scroll innecesario.

import React from "react";
import type { BandFilter, RiskFilter } from "../radarTypes";
import { useI18n } from "../../../../../i18n";
import { RadarIntelFiltersSideStrip } from "./filters/RadarIntelFiltersSideStrip";
import { RadarIntelFiltersBottomHeader } from "./filters/RadarIntelFiltersBottomHeader";
import { RadarIntelFiltersBottomSearchRow } from "./filters/RadarIntelFiltersBottomSearchRow";
import { RadarIntelFiltersBottomGrid } from "./filters/RadarIntelFiltersBottomGrid";

type RadarIntelFiltersProps = {
  layout: "side" | "bottom";
  riskFilter: RiskFilter;
  bandFilter: BandFilter;
  channelFilter: number | null;
  search: string;
  availableChannels: number[];
  onChangeRiskFilter: (value: RiskFilter) => void;
  onChangeBandFilter: (value: BandFilter) => void;
  onChangeChannelFilter: (value: number | null) => void;
  onChangeSearch: (value: string) => void;
  inlineAuditAction?: {
    enabled: boolean;
    onClick: () => void;
  } | null;
};

export const RadarIntelFilters: React.FC<RadarIntelFiltersProps> = ({
  layout,
  riskFilter,
  bandFilter,
  channelFilter,
  search,
  availableChannels,
  onChangeRiskFilter,
  onChangeBandFilter,
  onChangeChannelFilter,
  onChangeSearch,
  inlineAuditAction = null,
}) => {
  const { t } = useI18n();
  const [collapsed, setCollapsed] = React.useState(layout === "bottom");

  // Si cambiamos de layout por resize, reajustamos el colapso por defecto:
  // - side: siempre expandido
  // - bottom: por defecto plegado para que quepan detalles sin scroll
  React.useEffect(() => {
    setCollapsed(layout === "bottom");
  }, [layout]);

  return (
    <div style={{ marginBottom: 10, paddingBottom: 10, borderBottom: "1px solid rgba(0,255,136,0.14)" }}>
      {layout === "side" ? (
        <RadarIntelFiltersSideStrip
          t={t}
          riskFilter={riskFilter}
          bandFilter={bandFilter}
          channelFilter={channelFilter}
          search={search}
          availableChannels={availableChannels}
          onChangeRiskFilter={onChangeRiskFilter}
          onChangeBandFilter={onChangeBandFilter}
          onChangeChannelFilter={onChangeChannelFilter}
          onChangeSearch={onChangeSearch}
        />
      ) : (
        <>
          <RadarIntelFiltersBottomHeader
            t={t}
            riskFilter={riskFilter}
            bandFilter={bandFilter}
            channelFilter={channelFilter}
            collapsed={collapsed}
            onToggleCollapsed={() => setCollapsed((v) => !v)}
          />

          {/* Busqueda siempre visible para no perder control rapido cuando esta plegado. */}
          <RadarIntelFiltersBottomSearchRow
            t={t}
            search={search}
            onChangeSearch={onChangeSearch}
            collapsed={collapsed}
            inlineAuditAction={inlineAuditAction}
          />

          {!collapsed && (
            <RadarIntelFiltersBottomGrid
              t={t}
              riskFilter={riskFilter}
              bandFilter={bandFilter}
              channelFilter={channelFilter}
              availableChannels={availableChannels}
              onChangeRiskFilter={onChangeRiskFilter}
              onChangeBandFilter={onChangeBandFilter}
              onChangeChannelFilter={onChangeChannelFilter}
            />
          )}
        </>
      )}
    </div>
  );
};
