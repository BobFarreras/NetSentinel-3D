import { useState, useEffect } from 'react';
import { DeviceDTO, ScanSession } from '../../../shared/dtos/NetworkDTOs';
import { networkAdapter } from '../../../adapters/networkAdapter';
import { detectIntruders } from '../../../core/logic/intruderDetection';

export const useScanner = () => {
  const [devices, setDevices] = useState<DeviceDTO[]>([]);
  const [history, setHistory] = useState<ScanSession[]>([]);
  const [intruders, setIntruders] = useState<string[]>([]);
  const [scanning, setScanning] = useState(false);

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
      setDevices(results);

      // Persistimos snapshot para arranque rapido.
      await networkAdapter.saveLatestSnapshot(results);
      await networkAdapter.saveScan(results);
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
