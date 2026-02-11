import { useState } from 'react';
import { DeviceDTO } from '../../shared/dtos/NetworkDTOs';

// Importamos los modulos de negocio de UI.
import { useSocketLogs } from './modules/useSocketLogs';
import { useScanner } from './modules/useScanner';
import { usePortAuditor } from './modules/usePortAuditor';
import { useRouterHacker } from './modules/useRouterHacker';
import { useJamming } from './modules/useJamming';
import { useBootstrapNetwork } from './modules/useBootstrapNetwork';

export const useNetworkManager = () => {
  // 1. Logs (Base)
  const { deviceLogs, systemLogs, addLog, clearLogs, clearSystemLogs, setActiveTarget } = useSocketLogs();

  // 2. Scanner (Core)
  const { devices, setDevices, history, intruders, scanning, startScan, loadSession } = useScanner();

  // 3. Auditor (Ports)
  const { auditing, auditResults, startAudit, clearResults } = usePortAuditor(addLog);

  // 4. Hacker (Router)
  const { routerRisk, setRouterRisk, checkRouterSecurity } = useRouterHacker(addLog, setDevices, setActiveTarget);

  // 5. Jammer (Active Countermeasures)
  const { jammedDevices, toggleJammer } = useJamming(devices, addLog);

  // 6. Bootstrap (identidad + autoscan + autosync de gateway)
  const { identity, deriveCidr } = useBootstrapNetwork({ startScan, setDevices });

  // 7. Estado local de UI (seleccion)
  const [selectedDevice, setSelectedDevice] = useState<DeviceDTO | null>(null);

  // Helpers UI
  const selectDevice = (d: DeviceDTO | null) => {
    setSelectedDevice(d);
    if (d?.ip !== selectedDevice?.ip) clearResults();
  };

  const dismissRisk = () => setRouterRisk(null);

  return {
    // Datos
    devices, selectedDevice, history, intruders,
    auditResults, routerRisk, jammedDevices,
    consoleLogs: selectedDevice ? (deviceLogs[selectedDevice.ip] || []) : [],
    systemLogs,
    identity,

    // Estados
    scanning, auditing,

    // Acciones (delegadas a hooks especializados)
    // Importante: TopBar pasa el evento si se asigna directamente como handler.
    // Exponemos un wrapper sin argumentos para evitar regresiones.
    startScan: (range?: string) => startScan(range ?? deriveCidr()),
    startAudit, 
    checkRouterSecurity,
    selectDevice, 
    loadSession, 
    toggleJammer,
    dismissRisk, 
    clearLogs: () => selectedDevice && clearLogs(selectedDevice.ip),
    clearSystemLogs,
  };
};
