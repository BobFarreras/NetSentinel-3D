import { useState, useEffect } from 'react';
import { DeviceDTO, HostIdentity } from '../../shared/dtos/NetworkDTOs';
import { networkAdapter } from '../../adapters/networkAdapter';

// Importem els mòduls petits (Ara inclòs el Jammer)
import { useSocketLogs } from './modules/useSocketLogs';
import { useScanner } from './modules/useScanner';
import { usePortAuditor } from './modules/usePortAuditor';
import { useRouterHacker } from './modules/useRouterHacker';
import { useJamming } from './modules/useJamming'; // 👈 IMPORT NOU

export const useNetworkManager = () => {
  // 1. Logs (Base)
  const { deviceLogs, addLog, clearLogs, setActiveTarget } = useSocketLogs();

  // 2. Scanner (Core)
  const { devices, setDevices, history, intruders, scanning, startScan, loadSession } = useScanner();

  // 3. Auditor (Ports)
  const { auditing, auditResults, startAudit, clearResults } = usePortAuditor(addLog);

  // 4. Hacker (Router)
  const { routerRisk, setRouterRisk, checkRouterSecurity } = useRouterHacker(addLog, setDevices, setActiveTarget);

  // 5. Jammer (Active Countermeasures) 👈 NOVA RESPONSABILITAT SEPARADA
  // Li passem 'devices' perquè pugui trobar el Gateway, i 'addLog' per escriure a la consola
  const { jammedDevices, toggleJammer } = useJamming(devices, addLog);

  // 6. Estat local de UI (Selecció i Identitat)
  const [selectedDevice, setSelectedDevice] = useState<DeviceDTO | null>(null);
  const [identity, setIdentity] = useState<HostIdentity | null>(null);

  // Helpers UI
  const selectDevice = (d: DeviceDTO | null) => {
    setSelectedDevice(d);
    if (d?.ip !== selectedDevice?.ip) clearResults();
  };

  const dismissRisk = () => setRouterRisk(null);
  
  // Càrrega inicial d'identitat
  useEffect(() => {
    let mounted = true;
    const loadIdentity = async () => {
      try {
        const id = await networkAdapter.getHostIdentity();
        if (mounted) setIdentity(id);
      } catch (e) {
        console.error("Identity error:", e);
      }
    };
    loadIdentity();
    return () => { mounted = false; };
  }, []);

  return {
    // Dades
    devices, selectedDevice, history, intruders,
    auditResults, routerRisk, jammedDevices,
    consoleLogs: selectedDevice ? (deviceLogs[selectedDevice.ip] || []) : [],
    identity,

    // Estats
    scanning, auditing,

    // Accions (Delegades als hooks corresponents)
    startScan, 
    startAudit, 
    checkRouterSecurity,
    selectDevice, 
    loadSession, 
    toggleJammer, // 👈 Ara ve del useJamming
    dismissRisk, 
    clearLogs: () => selectedDevice && clearLogs(selectedDevice.ip),
  };
};