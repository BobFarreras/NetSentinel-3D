import { useState, useEffect, useRef } from 'react';
import { DeviceDTO, ScanSession } from '../../../../shared/dtos/NetworkDTOs';
import { networkAdapter } from '../../../../adapters/networkAdapter';
import { detectIntruders } from '../../../../core/logic/intruderDetection';
import { uiLogger } from '../../../utils/logger';
import { mergeScanInventory } from '../shared/deviceMerge';

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
      } catch (error) {
        uiLogger.error('Error en hidratacion de snapshot/historial', error);
      }
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
      const merged = mergeScanInventory(devicesRef.current, results);

      setDevices(merged);

      // Persistimos snapshot para arranque rapido.
      // Guardamos el inventario ya "mergeado" para que el arranque no se degrade.
      await networkAdapter.saveLatestSnapshot(merged);
      await networkAdapter.saveScan(merged);
      setHistory(await networkAdapter.getHistory());
    } catch (error) {
      uiLogger.error('Error durante scan_network', error);
    } finally {
      setScanning(false);
    }
  };

  const loadSession = (d: DeviceDTO[]) => setDevices(d);

  return { devices, setDevices, history, intruders, scanning, startScan, loadSession };
};
