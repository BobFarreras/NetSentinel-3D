// src/ui/utils/routerCandidates.ts
// Utilidad UI: heuristicas para obtener candidatos de "router/gateway" desde el inventario actual (para selects y acciones rapidas).

import type { DeviceDTO, HostIdentity } from "../../shared/dtos/NetworkDTOs";

export const getRouterCandidates = (
  devices: DeviceDTO[],
  identity: HostIdentity | null,
): DeviceDTO[] => {
  const gatewayIp = identity?.gatewayIp ?? null;

  const candidates = devices.filter((d) => {
    if (d.isGateway) return true;
    if (gatewayIp && d.ip === gatewayIp) return true;
    // Fallback comun en redes domesticas: el gateway suele ser *.1
    if (d.ip.endsWith(".1")) return true;
    return false;
  });

  // Dedupe por IP manteniendo el orden.
  const seen = new Set<string>();
  return candidates.filter((d) => {
    if (seen.has(d.ip)) return false;
    seen.add(d.ip);
    return true;
  });
};

