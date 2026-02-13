// src/ui/features/traffic/hooks/useTrafficPanelState.ts
// Estado del TrafficPanel: filtros (ALL/JAMMED/TARGET), paginacion incremental y resolucion de nombres.
import { useEffect, useMemo, useRef, useState } from "react";
import type { RefObject, UIEvent } from "react";
import type { DeviceDTO, TrafficPacket } from "../../../../shared/dtos/NetworkDTOs";

// Interfaz de paquete para capa UI.
export interface UITrafficPacket extends TrafficPacket {
  _uiId?: string;
  _seq?: number;
}

export type FilterMode = "ALL" | "JAMMED" | "TARGET";

type UseTrafficPanelStateArgs = {
  packets: UITrafficPacket[];
  jammedPackets: UITrafficPacket[];
  devices: DeviceDTO[];
  selectedDevice?: DeviceDTO | null;
};

type UseTrafficPanelState = {
  filterMode: FilterMode;
  visibleLimit: number;
  scrollContainerRef: RefObject<HTMLDivElement | null>;
  sourcePackets: UITrafficPacket[];
  filteredPackets: UITrafficPacket[];
  visiblePackets: UITrafficPacket[];
  targetLabel: string;
  handleFilterChange: (mode: FilterMode) => void;
  handleScroll: (e: UIEvent<HTMLDivElement>) => void;
  resolveName: (ip: string) => string;
};

export const useTrafficPanelState = ({
  packets,
  jammedPackets,
  devices,
  selectedDevice,
}: UseTrafficPanelStateArgs): UseTrafficPanelState => {
  const [filterMode, setFilterMode] = useState<FilterMode>("ALL");
  const [visibleLimit, setVisibleLimit] = useState(50);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedDevice) setFilterMode("TARGET");
    else setFilterMode("ALL");
    setVisibleLimit(50);
    if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0;
  }, [selectedDevice]);

  const handleFilterChange = (mode: FilterMode) => {
    setFilterMode(mode);
    setVisibleLimit(50);
    if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0;
  };

  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 50) {
      setVisibleLimit((prev) => prev + 50);
    }
  };

  const resolveName = (ip: string) => {
    const device = devices.find((d) => d.ip === ip);
    if (device) return device.hostname && device.hostname !== "Unknown" ? `💻 ${device.hostname}` : `📱 ${device.vendor}`;
    if (ip === "255.255.255.255") return "📢 BROADCAST";
    if (ip.startsWith("224.0") || ip.startsWith("239.")) return "📡 MULTICAST";
    if (ip === "8.8.8.8") return "🔍 GOOGLE DNS";
    return ip;
  };

  const sourcePackets = useMemo(() => {
    if (filterMode === "JAMMED") return jammedPackets;
    return packets;
  }, [packets, jammedPackets, filterMode]);

  const filteredPackets = useMemo(() => {
    let filtered = sourcePackets;
    if (filterMode === "TARGET" && selectedDevice) {
      filtered = sourcePackets.filter((p) => p.sourceIp === selectedDevice.ip || p.destinationIp === selectedDevice.ip);
    }
    return filtered;
  }, [sourcePackets, filterMode, selectedDevice]);

  const visiblePackets = useMemo(() => {
    return filteredPackets.slice(0, visibleLimit);
  }, [filteredPackets, visibleLimit]);

  const targetLabel = useMemo(() => {
    if (!selectedDevice) return "🎯 TARGET";
    const vendor = selectedDevice.vendor?.trim();
    if (vendor && vendor.toLowerCase() !== "unknown") return `🎯 ${vendor}`;
    const hostname = selectedDevice.hostname?.trim();
    if (hostname && hostname.toLowerCase() !== "unknown") return `🎯 ${hostname}`;
    return `🎯 ${selectedDevice.ip}`;
  }, [selectedDevice]);

  return {
    filterMode,
    visibleLimit,
    scrollContainerRef,
    sourcePackets,
    filteredPackets,
    visiblePackets,
    targetLabel,
    handleFilterChange,
    handleScroll,
    resolveName,
  };
};
