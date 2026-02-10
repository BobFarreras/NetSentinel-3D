import { useState, useEffect, useRef } from 'react';
import { DeviceDTO, HostIdentity } from '../../shared/dtos/NetworkDTOs';
import { networkAdapter } from '../../adapters/networkAdapter';
import { auditAdapter } from '../../adapters/auditAdapter';

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
  const bootAutoScanDone = useRef(false);
  const bootRouterSyncDone = useRef(false);

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

  const netmaskToPrefix = (netmask: string): number | null => {
    // Convierte "255.255.255.0" -> 24. Si el formato no es valido, devuelve null.
    const parts = netmask.split('.').map((p) => Number(p));
    if (parts.length !== 4 || parts.some((n) => !Number.isFinite(n) || n < 0 || n > 255)) return null;
    let bits = 0;
    for (const n of parts) {
      // Cuenta bits 1 por octeto (255=8, 254=7, 252=6, 248=5, 240=4, 224=3, 192=2, 128=1, 0=0)
      const map: Record<number, number> = { 255: 8, 254: 7, 252: 6, 248: 5, 240: 4, 224: 3, 192: 2, 128: 1, 0: 0 };
      if (map[n] === undefined) return null;
      bits += map[n];
    }
    return bits;
  };

  const deriveCidrFromIdentity = (id: HostIdentity | null): string => {
    if (!id?.ip) return '192.168.1.0/24';
    const prefix = netmaskToPrefix(id.netmask) ?? 24;
    const ipParts = id.ip.split('.').map((p) => Number(p));
    if (ipParts.length !== 4 || ipParts.some((n) => !Number.isFinite(n))) return '192.168.1.0/24';
    // Asumimos red /24 si el netmask es raro; si no, calculamos red con una aproximacion segura /24.
    if (prefix !== 24) {
      return `${ipParts[0]}.${ipParts[1]}.${ipParts[2]}.0/${prefix}`;
    }
    return `${ipParts[0]}.${ipParts[1]}.${ipParts[2]}.0/24`;
  };

  // Auto-scan al arrancar (educativo): mantiene inventario actualizado sin acciones manuales.
  useEffect(() => {
    if (!identity) return;
    if (bootAutoScanDone.current) return;

    bootAutoScanDone.current = true;
    const cidr = deriveCidrFromIdentity(identity);

    // Guardamos preferencia en localStorage (frontend). Si no existe, asumimos true.
    const pref = localStorage.getItem('netsentinel:autoScanOnStartup');
    const enabled = pref === null ? true : pref === 'true';
    if (!enabled) return;

    void startScan(cidr);
  }, [identity]);

  // Auto-sync de dispositivos del router si ya tenemos credenciales almacenadas localmente.
  useEffect(() => {
    if (!identity?.gatewayIp) return;
    if (bootRouterSyncDone.current) return;

    bootRouterSyncDone.current = true;

    const run = async () => {
      try {
        const creds = await networkAdapter.getGatewayCredentials(identity.gatewayIp);
        if (!creds) return;

        const routerDevices = await auditAdapter.fetchRouterDevices(identity.gatewayIp, creds.user, creds.pass);

        // Fusion defensiva: no pisar vendor/hostname validos.
        setDevices((prev) => {
          const map = new Map(prev.map((d) => [d.ip, d]));
          routerDevices.forEach((rd) => {
            const existing = map.get(rd.ip);
            if (!existing) {
              map.set(rd.ip, rd);
              return;
            }
            map.set(rd.ip, {
              ...existing,
              vendor: (rd.vendor && rd.vendor !== rd.ip) ? rd.vendor : existing.vendor,
              hostname: rd.hostname ?? existing.hostname,
              signal_strength: rd.signal_strength ?? existing.signal_strength,
              signal_rate: rd.signal_rate ?? existing.signal_rate,
              wifi_band: rd.wifi_band ?? existing.wifi_band
            });
          });
          const merged = Array.from(map.values());
          void networkAdapter.saveLatestSnapshot(merged);
          return merged;
        });
      } catch (e) {
        // Silencioso: si falla (sin keyring, router no accesible), no bloqueamos la app.
        console.warn('Auto router sync failed', e);
      }
    };

    void run();
  }, [identity?.gatewayIp]);

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
