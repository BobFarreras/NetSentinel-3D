// src/ui/features/traffic/components/TrafficPanel.tsx
// Panel Traffic: composicion de UI (filtros + tabla) y conexion con el hook de estado de trafico.

import React from "react";
import type { DeviceDTO } from "../../../../shared/dtos/NetworkDTOs";
import { useTrafficPanelState, type UITrafficPacket } from "../hooks/useTrafficPanelState";
import { TrafficFilterBar } from "./TrafficFilterBar";
import { trafficRootStyle } from "./TrafficStyles";
import { TrafficTable } from "./TrafficTable";

interface TrafficPanelProps {
  isActive: boolean;
  speed: number;
  packets: UITrafficPacket[];
  jammedPackets?: UITrafficPacket[];
  jammedIps?: string[];
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
  jammedIps = [],
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

  const targetOptions = React.useMemo(() => {
    const opts = devices
      .slice()
      .sort((a, b) => (a.ip || "").localeCompare(b.ip || ""))
      .map((d) => {
        const hostname = d.hostname?.trim();
        const name = (d.name ?? "").trim();
        const vendor = d.vendor?.trim();
        const label =
          (hostname && hostname.toLowerCase() !== "unknown" && hostname) ||
          (name && name) ||
          (vendor && vendor.toLowerCase() !== "unknown" && vendor) ||
          d.ip;
        return { ip: d.ip, label: `${label} (${d.ip})` };
      });
    return [{ ip: "", label: "AUTO (selected node)" }, ...opts];
  }, [devices]);

  return (
    <div style={trafficRootStyle}>
      <TrafficFilterBar
        packetsCount={packets.length}
        jammedPacketsCount={jammedPackets.length}
        jammedTargetsCount={jammedIps.length}
        filterMode={state.filterMode}
        targetLabel={state.targetLabel}
        selectedDevice={selectedDevice}
        onFilterChange={state.handleFilterChange}
        targetOptions={targetOptions}
        selectedTargetIp={state.targetIp ?? ""}
        onTargetChange={(ip) => state.handleTargetChange(ip ? ip : null)}
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
