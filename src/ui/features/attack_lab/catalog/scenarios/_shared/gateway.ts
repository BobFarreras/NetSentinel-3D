// src/ui/features/attack_lab/catalog/scenarios/_shared/gateway.ts
// Helpers del catalogo: heuristica para identificar gateway (por DeviceDTO o por identity.gatewayIp).

import type { DeviceDTO, HostIdentity } from "../../../../../../shared/dtos/NetworkDTOs";

export const isGateway = (device: DeviceDTO, identity: HostIdentity | null): boolean => {
  if (device.isGateway) return true;
  if (identity?.gatewayIp && device.ip === identity.gatewayIp) return true;
  return false;
};
