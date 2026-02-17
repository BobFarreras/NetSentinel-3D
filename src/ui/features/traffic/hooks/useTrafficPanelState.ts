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

    // Heuristica ligera: etiqueta algunos destinos comunes por prefijo IP (sin red / sin APIs externas).
    // Nota: esto NO es autoritativo; solo ayuda a lectura rapida en tabla.
    const isPrivateIpv4 = (value: string) => {
      if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(value)) return false;
      const [a, b] = value.split(".").map((x) => Number(x));
      if (a === 10) return true;
      if (a === 192 && b === 168) return true;
      if (a === 172 && b >= 16 && b <= 31) return true;
      return false;
    };

    const guessOrg = (value: string): string | null => {
      if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(value)) return null;
      const [a, b] = value.split(".").map((x) => Number(x));
      // Google (no exhaustivo)
      if (a === 172 && (b === 217 || b === 253)) return "GOOGLE";
      if (a === 216 && b === 239) return "GOOGLE";
      if (a === 142 && b === 250) return "GOOGLE";
      if (a === 35 || a === 34) return "GOOGLE CLOUD";
      // Meta (Instagram/Facebook)
      if (a === 157 && b === 240) return "META (IG/FB)";
      if (a === 31 && b === 13) return "META (IG/FB)";
      if (a === 129 && b === 134) return "META (IG/FB)";
      // Cloudflare
      if (a === 104 && b >= 16 && b <= 31) return "CLOUDFLARE";
      if (a === 104 && b === 21) return "CLOUDFLARE";
      if (a === 172 && b === 64) return "CLOUDFLARE";
      // AWS (muy amplio; solo etiquetas tipicas)
      if (a === 52 || a === 54 || a === 13 || a === 18) return "AWS";
      // Apple
      if (a === 17) return "APPLE";
      // Fastly
      if (a === 151 && b === 101) return "FASTLY";
      return null;
    };

    if (!isPrivateIpv4(ip)) {
      const org = guessOrg(ip);
      if (org) return `🌐 ${org} (${ip})`;
    }
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
