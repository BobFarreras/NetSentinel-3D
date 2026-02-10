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
  const hasStartedScanRef = useRef(false);

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

  // Carga inicial (hydrate): snapshot rapido + historial (fallback).
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
          // Fallback: solo hydratar desde historial si aun no hemos pintado nada y no hay un scan en curso/arrancado.
          // Evita el "salto" de N nodos -> menos nodos cuando el historial llega tarde.
          if (!hasStartedScanRef.current && devicesRef.current.length === 0 && h.length > 0) {
            setDevices(h[0].devices);
          }
        }
      } catch (e) { console.error(e); }
    };
    load();
    return () => { mounted = false; };
  }, []);

  const startScan = async (range: string = '192.168.1.0/24') => {
    hasStartedScanRef.current = true;
    setScanning(true);
    try {
      const results = await networkAdapter.scanNetwork(range);
      
      const newIntruders = detectIntruders(results, history);
      setIntruders(newIntruders);

      // Merge defensivo:
      // - Nunca degradar MAC/vendor si ya teniamos mejor intel previa.
      // - No eliminar dispositivos ya conocidos (por ejemplo, descubiertos via audit_router).
      //   El scan por ARP/ICMP puede "ver menos" temporalmente y no debe reducir el inventario.
      const prev = devicesRef.current;
      const prevByIp = new Map(prev.map((d) => [d.ip, d]));
      const resultsByIp = new Map(results.map((d) => [d.ip, d]));

      const mergeDevice = (scanDevice: DeviceDTO, old: DeviceDTO | undefined) => {
        if (!old) return scanDevice;
        const nextMac = isValidMac(scanDevice.mac) ? scanDevice.mac : (isValidMac(old.mac) ? old.mac : scanDevice.mac);
        const nextVendor = !isBadVendor(scanDevice.vendor) ? scanDevice.vendor : (!isBadVendor(old.vendor) ? old.vendor : scanDevice.vendor);
        const nextHostname = scanDevice.hostname ?? old.hostname;
        const nextName = scanDevice.name ?? old.name;
        return { ...scanDevice, mac: nextMac, vendor: nextVendor, hostname: nextHostname, name: nextName };
      };

      // 1) Mantener orden previo y actualizar los que salgan en el scan.
      const merged: DeviceDTO[] = prev.map((old) => {
        const scanDevice = resultsByIp.get(old.ip);
        if (!scanDevice) return old;
        return mergeDevice(scanDevice, old);
      });

      // 2) Añadir nuevos dispositivos descubiertos por el scan (al final).
      for (const scanDevice of results) {
        if (!prevByIp.has(scanDevice.ip)) merged.push(scanDevice);
      }

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
