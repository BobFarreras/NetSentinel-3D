import { useState, useEffect } from 'react';
import { invoke } from "@tauri-apps/api/core";
import { listen } from '@tauri-apps/api/event';
import { DeviceDTO, OpenPortDTO, RouterAuditResult } from '../../shared/dtos/NetworkDTOs';

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
  const [history, setHistory] = useState<ScanSession[]>([]);
  const [routerRisk, setRouterRisk] = useState<RouterAuditResult | null>(null);

  // 👂 EL CABLE MÀGIC: Escolta els crits de Rust
  useEffect(() => {
    const unlistenPromise = listen<string>('audit-log', (event) => {
      setConsoleLogs((prev) => [...prev, event.payload]);
    });
    return () => { unlistenPromise.then((unlisten) => unlisten()); };
  }, []);

  // 1. SCAN
  const startScan = async () => {
    setScanning(true);
    setConsoleLogs([]); 
    try {
      setConsoleLogs(["> INIT: ARP SCANNING SUBNET..."]);
      const results = await invoke<DeviceDTO[]>('scan_network', { range: '192.168.1.0/24' });
      setDevices(results);
      setConsoleLogs(prev => [...prev, `> SCAN COMPLETE. DEVICES FOUND: ${results.length}`]);
      
      console.log("💾 Persisting scan results...");
      await invoke('save_scan', { devices: results });
    } catch (error) {
      console.error("❌ ERROR SCAN:", error);
      setConsoleLogs(prev => [...prev, `> ERROR: SCAN FAILED`]);
    } finally {
      setScanning(false);
    }
  };

  // 2. AUTO-LOAD HISTORIAL (CORREGIT: ARA CARREGA AUTOMÀTICAMENT)
  useEffect(() => {
    const initMemory = async () => {
      try {
        const savedSessions = await invoke<ScanSession[]>('get_history');
        if (savedSessions.length > 0) {
          setHistory(savedSessions);
          
          // 👇 HE DESCOMENTAT AIXÒ PERQUÈ CARREGUI LA XARXA AL PRINCIPI
          const lastSession = savedSessions[0];
          setDevices(lastSession.devices);
          // -----------------------------------------------------------
        }
      } catch (e) { console.error("Failed to load history:", e); }
    };
    initMemory();
  }, []);

  // 3. AUDIT TARGET
  const startAudit = async (ip: string) => {
    if (auditing) return;
    setAuditing(true);
    setAuditResults([]);
    setConsoleLogs([`> TARGET_IP: ${ip}`, `> EXEC: FULL_TCP_CONNECT_SCAN...`]);
    try {
      const report = await invoke<any>('audit_target', { ip });
      setConsoleLogs(prev => [...prev, `> ANALYSIS COMPLETE.`, `> PORTS FOUND: ${report.openPorts.length}`]);
      setAuditResults(report.openPorts || []);
    } catch (e) {
      setConsoleLogs(prev => [...prev, `> ERROR: CONNECTION FAILURE`]);
    } finally {
      setAuditing(false);
    }
  };

  // 4. JAMMER
  const toggleJammer = async (targetIp: string, gatewayIp: string) => {
    const isJamming = jammedDevices.includes(targetIp);
    const action = isJamming ? "STOPPING" : "STARTING";
    setConsoleLogs(prev => [...prev, `> ${action} JAMMER ON ${targetIp}...`]);
    setJammedDevices(prev => isJamming ? prev.filter(ip => ip !== targetIp) : [...prev, targetIp]);
  };

  // 5. ROUTER AUDIT
  const checkRouterSecurity = async (gatewayIp: string) => {
    setConsoleLogs(prev => [...prev, `> INITIATING GATEWAY AUDIT: ${gatewayIp}...`, `> LOADING BRUTE-FORCE MODULE...`]);
    try {
      const result = await invoke<RouterAuditResult>('audit_router', { gatewayIp });
      if (result.vulnerable) {
        setRouterRisk(result);
        setConsoleLogs(prev => [...prev, `💀 CRITICAL: ${result.message}`]);
      } else {
        setConsoleLogs(prev => [...prev, `✅ RESULT: ${result.message}`]);
      }
    } catch (error) {
      setConsoleLogs(prev => [...prev, `> ERROR: FATAL EXECUTION ERROR.`]);
    }
  };

  const selectDevice = (d: DeviceDTO | null) => {
    setSelectedDevice(d);
    setAuditResults([]);
    setConsoleLogs([]);
  };
  const loadSession = (d: DeviceDTO[]) => setDevices(d);
  const fetchHistory = async () => { const h = await invoke<ScanSession[]>('get_history'); setHistory(h); };
  const dismissRisk = () => setRouterRisk(null);

  return {
    devices, selectedDevice, scanning, auditing, auditResults, consoleLogs, jammedDevices,
    startScan, startAudit, selectDevice, loadSession, toggleJammer, fetchHistory, history, setHistory, 
    checkRouterSecurity, routerRisk, dismissRisk 
  };
};