import React from "react";
import type { DeviceDTO } from "../../../shared/dtos/NetworkDTOs";
import { useTrafficPanelState, type UITrafficPacket } from "../../hooks/modules/useTrafficPanelState";
import { TrafficFilterBar } from "./traffic/TrafficFilterBar";
import { trafficRootStyle } from "./traffic/TrafficStyles";
import { TrafficTable } from "./traffic/TrafficTable";

interface TrafficPanelProps {
  isActive: boolean;
  speed: number;
  packets: UITrafficPacket[];
  jammedPackets?: UITrafficPacket[];
  devices: DeviceDTO[];
  selectedDevice?: DeviceDTO | null;
  onClear?: () => void;
  onToggle?: () => void;
  compactMode?: boolean;
}

export const TrafficPanel: React.FC<TrafficPanelProps> = ({
  isActive,
  packets,
  jammedPackets = [],
  devices,
  selectedDevice,
  onClear,
}) => {
  const state = useTrafficPanelState({
    packets,
    jammedPackets,
    devices,
    selectedDevice,
  });

  return (
    <div style={trafficRootStyle}>
      <TrafficFilterBar
        packetsCount={packets.length}
        jammedPacketsCount={jammedPackets.length}
        filterMode={state.filterMode}
        targetLabel={state.targetLabel}
        selectedDevice={selectedDevice}
        onFilterChange={state.handleFilterChange}
        onClear={onClear}
      />

      <TrafficTable
        isActive={isActive}
        filterMode={state.filterMode}
        visiblePackets={state.visiblePackets}
        filteredPacketsCount={state.filteredPackets.length}
        visibleLimit={state.visibleLimit}
        onScroll={state.handleScroll}
        resolveName={state.resolveName}
        scrollContainerRef={state.scrollContainerRef}
      />
    </div>
  );
};
