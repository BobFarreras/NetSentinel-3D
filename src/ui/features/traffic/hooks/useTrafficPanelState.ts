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
  targetIp: string | null;
  sourcePackets: UITrafficPacket[];
  filteredPackets: UITrafficPacket[];
  visiblePackets: UITrafficPacket[];
  targetLabel: string;
  handleFilterChange: (mode: FilterMode) => void;
  handleTargetChange: (ip: string | null) => void;
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
  const [targetIp, setTargetIp] = useState<string | null>(null);

  useEffect(() => {
    if (selectedDevice?.ip) {
      setTargetIp(selectedDevice.ip);
      setFilterMode("TARGET");
    } else {
      setFilterMode("ALL");
    }
    setVisibleLimit(50);
    if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0;
  }, [selectedDevice]);

  const handleFilterChange = (mode: FilterMode) => {
    setFilterMode(mode);
    setVisibleLimit(50);
    if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0;
  };

  const handleTargetChange = (ip: string | null) => {
    setTargetIp(ip);
    setFilterMode(ip ? "TARGET" : "ALL");
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
    if (device) {
      const hostname = device.hostname?.trim();
      if (hostname && hostname.toLowerCase() !== "unknown") return `💻 ${hostname}`;
      const name = (device.name ?? "").trim();
      if (name) return `📟 ${name}`;
      const vendor = (device.vendor ?? "").trim();
      if (vendor && vendor.toLowerCase() !== "unknown") return `📱 ${vendor}`;
      return ip;
    }
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
    if (filterMode === "TARGET") {
      const ip = targetIp ?? selectedDevice?.ip ?? null;
      if (ip) filtered = sourcePackets.filter((p) => p.sourceIp === ip || p.destinationIp === ip);
    }
    return filtered;
  }, [sourcePackets, filterMode, selectedDevice, targetIp]);

  const visiblePackets = useMemo(() => {
    return filteredPackets.slice(0, visibleLimit);
  }, [filteredPackets, visibleLimit]);

  const targetLabel = useMemo(() => {
    const ip = targetIp ?? selectedDevice?.ip ?? null;
    if (!ip) return "🎯 TARGET";
    const d = devices.find((x) => x.ip === ip) ?? null;
    if (!d) return `🎯 ${ip}`;
    const hostname = d.hostname?.trim();
    if (hostname && hostname.toLowerCase() !== "unknown") return `🎯 ${hostname}`;
    const name = (d.name ?? "").trim();
    if (name) return `🎯 ${name}`;
    const vendor = (d.vendor ?? "").trim();
    if (vendor && vendor.toLowerCase() !== "unknown") return `🎯 ${vendor}`;
    return `🎯 ${ip}`;
  }, [selectedDevice, targetIp, devices]);

  return {
    filterMode,
    visibleLimit,
    scrollContainerRef,
    targetIp,
    sourcePackets,
    filteredPackets,
    visiblePackets,
    targetLabel,
    handleFilterChange,
    handleTargetChange,
    handleScroll,
    resolveName,
  };
};
