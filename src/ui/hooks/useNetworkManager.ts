import { useState, useEffect } from 'react';
import { DeviceDTO } from '../../shared/dtos/NetworkDTOs';

// Importem els mòduls petits
import { useSocketLogs } from './modules/useSocketLogs';
import { useScanner } from './modules/useScanner';
import { usePortAuditor } from './modules/usePortAuditor';
import { useRouterHacker } from './modules/useRouterHacker';
import { HostIdentity } from '../../shared/dtos/NetworkDTOs';
import { networkAdapter } from '../../adapters/networkAdapter'; // 👈 Importem l'adaptador

export const useNetworkManager = () => {
  // 1. Logs (Base)
  const { deviceLogs, addLog, clearLogs, setActiveTarget } = useSocketLogs();

  // 2. Scanner (Core)
  const { devices, setDevices, history, intruders, scanning, startScan, loadSession } = useScanner();

  // 3. Auditor (Ports)
  const { auditing, auditResults, startAudit, clearResults } = usePortAuditor(addLog);

  // 4. Hacker (Router) - Necessita poder modificar els dispositius de l'escàner
  const { routerRisk, setRouterRisk, checkRouterSecurity } = useRouterHacker(addLog, setDevices, setActiveTarget);

  // 5. Estat local de UI (Selecció)
  const [selectedDevice, setSelectedDevice] = useState<DeviceDTO | null>(null);
  const [jammedDevices, setJammedDevices] = useState<string[]>([]);


  const [identity, setIdentity] = useState<HostIdentity | null>(null);
  
  // Helpers UI
  const selectDevice = (d: DeviceDTO | null) => {
    setSelectedDevice(d);
    if (d?.ip !== selectedDevice?.ip) clearResults();
  };

  const toggleJammer = (targetIp: string) => {
    const isJamming = jammedDevices.includes(targetIp);
    const action = isJamming ? "STOPPING" : "STARTING";
    addLog(targetIp, `> ${action} JAMMER ON ${targetIp}...`);
    setJammedDevices(prev => isJamming ? prev.filter(ip => ip !== targetIp) : [...prev, targetIp]);
  };

  const dismissRisk = () => setRouterRisk(null);
  const fetchHistory = async () => { }; // Ja ho fa el scanner al init, però pots exposar-ho si vols
  // 2. CÀRREGA INICIAL
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

    // Accions
    startScan, startAudit, checkRouterSecurity,
    selectDevice, loadSession, toggleJammer,
    dismissRisk, clearLogs: () => selectedDevice && clearLogs(selectedDevice.ip),
    fetchHistory,
  };
};