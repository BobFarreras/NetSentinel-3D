import { useState, useEffect, useRef } from 'react';
import { DeviceDTO, ScanSession } from '../../../shared/dtos/NetworkDTOs';
import { networkAdapter } from '../../../adapters/networkAdapter';
import { detectIntruders } from '../../../core/logic/intruderDetection';

export const useScanner = () => {
  const [devices, setDevices] = useState<DeviceDTO[]>([]);
  const [history, setHistory] = useState<ScanSession[]>([]);
  const [intruders, setIntruders] = useState<string[]>([]);
  const [scanning, setScanning] = useState(false);
  const devicesRef = useRef<DeviceDTO[]>([]);

  useEffect(() => {
    devicesRef.current = devices;
  }, [devices]);

  const isValidMac = (mac?: string) => {
    if (!mac) return false;
    const m = mac.trim().toUpperCase();
    if (m === '00:00:00:00:00:00') return false;
    if (m === 'ROUTER_AUTH' || m === 'UNKNOWN') return false;
    return /^([0-9A-F]{2}:){5}[0-9A-F]{2}$/.test(m);
  };

  const isBadVendor = (vendor?: string) => {
    if (!vendor) return true;
    const v = vendor.trim();
    if (!v) return true;
    if (v.toLowerCase() === 'unknown') return true;
    if (v.toLowerCase().includes('generic / unknown')) return true;
    // Evitar casos donde "vendor" termina siendo una IP.
    if (/^(?:\\d{1,3}\\.){3}\\d{1,3}$/.test(v)) return true;
    return false;
  };

  // Càrrega inicial
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        // 1) Snapshot rapido (si existe) para pintar UI al instante.
        const snap = await networkAdapter.loadLatestSnapshot();
        if (mounted && snap?.devices?.length) {
          setDevices(snap.devices);
        }

        // 2) Historial (fuente de verdad para comparacion/intrusos)
        const h = await networkAdapter.getHistory();
        if (mounted) {
          setHistory(h);
          // Si no hay snapshot, usamos la ultima sesion historica como fallback.
          if ((!snap || !snap.devices?.length) && h.length > 0) setDevices(h[0].devices);
        }
      } catch (e) { console.error(e); }
    };
    load();
    return () => { mounted = false; };
  }, []);

  const startScan = async (range: string = '192.168.1.0/24') => {
    setScanning(true);
    try {
      const results = await networkAdapter.scanNetwork(range);
      
      const newIntruders = detectIntruders(results, history);
      setIntruders(newIntruders);

      // Merge defensivo: nunca degradar MAC/vendor si ya teniamos mejor intel previa.
      const prevByIp = new Map(devicesRef.current.map((d) => [d.ip, d]));
      const merged = results.map((d) => {
        const old = prevByIp.get(d.ip);
        if (!old) return d;
        const nextMac = isValidMac(d.mac) ? d.mac : (isValidMac(old.mac) ? old.mac : d.mac);
        const nextVendor = !isBadVendor(d.vendor) ? d.vendor : (!isBadVendor(old.vendor) ? old.vendor : d.vendor);
        const nextHostname = d.hostname ?? old.hostname;
        const nextName = d.name ?? old.name;
        return { ...d, mac: nextMac, vendor: nextVendor, hostname: nextHostname, name: nextName };
      });
      setDevices(merged);

      // Persistimos snapshot para arranque rapido.
      // Guardamos el inventario ya "mergeado" para que el arranque no se degrade.
      await networkAdapter.saveLatestSnapshot(merged);
      await networkAdapter.saveScan(merged);
      setHistory(await networkAdapter.getHistory());
    } catch (e) {
      console.error("Scan error", e);
    } finally {
      setScanning(false);
    }
  };

  const loadSession = (d: DeviceDTO[]) => setDevices(d);

  return { devices, setDevices, history, intruders, scanning, startScan, loadSession };
};
