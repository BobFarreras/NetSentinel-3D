import { useState, useEffect } from 'react';
import { invoke } from "@tauri-apps/api/core";
import { DeviceDTO, OpenPortDTO } from '../../shared/dtos/NetworkDTOs';

// Definició de la interfície de Sessió (per TypeScript)
interface ScanSession {
  id: string;
  timestamp: number;
  devices: DeviceDTO[];
  label: string;
}

export const useNetworkManager = () => {
  const [devices, setDevices] = useState<DeviceDTO[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<DeviceDTO | null>(null);
  const [scanning, setScanning] = useState(false);
  const [auditing, setAuditing] = useState(false);
  const [auditResults, setAuditResults] = useState<OpenPortDTO[]>([]);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
  const [jammedDevices, setJammedDevices] = useState<string[]>([]);
  const [history, setHistory] = useState<ScanSession[]>([]); // Nou estat local

  // 2. SCAN (Modificat per guardar)
  const startScan = async () => {
    setScanning(true);
    setConsoleLogs([]);
    try {
      const results = await invoke<DeviceDTO[]>('scan_network', { range: '192.168.1.0/24' });
      setDevices(results);

      // 👇 GUARDAR AUTOMÀTICAMENT
      console.log("💾 Persisting scan results...");
      await invoke('save_scan', { devices: results });

    } catch (error) {
      console.error("❌ ERROR SCAN:", error);
    } finally {
      setScanning(false);
    }
  };

  // 1. AUTO-LOAD (Recuperar memòria en obrir l'app)
  // 1. AUTO-LOAD (Recuperar memòria en obrir l'app)
  useEffect(() => {
    const initMemory = async () => {
      try {
        console.log("🧠 TAURI: Loading History...");
        const savedSessions = await invoke<ScanSession[]>('get_history');

        if (savedSessions.length > 0) {
          console.log(`📂 Loaded ${savedSessions.length} sessions.`);
          setHistory(savedSessions); // Guardem la llista per al panell

          // 👇 AFEGIT: Agafem la sessió més recent (la 0) i la pintem al mapa
          const lastSession = savedSessions[0];
          console.log(`⏪ AUTO-LOAD: Restoring session from ${new Date(lastSession.timestamp).toLocaleTimeString()}`);
          setDevices(lastSession.devices);
        }
      } catch (e) {
        console.error("Failed to load history:", e);
      }
    };
    initMemory();
  }, []);
  // 2. AUDIT
  const startAudit = async (ip: string) => {
    if (auditing) return;

    // ✨ RESET VISUAL: Netejem logs vells i resultats vells
    setAuditing(true);
    setAuditResults([]);
    setConsoleLogs([
      `> INITIALIZING TARGET PROTOCOL...`,
      `> TARGET_IP: ${ip}`,
      `> LOADING VULNERABILITY DB...`,
      `> EXEC: FULL_TCP_CONNECT_SCAN`,
      `> ...`
    ]);

    try {
      const report = await invoke<any>('audit_target', { ip });

      // Simulem una mica de "streaming" visual al final
      setConsoleLogs(prev => [...prev, `> ANALYSIS COMPLETE.`]);
      setConsoleLogs(prev => [...prev, `> PORTS FOUND: ${report.openPorts.length}`]);

      if (report.riskLevel === 'HIGH' || report.riskLevel === 'CRITICAL') {
        setConsoleLogs(prev => [...prev, `> ⚠️ CRITICAL VULNERABILITIES DETECTED`]);
      }

      setAuditResults(report.openPorts || []);
    } catch (e) {
      console.error(e);
      setConsoleLogs(prev => [...prev, `> ERROR: CONNECTION FAILURE`]);
    } finally {
      setAuditing(false);
    }
  };

  // 3. JAMMER
  const toggleJammer = async (targetIp: string, gatewayIp: string) => {
    // 👇 AFEGEIX AQUESTA LÍNIA PER UTILITZAR LA VARIABLE I CALLAR L'ERROR
    console.log(`💀 KILL-SWITCH: Targeting ${targetIp} via Gateway ${gatewayIp}`);

    setJammedDevices(prev => prev.includes(targetIp)
      ? prev.filter(ip => ip !== targetIp)
      : [...prev, targetIp]
    );
  };

  const selectDevice = (d: DeviceDTO | null) => {
    setSelectedDevice(d);
    setAuditResults([]); // Netegem resultats
    setConsoleLogs([]);  // Netegem terminal
  };

  const loadSession = (d: DeviceDTO[]) => setDevices(d);

  // Funció auxiliar per carregar historial manualment (si la necessites pel panell)
  const fetchHistory = async () => {
    return await invoke<ScanSession[]>('get_history');
  };
  return {
    devices, selectedDevice, scanning, auditing, auditResults, consoleLogs, jammedDevices,
    startScan, startAudit, selectDevice, loadSession, toggleJammer, fetchHistory, history, setHistory
  };
};