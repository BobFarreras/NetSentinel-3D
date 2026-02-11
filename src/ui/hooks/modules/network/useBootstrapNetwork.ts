// src/ui/hooks/modules/network/useBootstrapNetwork.ts
import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import { DeviceDTO, HostIdentity } from "../../../../shared/dtos/NetworkDTOs";
import { networkAdapter } from "../../../../adapters/networkAdapter";
import { auditAdapter } from "../../../../adapters/auditAdapter";
import { uiLogger } from "../../../utils/logger";

interface UseBootstrapNetworkParams {
  startScan: (range?: string) => Promise<void>;
  setDevices: Dispatch<SetStateAction<DeviceDTO[]>>;
}

const netmaskToPrefix = (netmask: string): number | null => {
  const parts = netmask.split(".").map((p) => Number(p));
  if (parts.length !== 4 || parts.some((n) => !Number.isFinite(n) || n < 0 || n > 255)) return null;

  let bits = 0;
  const map: Record<number, number> = { 255: 8, 254: 7, 252: 6, 248: 5, 240: 4, 224: 3, 192: 2, 128: 1, 0: 0 };
  for (const n of parts) {
    if (map[n] === undefined) return null;
    bits += map[n];
  }
  return bits;
};

export const deriveCidrFromIdentity = (identity: HostIdentity | null): string => {
  if (!identity?.ip) return "192.168.1.0/24";

  const prefix = netmaskToPrefix(identity.netmask) ?? 24;
  const ipParts = identity.ip.split(".").map((p) => Number(p));
  if (ipParts.length !== 4 || ipParts.some((n) => !Number.isFinite(n))) return "192.168.1.0/24";

  return `${ipParts[0]}.${ipParts[1]}.${ipParts[2]}.0/${prefix}`;
};

export const useBootstrapNetwork = ({ startScan, setDevices }: UseBootstrapNetworkParams) => {
  const [identity, setIdentity] = useState<HostIdentity | null>(null);
  const bootAutoScanDone = useRef(false);
  const bootRouterSyncDone = useRef(false);

  useEffect(() => {
    let mounted = true;

    const loadIdentity = async () => {
      try {
        const id = await networkAdapter.getHostIdentity();
        if (mounted) setIdentity(id);
      } catch (error) {
        uiLogger.error("Error cargando identidad local", error);
      }
    };

    void loadIdentity();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!identity || bootAutoScanDone.current) return;
    bootAutoScanDone.current = true;

    const pref = localStorage.getItem("netsentinel:autoScanOnStartup");
    const enabled = pref === null ? true : pref === "true";
    if (!enabled) return;

    void startScan(deriveCidrFromIdentity(identity));
  }, [identity, startScan]);

  useEffect(() => {
    if (!identity?.gatewayIp || bootRouterSyncDone.current) return;
    bootRouterSyncDone.current = true;

    const syncRouterDevices = async () => {
      try {
        const creds = await networkAdapter.getGatewayCredentials(identity.gatewayIp);
        if (!creds) return;

        const routerDevices = await auditAdapter.fetchRouterDevices(identity.gatewayIp, creds.user, creds.pass);
        setDevices((prev) => {
          const map = new Map(prev.map((d) => [d.ip, d]));
          routerDevices.forEach((rd) => {
            const existing = map.get(rd.ip);
            if (!existing) {
              map.set(rd.ip, rd);
              return;
            }
            map.set(rd.ip, {
              ...existing,
              vendor: rd.vendor && rd.vendor !== rd.ip ? rd.vendor : existing.vendor,
              hostname: rd.hostname ?? existing.hostname,
              signal_strength: rd.signal_strength ?? existing.signal_strength,
              signal_rate: rd.signal_rate ?? existing.signal_rate,
              wifi_band: rd.wifi_band ?? existing.wifi_band,
            });
          });
          const merged = Array.from(map.values());
          void networkAdapter.saveLatestSnapshot(merged);
          return merged;
        });
      } catch (error) {
        uiLogger.warn("Fallo en sincronizacion automatica del gateway", error);
      }
    };

    void syncRouterDevices();
  }, [identity?.gatewayIp, setDevices]);

  return {
    identity,
    deriveCidr: () => deriveCidrFromIdentity(identity),
  };
};
