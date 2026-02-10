import { useState } from 'react';
import { DeviceDTO, RouterAuditResult } from '../../../shared/dtos/NetworkDTOs';
import { auditAdapter } from '../../../adapters/auditAdapter';
import { networkAdapter } from '../../../adapters/networkAdapter';

export const useRouterHacker = (
  addLog: (ip: string, msg: string) => void,
  setDevices: React.Dispatch<React.SetStateAction<DeviceDTO[]>>,
  setActiveTarget: (ip: string | null) => void
) => {
  const [routerRisk, setRouterRisk] = useState<RouterAuditResult | null>(null);

  const isValidMac = (mac?: string) => {
    if (!mac) return false;
    const m = mac.trim().toUpperCase();
    if (m === 'ROUTER_AUTH' || m === 'UNKNOWN') return false;
    if (m === '00:00:00:00:00:00') return false;
    return /^([0-9A-F]{2}:){5}[0-9A-F]{2}$/.test(m);
  };

  const isBadVendor = (vendor?: string) => {
    if (!vendor) return true;
    const v = vendor.trim();
    if (!v) return true;
    if (v.toLowerCase() === 'unknown') return true;
    if (v.toLowerCase() === 'generic') return true;
    if (v.toLowerCase().includes('generic / unknown')) return true;
    if (/^(?:\\d{1,3}\\.){3}\\d{1,3}$/.test(v)) return true;
    return false;
  };

  const checkRouterSecurity = async (gatewayIp: string) => {
    setActiveTarget(gatewayIp);
    addLog(gatewayIp, `> INITIATING GATEWAY AUDIT: ${gatewayIp}...`);
    addLog(gatewayIp, `> LOADING BRUTE-FORCE MODULE...`);

    try {
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

          // Lògica de fusió (Merge)
          setDevices(prev => {
            const newMap = new Map(prev.map(d => [d.ip, d]));
            routerDevices.forEach(rd => {
              if (newMap.has(rd.ip)) {
                const existing = newMap.get(rd.ip)!;
                const nextMac = isValidMac(existing.mac) ? existing.mac : (isValidMac(rd.mac) ? rd.mac : existing.mac);
                const nextVendor = !isBadVendor(existing.vendor)
                  ? existing.vendor
                  : (!isBadVendor(rd.vendor) ? rd.vendor : existing.vendor);
                newMap.set(rd.ip, {
                  ...existing,
                  mac: nextMac,
                  vendor: nextVendor,
                  hostname: rd.hostname ?? existing.hostname,
                  name: (rd.name ?? existing.name),
                  signal_strength: rd.signal_strength,
                  signal_rate: rd.signal_rate,
                  wifi_band: rd.wifi_band
                });
              } else {
                // Si el router no aporta MAC valida, evitamos placeholders y dejamos Unknown.
                newMap.set(rd.ip, {
                  ...rd,
                  mac: isValidMac(rd.mac) ? rd.mac : '00:00:00:00:00:00',
                  vendor: !isBadVendor(rd.vendor) ? rd.vendor : 'Generic / Unknown Device',
                  hostname: rd.hostname && rd.hostname !== rd.ip ? rd.hostname : undefined,
                  name: rd.name,
                });
              }
            });
            const merged = Array.from(newMap.values());
            // Snapshot para que el arranque pinte el inventario completo.
            void networkAdapter.saveLatestSnapshot(merged);
            return merged;
          });
        }
      } else {
        addLog(gatewayIp, `✅ RESULT: ${result.message}`);
      }
    } catch (error) {
      addLog(gatewayIp, `> ERROR: FATAL EXECUTION ERROR.`);
    }
  };

  return { routerRisk, setRouterRisk, checkRouterSecurity };
};
