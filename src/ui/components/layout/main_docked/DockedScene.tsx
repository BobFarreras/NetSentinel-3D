// src/ui/components/layout/main_docked/DockedScene.tsx
// Area 3D docked: renderiza NetworkScene en Suspense y expone accion de undock.

import React, { Suspense, lazy } from "react";
import type { DeviceDTO, HostIdentity } from "../../../../shared/dtos/NetworkDTOs";

const NetworkScene = lazy(async () => {
  const mod = await import("../../../features/scene3d/components/NetworkScene");
  return { default: mod.NetworkScene };
});

export const DockedScene: React.FC<{
  show: boolean;
  devices: DeviceDTO[];
  selectedIp: string | undefined;
  intruders: string[];
  jammedIps: string[];
  identity: HostIdentity | null;
  onDeviceSelect: (device: DeviceDTO | null) => void;
  onUndock: () => void;
}> = ({ show, devices, selectedIp, intruders, jammedIps, identity, onDeviceSelect, onUndock }) => {
  if (!show) return null;
  return (
    <div style={{ flex: 1, minWidth: 0, minHeight: 0, position: "relative" }}>
      <Suspense fallback={null}>
        <NetworkScene
          devices={devices}
          onDeviceSelect={onDeviceSelect}
          selectedIp={selectedIp}
          intruders={intruders}
          jammedIps={jammedIps}
          identity={identity}
          onUndockScene={onUndock}
        />
      </Suspense>
    </div>
  );
};

