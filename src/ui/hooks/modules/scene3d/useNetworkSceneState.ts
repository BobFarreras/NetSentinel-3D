// src/ui/hooks/modules/scene3d/useNetworkSceneState.ts
import { useEffect, useMemo, useState } from "react";
import type { DeviceDTO, HostIdentity } from "../../../../shared/dtos/NetworkDTOs";
import { applyDeviceIntel, classifyDeviceIntel } from "../../../../core/logic/deviceIntel";

type UseNetworkSceneStateArgs = {
  devices: DeviceDTO[];
  identity?: HostIdentity | null;
  intruders?: string[];
};

type UseNetworkSceneState = {
  showLabels: boolean;
  toggleLabels: () => void;
  enrichedDevices: DeviceDTO[];
  centerNode?: DeviceDTO;
  orbitingNodes: DeviceDTO[];
  getNodeColor: (device: DeviceDTO) => string;
};

export const useNetworkSceneState = ({ devices, identity = null, intruders = [] }: UseNetworkSceneStateArgs): UseNetworkSceneState => {
  const [showLabels, setShowLabels] = useState(() => {
    try {
      const raw = localStorage.getItem("netsentinel.showNodeLabels");
      if (raw === null) return true;
      return raw === "true";
    } catch {
      return true;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("netsentinel.showNodeLabels", String(showLabels));
    } catch {
      // Ignorar: en tests/sandbox puede no existir storage.
    }
  }, [showLabels]);

  const enrichedDevices = useMemo(() => {
    return devices.map((d) => {
      const intel = classifyDeviceIntel(d, { gatewayIp: identity?.gatewayIp, hostIp: identity?.ip || null });
      return applyDeviceIntel(d, intel);
    });
  }, [devices, identity?.gatewayIp, identity?.ip]);

  const { centerNode, orbitingNodes } = useMemo(() => {
    const gateway = enrichedDevices.find(
      (d) => Boolean(d.isGateway) || (identity?.gatewayIp ? d.ip === identity.gatewayIp : d.ip.endsWith(".1"))
    );
    const others = enrichedDevices.filter(
      (d) => !Boolean(d.isGateway) && (identity?.gatewayIp ? d.ip !== identity.gatewayIp : !d.ip.endsWith(".1"))
    );
    return { centerNode: gateway, orbitingNodes: others };
  }, [enrichedDevices, identity?.gatewayIp]);

  const getNodeColor = (device: DeviceDTO) => {
    const isIntruder = intruders.includes(device.ip);
    const isMe =
      (identity?.ip ? device.ip === identity.ip : false) ||
      device.vendor.includes("NETSENTINEL") ||
      device.vendor.includes("(ME)");
    const hasWifiData = device.wifi_band || device.signal_strength;

    if (isMe) return "#00ff00";
    if (isIntruder) return "#ff0000";
    if (hasWifiData) return "#ff00ff";
    return "#ff4444";
  };

  return {
    showLabels,
    toggleLabels: () => setShowLabels((v) => !v),
    enrichedDevices,
    centerNode,
    orbitingNodes,
    getNodeColor,
  };
};
