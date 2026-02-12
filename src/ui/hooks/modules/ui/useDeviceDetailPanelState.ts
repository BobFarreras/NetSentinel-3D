// src/ui/hooks/modules/ui/useDeviceDetailPanelState.ts
import { useMemo, useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core"; // Asegúrate de importar invoke
import type { DeviceDTO, HostIdentity } from "../../../../shared/dtos/NetworkDTOs";

type UseDeviceDetailPanelStateArgs = {
  device: DeviceDTO;
  onRouterAudit: (ip: string) => void;
  onOpenLabAudit: (device: DeviceDTO) => void;
};

type UseDeviceDetailPanelState = {
  resolvedName: string;
  normalizedMac: string;
  hasWifiSection: boolean;
  getSignalColor: (signal?: number) => string;
  handleRouterAudit: () => void;
  handleOpenLabAudit: () => void;
  identity: HostIdentity | null; // <--- AHORA EXPOSTO
};

export const useDeviceDetailPanelState = ({
  device,
  onRouterAudit,
  onOpenLabAudit,
}: UseDeviceDetailPanelStateArgs): UseDeviceDetailPanelState => {
  
  const [identity, setIdentity] = useState<HostIdentity | null>(null);

  // Cargamos la identidad para saber quién es el HOST
  useEffect(() => {
    invoke<HostIdentity>("get_identity")
      .then(setIdentity)
      .catch(console.error);
  }, []);

  const resolvedName = useMemo(() => {
    return device.name || device.hostname || "Unknown";
  }, [device.name, device.hostname]);

  const normalizedMac = useMemo(() => {
    return device.mac.toUpperCase();
  }, [device.mac]);

  const hasWifiSection = useMemo(() => {
    return Boolean(device.signal_strength || device.wifi_band);
  }, [device.signal_strength, device.wifi_band]);

  const getSignalColor = (signal?: number) => {
    if (signal === undefined) return "#fff";
    if (signal > -60) return "#0f0";
    if (signal > -75) return "#ffff00";
    return "#ff5555";
  };

  return {
    resolvedName,
    normalizedMac,
    hasWifiSection,
    getSignalColor,
    handleRouterAudit: () => onRouterAudit(device.ip),
    handleOpenLabAudit: () => onOpenLabAudit(device),
    identity, // <--- RETORNADO AQUÍ
  };
};