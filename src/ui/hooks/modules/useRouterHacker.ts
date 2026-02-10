import { useState } from 'react';
import { DeviceDTO, RouterAuditResult } from '../../../shared/dtos/NetworkDTOs';
import { auditAdapter } from '../../../adapters/auditAdapter';

export const useRouterHacker = (
  addLog: (ip: string, msg: string) => void,
  setDevices: React.Dispatch<React.SetStateAction<DeviceDTO[]>>,
  setActiveTarget: (ip: string | null) => void
) => {
  const [routerRisk, setRouterRisk] = useState<RouterAuditResult | null>(null);

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
          const routerDevices = await auditAdapter.fetchRouterDevices(gatewayIp, user, pass);
          
          addLog(gatewayIp, `✨ SYNC COMPLETE: ${routerDevices.length} nodes imported.`);

          // Lògica de fusió (Merge)
          setDevices(prev => {
            const newMap = new Map(prev.map(d => [d.ip, d]));
            routerDevices.forEach(rd => {
              if (newMap.has(rd.ip)) {
                const existing = newMap.get(rd.ip)!;
                newMap.set(rd.ip, {
                  ...existing,
                  vendor: (rd.vendor && rd.vendor !== rd.ip) ? rd.vendor : existing.vendor,
                  hostname: rd.hostname,
                  signal_strength: rd.signal_strength,
                  signal_rate: rd.signal_rate,
                  wifi_band: rd.wifi_band
                });
              } else {
                newMap.set(rd.ip, rd);
              }
            });
            return Array.from(newMap.values());
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
