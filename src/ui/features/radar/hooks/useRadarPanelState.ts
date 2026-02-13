// src/ui/features/radar/hooks/useRadarPanelState.ts
// Estado del RadarPanel: normaliza redes WiFi en nodos, aplica filtros y coordina auto-scan + seleccion.

import { useEffect, useMemo, useRef, useState } from "react";
import type { WifiNetworkDTO } from "../../../../shared/dtos/NetworkDTOs";
import type { BandFilter, RiskFilter } from "../components/radar/radarTypes";
import { clamp, hashToAngleDeg, inferBandLabel } from "../components/radar/radarUtils";
import { useWifiRadar } from "./useWifiRadar";
import { useWifiRadarSelection } from "./useWifiRadarSelection";

type UseRadarPanelState = {
  scanning: boolean;
  networks: WifiNetworkDTO[];
  error: string | null;
  lastScanAt: number | null;
  selectedBssid: string | null;
  selected: WifiNetworkDTO | null;
  showIntelHelp: boolean;
  accepted: boolean;
  riskFilter: RiskFilter;
  bandFilter: BandFilter;
  channelFilter: number | null;
  search: string;
  autoRefresh: boolean;
  autoTick: number;
  filteredNetworks: WifiNetworkDTO[];
  nodes: Array<WifiNetworkDTO & { x: number; y: number }>;
  availableChannels: number[];
  setSelectedBssid: (bssid: string) => void;
  setRiskFilter: (value: RiskFilter) => void;
  setBandFilter: (value: BandFilter) => void;
  setChannelFilter: (value: number | null) => void;
  setSearch: (value: string) => void;
  setAutoRefresh: (value: boolean) => void;
  toggleIntelHelp: () => void;
  scan: () => Promise<void>;
  acceptLegal: () => void;
};

export const useRadarPanelState = (): UseRadarPanelState => {
  const { scanning, networks, error, lastScanAt, scan } = useWifiRadar();
  const { selectedBssid, setSelectedBssid } = useWifiRadarSelection();
  const [showIntelHelp, setShowIntelHelp] = useState(false);
  const [accepted, setAccepted] = useState<boolean>(() => {
    return localStorage.getItem("netsentinel.radar.legalAccepted") === "true";
  });
  const didInitialScan = useRef(false);

  const [riskFilter, setRiskFilter] = useState<RiskFilter>("ALL");
  const [bandFilter, setBandFilter] = useState<BandFilter>("ALL");
  const [channelFilter, setChannelFilter] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [autoTick, setAutoTick] = useState(0);

  const isMounted = useRef(true);
  const scanningRef = useRef(false);

  useEffect(() => {
    scanningRef.current = scanning;
  }, [scanning]);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Auto-scan inicial para evitar la sensacion de "no detecta nada" al abrir.
  useEffect(() => {
    if (!accepted) return;
    if (didInitialScan.current) return;
    if (scanning) return;
    if (error) return;

    didInitialScan.current = true;
    // Si falla, el usuario siempre puede relanzar manualmente.
    void scan();
  }, [accepted, scanning, error, scan]);

  useEffect(() => {
    if (!accepted || !autoRefresh) return;

    // Disparar un scan inmediato al activar AUTO para que el usuario vea feedback sin esperar el primer intervalo.
    void scan();

    const id = window.setInterval(() => {
      // Evitar solapar escaneos.
      if (!isMounted.current || scanningRef.current) return;
      void scan();
    }, 5000);

    return () => {
      window.clearInterval(id);
    };
  }, [accepted, autoRefresh, scan]);

  useEffect(() => {
    if (!accepted || !autoRefresh) {
      setAutoTick(0);
      return;
    }

    setAutoTick(5);
    const id = window.setInterval(() => {
      setAutoTick((s) => (s <= 1 ? 5 : s - 1));
    }, 1000);

    return () => window.clearInterval(id);
  }, [accepted, autoRefresh]);

  const filteredNetworks = useMemo(() => {
    const q = search.trim().toLowerCase();
    return networks
      .filter((n) => {
        if (riskFilter !== "ALL" && (n.riskLevel || "").toUpperCase() !== riskFilter) return false;
        const band = inferBandLabel(n.channel);
        if (bandFilter !== "ALL" && band !== bandFilter) return false;
        if (channelFilter !== null && (n.channel ?? -1) !== channelFilter) return false;
        if (q) {
          const ssid = (n.ssid || "").toLowerCase();
          const vendor = (n.vendor || "").toLowerCase();
          const bssid = (n.bssid || "").toLowerCase();
          if (!ssid.includes(q) && !vendor.includes(q) && !bssid.includes(q)) return false;
        }
        return true;
      })
      // Orden tactico: mas fuerte primero (RSSI mas cercano a 0).
      .sort((a, b) => (b.signalLevel ?? -100) - (a.signalLevel ?? -100));
  }, [networks, riskFilter, bandFilter, channelFilter, search]);

  const nodes = useMemo(() => {
    return filteredNetworks.map((n) => {
      const angle = (hashToAngleDeg(n.bssid) * Math.PI) / 180;
      const dist = clamp(n.distanceMock ?? 60, 5, 60);
      // 0..1 => 0.1..0.95 del radio
      const r = clamp((dist - 5) / (60 - 5), 0, 1);
      const radius = 0.12 + r * 0.78;
      return {
        ...n,
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
      };
    });
  }, [filteredNetworks]);

  const selected = useMemo<WifiNetworkDTO | null>(() => {
    if (!selectedBssid) return null;
    return networks.find((n) => n.bssid === selectedBssid) || null;
  }, [networks, selectedBssid]);

  const availableChannels = useMemo(() => {
    const uniq = new Set<number>();
    networks.forEach((n) => {
      if (typeof n.channel === "number") uniq.add(n.channel);
    });
    return Array.from(uniq).sort((a, b) => a - b).slice(0, 12);
  }, [networks]);

  const acceptLegal = () => {
    localStorage.setItem("netsentinel.radar.legalAccepted", "true");
    setAccepted(true);
  };

  return {
    scanning,
    networks,
    error,
    lastScanAt,
    selectedBssid,
    selected,
    showIntelHelp,
    accepted,
    riskFilter,
    bandFilter,
    channelFilter,
    search,
    autoRefresh,
    autoTick,
    filteredNetworks,
    nodes,
    availableChannels,
    setSelectedBssid,
    setRiskFilter,
    setBandFilter,
    setChannelFilter,
    setSearch,
    setAutoRefresh,
    toggleIntelHelp: () => setShowIntelHelp((v) => !v),
    scan,
    acceptLegal,
  };
};
