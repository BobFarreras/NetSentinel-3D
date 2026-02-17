// src/ui/hooks/modules/network/useRouterHacker.ts
// Hook de auditoria del gateway: ejecuta audit_router, guarda credenciales si aplica y fusiona inventario via fetch_router_devices.

import { useState } from 'react';
import { DeviceDTO, RouterAuditResult } from '../../../../shared/dtos/NetworkDTOs';
import { auditAdapter } from '../../../../adapters/auditAdapter';
import { networkAdapter } from '../../../../adapters/networkAdapter';
import { isBadVendor, isValidMac } from '../shared/deviceMerge';

const mergeRouterDevice = (routerDevice: DeviceDTO, oldDevice?: DeviceDTO): DeviceDTO => {
  if (!oldDevice) return routerDevice;

  const nextMac = isValidMac(routerDevice.mac)
    ? routerDevice.mac
    : (isValidMac(oldDevice.mac) ? oldDevice.mac : routerDevice.mac);

  const nextVendor = !isBadVendor(routerDevice.vendor)
    ? routerDevice.vendor
    : (!isBadVendor(oldDevice.vendor) ? oldDevice.vendor : routerDevice.vendor);

  return {
    ...routerDevice,
    mac: nextMac,
    vendor: nextVendor,
    hostname: routerDevice.hostname ?? oldDevice.hostname,
    name: routerDevice.name ?? oldDevice.name,
  };
};

// Inventario "autoritativo": tras un gateway sync, solo mantenemos lo que el router reporta
// (y opcionalmente conservamos el gateway si no viene en la lista).
const buildAuthoritativeRouterInventory = (prev: DeviceDTO[], routerDevices: DeviceDTO[], gatewayIp: string): DeviceDTO[] => {
  const prevByIp = new Map(prev.map((d) => [d.ip, d]));
  const next = routerDevices.map((rd) => mergeRouterDevice(rd, prevByIp.get(rd.ip)));

  // Asegurar que el gateway exista (algunos routers no se incluyen en su propia lista de clientes).
  if (!next.some((d) => d.ip === gatewayIp)) {
    const gw = prevByIp.get(gatewayIp) ?? prev.find((d) => Boolean(d.isGateway));
    if (gw) {
      next.push({
        ...gw,
        // A falta de un hostname real del router, evitamos "Unknown" para mejorar UX.
        name: gw.name ?? gw.hostname ?? "GATEWAY",
        hostname: gw.hostname ?? gw.name ?? "GATEWAY",
        isGateway: true,
      });
    }
  }

  // Asegurar que el host (NetSentinel) siga presente aunque el router no lo liste en su UI.
  // Esto evita que el nodo "self" (verde) desaparezca tras el sync autoritativo.
  const host = prev.find((d) => (d.vendor ?? "").includes("NETSENTINEL") || (d.vendor ?? "").includes("(ME)"));
  if (host && !next.some((d) => d.ip === host.ip)) next.push(host);

  return next;
};

export const useRouterHacker = (
  addLog: (ip: string, msg: string) => void,
  setDevices: React.Dispatch<React.SetStateAction<DeviceDTO[]>>,
  setActiveTarget: (ip: string | null) => void
) => {
  const [routerRisk, setRouterRisk] = useState<RouterAuditResult | null>(null);
  const [isGatewayAuditRunning, setIsGatewayAuditRunning] = useState(false);
  const [activeGatewayAuditIp, setActiveGatewayAuditIp] = useState<string | null>(null);

  const checkRouterSecurity = async (gatewayIp: string) => {
    setActiveTarget(gatewayIp);
    addLog(gatewayIp, `> INITIATING GATEWAY AUDIT: ${gatewayIp}...`);
    setIsGatewayAuditRunning(true);
    setActiveGatewayAuditIp(gatewayIp);

    try {
      // Fast-path: si ya tenemos credenciales guardadas, intentamos sincronizar sin repetir audit_router.
      // Si fallan (credenciales invalidas o router distinto con misma IP), caemos al brute (audit_router).
      const saved = await networkAdapter.getGatewayCredentials(gatewayIp);
      if (saved?.user && saved?.pass) {
        addLog(gatewayIp, `> FOUND SAVED CREDENTIALS. TRYING DIRECT LOGIN...`);
        try {
          const routerDevices = await auditAdapter.fetchRouterDevices(gatewayIp, saved.user, saved.pass);
          addLog(gatewayIp, `✨ SYNC COMPLETE (SAVED CREDS): ${routerDevices.length} nodes imported.`);

          // Señal de fallo tipica: credenciales "validas" pero extractor/DOM no devuelve nada.
          // En ese caso forzamos fallback al brute-force para revalidar y reintentar el sync.
          if (routerDevices.length === 0) {
            throw new Error("NETSENTINEL_EMPTY_ROUTER_SYNC");
          }

          setRouterRisk({
            vulnerable: false,
            message: "Credenciales guardadas validas. Sin brute-force.",
          });

          setDevices((prev) => {
            const merged = buildAuthoritativeRouterInventory(prev, routerDevices, gatewayIp);
            void networkAdapter.saveLatestSnapshot(merged);
            return merged;
          });

          return;
        } catch (err) {
          if (err instanceof Error && err.message === "NETSENTINEL_EMPTY_ROUTER_SYNC") {
            addLog(gatewayIp, `> WARNING: saved-creds sync devolvio 0 nodos. Fallback a brute-force.`);
          } else {
            addLog(gatewayIp, `> SAVED CREDENTIALS FAILED. FALLING BACK TO BRUTE...`);
          }
        }
      }

      addLog(gatewayIp, `> LOADING BRUTE-FORCE MODULE...`);
      const result = await auditAdapter.auditRouter(gatewayIp);
      setRouterRisk(result);

      if (result.vulnerable) {
        addLog(gatewayIp, `💀 CRITICAL: PASSWORD FOUND: ${result.credentials_found}`);
        
        if (result.credentials_found) {
          const [user, pass] = result.credentials_found.split(':');

          // Persistencia local (equipo del auditor): evita repetir audit_router en cada arranque.
          try {
            await networkAdapter.saveGatewayCredentials(gatewayIp, user, pass);
            addLog(gatewayIp, `> CREDENTIALS: guardadas localmente para ${gatewayIp}`);
          } catch {
            addLog(gatewayIp, `> WARNING: no se pudieron guardar credenciales localmente (keyring)`);
          }

          const routerDevices = await auditAdapter.fetchRouterDevices(gatewayIp, user, pass);
          
          addLog(gatewayIp, `✨ SYNC COMPLETE: ${routerDevices.length} nodes imported.`);

          if (routerDevices.length === 0) {
            addLog(gatewayIp, `> WARNING: sync devolvio 0 nodos. Manteniendo inventario actual (no autoritativo).`);
          } else {
            // Fusion de inventario priorizando intel valida ya conocida.
            setDevices(prev => {
              const merged = buildAuthoritativeRouterInventory(prev, routerDevices, gatewayIp);
              // Snapshot para que el arranque pinte el inventario completo.
              void networkAdapter.saveLatestSnapshot(merged);
              return merged;
            });
          }
        }
      } else {
        addLog(gatewayIp, `✅ RESULT: ${result.message}`);
      }
    } catch (error) {
      addLog(gatewayIp, `> ERROR: FATAL EXECUTION ERROR.`);
    } finally {
      setIsGatewayAuditRunning(false);
      setActiveGatewayAuditIp(null);
    }
  };

  return { routerRisk, setRouterRisk, checkRouterSecurity, isGatewayAuditRunning, activeGatewayAuditIp };
};
