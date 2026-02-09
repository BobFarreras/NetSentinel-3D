import { useState } from 'react';
import { DeviceDTO } from '../../shared/dtos/NetworkDTOs';

// Importem els mòduls petits
import { useSocketLogs } from './modules/useSocketLogs';
import { useScanner } from './modules/useScanner';
import { usePortAuditor } from './modules/usePortAuditor';
import { useRouterHacker } from './modules/useRouterHacker';

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
  const fetchHistory = async () => {}; // Ja ho fa el scanner al init, però pots exposar-ho si vols

  return {
    // Dades
    devices, selectedDevice, history, intruders,
    auditResults, routerRisk, jammedDevices,
    consoleLogs: selectedDevice ? (deviceLogs[selectedDevice.ip] || []) : [],
    
    // Estats
    scanning, auditing,
    
    // Accions
    startScan, startAudit, checkRouterSecurity,
    selectDevice, loadSession, toggleJammer,
    dismissRisk, clearLogs: () => selectedDevice && clearLogs(selectedDevice.ip),
    fetchHistory
  };
};