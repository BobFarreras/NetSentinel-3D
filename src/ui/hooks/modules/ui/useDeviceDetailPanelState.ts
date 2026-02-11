// src/ui/hooks/modules/ui/useDeviceDetailPanelState.ts
import { useMemo } from "react";
import type { DeviceDTO } from "../../../../shared/dtos/NetworkDTOs";

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
};

export const useDeviceDetailPanelState = ({
  device,
  onRouterAudit,
  onOpenLabAudit,
}: UseDeviceDetailPanelStateArgs): UseDeviceDetailPanelState => {
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
  };
};
