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
        const h = await networkAdapter.getHistory();
        if (mounted) {
          setHistory(h);
          if (h.length > 0) setDevices(h[0].devices);
        }
      } catch (e) { console.error(e); }
    };
    load();
    return () => { mounted = false; };
  }, []);

  const startScan = async () => {
    setScanning(true);
    try {
      const results = await networkAdapter.scanNetwork('192.168.1.0/24');
      
      const newIntruders = detectIntruders(results, history);
      setIntruders(newIntruders);
      setDevices(results);

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