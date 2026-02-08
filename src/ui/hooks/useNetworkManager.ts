import { useState, useEffect, useRef } from 'react';
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
  // --- ESTATS ---
  const [devices, setDevices] = useState<DeviceDTO[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<DeviceDTO | null>(null);
  const [scanning, setScanning] = useState(false);
  const [auditing, setAuditing] = useState(false);
  const [auditResults, setAuditResults] = useState<OpenPortDTO[]>([]);

  // 🛑 CANVI CLAU 1: Ara els logs són un objecte { "192.168.1.1": ["log1", "log2"], ... }
  const [deviceLogs, setDeviceLogs] = useState<Record<string, string[]>>({});

  // Ref per saber qui està sent atacat actualment (per als events que venen de Rust)
  const activeTargetIp = useRef<string | null>(null);

  const [jammedDevices, setJammedDevices] = useState<string[]>([]);
  const [history, setHistory] = useState<ScanSession[]>([]);
  const [routerRisk, setRouterRisk] = useState<RouterAuditResult | null>(null);

  // --- HELPER PER AFEGIR LOGS A UNA IP CONCRETA ---
  const addLog = (ip: string, message: string) => {
    setDeviceLogs(prev => {
      const currentLogs = prev[ip] || [];
      return {
        ...prev,
        [ip]: [...currentLogs, message]
      };
    });
  };

  // 👂 EL CABLE MÀGIC: Escolta Rust i ho assigna a la IP correcta
  useEffect(() => {
    const unlistenPromise = listen<string>('audit-log', (event) => {
      const target = activeTargetIp.current;
      // Si sabem qui estem atacant, li assignem el log a ell
      if (target) {
        addLog(target, event.payload);
      } else {
        // Si és un log global o d'escaneig general, potser no fem res o ho guardem a "GLOBAL"
        console.log("Global Log:", event.payload);
      }
    });

    return () => { unlistenPromise.then((unlisten) => unlisten()); };
  }, []);

  // 1. SCAN (Global)
  const startScan = async () => {
    setScanning(true);
    // Els logs d'escaneig general no van a cap dispositiu específic,
    // però podríem netejar errors globals si volguéssim.
    try {
      const results = await invoke<DeviceDTO[]>('scan_network', { range: '192.168.1.0/24' });
      setDevices(results);
      await invoke('save_scan', { devices: results });
    } catch (error) {
      console.error("❌ ERROR SCAN:", error);
    } finally {
      setScanning(false);
    }
  };

  // 2. AUTO-LOAD HISTORIAL
  useEffect(() => {
    const initMemory = async () => {
      try {
        const savedSessions = await invoke<ScanSession[]>('get_history');
        if (savedSessions.length > 0) {
          setHistory(savedSessions);
          const lastSession = savedSessions[0];
          setDevices(lastSession.devices);
        }
      } catch (e) { console.error("Failed to load history:", e); }
    };
    initMemory();
  }, []);

  // 3. AUDIT TARGET (PORTS)
  const startAudit = async (ip: string) => {
    if (auditing) return;
    setAuditing(true);
    setAuditResults([]);

    // Netejem logs vells D'AQUESTA IP i comencem
    setDeviceLogs(prev => ({ ...prev, [ip]: [`> TARGET_IP: ${ip}`, `> EXEC: FULL_TCP_CONNECT_SCAN...`] }));

    try {
      const report = await invoke<any>('audit_target', { ip });
      addLog(ip, `> ANALYSIS COMPLETE.`);
      addLog(ip, `> PORTS FOUND: ${report.openPorts.length}`);
      setAuditResults(report.openPorts || []);
    } catch (e) {
      addLog(ip, `> ERROR: CONNECTION FAILURE`);
    } finally {
      setAuditing(false);
    }
  };

  // 4. JAMMER
  const toggleJammer = async (targetIp: string, gatewayIp: string) => {
    const isJamming = jammedDevices.includes(targetIp);
    const action = isJamming ? "STOPPING" : "STARTING";

    addLog(targetIp, `> ${action} JAMMER ON ${targetIp}...`);

    setJammedDevices(prev => isJamming ? prev.filter(ip => ip !== targetIp) : [...prev, targetIp]);
  };

  // 5. ROUTER AUDIT (EL HACKEIG)
  const checkRouterSecurity = async (gatewayIp: string) => {
    activeTargetIp.current = gatewayIp;

    // Inicialitzem logs
    setDeviceLogs(prev => ({
      ...prev,
      [gatewayIp]: [`> INITIATING GATEWAY AUDIT: ${gatewayIp}...`, `> LOADING BRUTE-FORCE MODULE...`]
    }));

    try {
      const result = await invoke<RouterAuditResult>('audit_router', { gatewayIp });

      if (result.vulnerable) {

        // 🛑 HE COMENTAT AIXÒ PERQUÈ NO SURTI EL MODAL
        // setRouterRisk(result); 

        addLog(gatewayIp, `💀 CRITICAL: PASSWORD FOUND: ${result.credentials_found}`);

        if (result.credentials_found) {
          const [user, pass] = result.credentials_found.split(':');

          // Ara veuràs logs de Rust mentre això s'executa
          // Crida corregida amb els noms exactes que espera Rust (snake_case)

          const routerDevices = await invoke<DeviceDTO[]>('fetch_router_devices', {
            gatewayIp: gatewayIp, // 👈 ABANS ERA gateway_ip, ARA gatewayIp
            user: user,
            pass: pass
          });

          addLog(gatewayIp, `✨ SYNC COMPLETE: Database updated with ${routerDevices.length} nodes.`);

          // FUSIONEM INTEL·LIGENTMENT
          setDevices(prevDevices => {
            const newMap = new Map(prevDevices.map(d => [d.ip, d]));

            routerDevices.forEach(rd => {
              if (newMap.has(rd.ip)) {
                // CAS 1: El dispositiu JA existia (L'haviem vist amb l'ARP)
                const existing = newMap.get(rd.ip)!;

                newMap.set(rd.ip, {
                  ...existing, // Mantenim la MAC real i si és "Gateway" o "Me"

                  // Només actualitzem el nom si el del router és millor (no és la IP)
                  vendor: (rd.vendor && rd.vendor !== rd.ip) ? rd.vendor : existing.vendor,
                  hostname: rd.hostname,

                  // Afegim les dades EXCLUSIVES del router
                  signal_strength: rd.signal_strength,
                  signal_rate: rd.signal_rate,
                  wifi_band: rd.wifi_band
                });
              } else {
                // CAS 2: Dispositiu nou (L'ARP no l'havia vist, potser estava dormint)
                // Aquí no tenim MAC real, així que es quedarà amb ROUTER_AUTH fins al proper scan ARP
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
      console.error("❌ ERROR REAL:", error); // Mira la consola F12 també

      // 👇 AFEGEIX AIXÒ PER VEURE L'ERROR EN PANTALLA
      addLog(gatewayIp, `> ERROR DEBUG: ${typeof error === 'string' ? error : JSON.stringify(error)}`);

      addLog(gatewayIp, `> ERROR: FATAL EXECUTION ERROR.`);
    }
  };

  // Helpers UI
  const selectDevice = (d: DeviceDTO | null) => {
    setSelectedDevice(d);

    // Si canviem de dispositiu, netegem la vista de ports (resultats gràfics),
    // però ELS LOGS ES QUEDEN GUARDATS DINS DE 'deviceLogs'
    if (d?.ip !== selectedDevice?.ip) {
      setAuditResults([]);
    }
  };

  const loadSession = (d: DeviceDTO[]) => setDevices(d);
  const fetchHistory = async () => { const h = await invoke<ScanSession[]>('get_history'); setHistory(h); };
  const dismissRisk = () => setRouterRisk(null);

  // funció extra per si vols netejar manualment
  const clearLogs = () => {
    if (selectedDevice) {
      setDeviceLogs(prev => ({ ...prev, [selectedDevice.ip]: [] }));
    }
  };

  // 🛑 MÀGIA FINAL: Calculem quins logs s'han de veure ARA MATEIX
  // Si hi ha un dispositiu seleccionat, mostrem els seus. Si no, buit.
  const consoleLogs = selectedDevice ? (deviceLogs[selectedDevice.ip] || []) : [];

  return {
    devices, selectedDevice, scanning, auditing, auditResults,
    consoleLogs, // Ara això ja conté només els logs de la IP seleccionada
    jammedDevices,
    startScan, startAudit, selectDevice, loadSession, toggleJammer, fetchHistory, history, setHistory,
    checkRouterSecurity, routerRisk, dismissRisk, clearLogs
  };
};