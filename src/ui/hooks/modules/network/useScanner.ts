// src/ui/hooks/modules/network/useScanner.ts
// Hook de escaneo: hidrata snapshot/historial, ejecuta scan_network, detecta intrusos y hace merge defensivo de inventario.

import { useState, useEffect, useRef } from 'react';
import { DeviceDTO, HostIdentity, ScanSession } from '../../../../shared/dtos/NetworkDTOs';
import { networkAdapter } from '../../../../adapters/networkAdapter';
import { detectIntruders } from '../../../../core/logic/intruderDetection';
import { uiLogger } from '../../../utils/logger';
import { mergeScanInventory } from '../shared/deviceMerge';

const NETWORK_FINGERPRINT_KEY = "netsentinel:networkFingerprint:v1";

const computeNetworkFingerprint = (identity: HostIdentity): string => {
  // Fingerprint agnostico (sin SSID): si cambia gateway/netmask/iface, asumimos red distinta.
  // No incluimos MAC para no "reiniciar" inventario al activar Ghost Mode.
  return `${identity.gatewayIp}|${identity.netmask}|${identity.interfaceName}`;
};

export const useScanner = (enableHydration: boolean = true) => {
  const [devices, setDevices] = useState<DeviceDTO[]>([]);
  const [history, setHistory] = useState<ScanSession[]>([]);
  const [intruders, setIntruders] = useState<string[]>([]);
  const [scanning, setScanning] = useState(false);
  const devicesRef = useRef<DeviceDTO[]>([]);
  const hasStartedScanRef = useRef(false);
  const lastNetworkFingerprintRef = useRef<string | null>(null);

  useEffect(() => {
    devicesRef.current = devices;
  }, [devices]);

  // Carga inicial (hydrate): snapshot rapido + historial (fallback).
  useEffect(() => {
    if (!enableHydration) return;
    let mounted = true;
    const load = async () => {
      try {
        // Antes de hidratar snapshot, validamos fingerprint de red para evitar pintar una red antigua.
        // Si no podemos obtener identidad (por ejemplo, en runtime no-Tauri), seguimos sin validar.
        let currentFingerprint: string | null = null;
        try {
          const id = await networkAdapter.getHostIdentity();
          currentFingerprint = computeNetworkFingerprint(id);
        } catch {
          currentFingerprint = null;
        }

        let storedFingerprint: string | null = null;
        try {
          storedFingerprint = localStorage.getItem(NETWORK_FINGERPRINT_KEY);
        } catch {
          storedFingerprint = null;
        }

        const fingerprintMatches =
          !currentFingerprint || !storedFingerprint || currentFingerprint === storedFingerprint;
        lastNetworkFingerprintRef.current = currentFingerprint ?? storedFingerprint;

        // 1) Snapshot rapido (si existe) para pintar UI al instante.
        if (fingerprintMatches) {
          const snap = await networkAdapter.loadLatestSnapshot();
          if (mounted && snap?.devices?.length) {
            setDevices(snap.devices);
          }
        } else {
          // Red distinta: preferimos empezar limpio y forzar scan real.
          if (mounted) setDevices([]);
        }

        // 2) Historial (fuente de verdad para comparacion/intrusos)
        const h = await networkAdapter.getHistory();
        if (mounted) {
          setHistory(h);
          // Fallback: solo hydratar desde historial si aun no hemos pintado nada y no hay un scan en curso/arrancado.
          // Evita el "salto" de N nodos -> menos nodos cuando el historial llega tarde.
          if (fingerprintMatches && !hasStartedScanRef.current && devicesRef.current.length === 0 && h.length > 0) {
            setDevices(h[0].devices);
          }
        }
      } catch (error) {
        uiLogger.error('Error en hidratacion de snapshot/historial', error);
      }
    };
    load();
    return () => { mounted = false; };
  }, [enableHydration]);

  const startScan = async (range: string = '192.168.1.0/24') => {
    hasStartedScanRef.current = true;
    setScanning(true);
    try {
      // Detectamos si hemos cambiado de red (gateway/netmask/iface) para evitar merge con inventario stale.
      let fingerprintChanged = false;
      try {
        const id = await networkAdapter.getHostIdentity();
        const next = computeNetworkFingerprint(id);
        const prev = lastNetworkFingerprintRef.current;
        fingerprintChanged = Boolean(prev && prev !== next);
        lastNetworkFingerprintRef.current = next;
        try {
          localStorage.setItem(NETWORK_FINGERPRINT_KEY, next);
        } catch {
          // ignore
        }
      } catch {
        fingerprintChanged = false;
      }

      const results = await networkAdapter.scanNetwork(range);

      // Intrusos: si la red ha cambiado, evitamos falsos positivos comparando contra history antigua.
      if (fingerprintChanged) {
        setIntruders([]);
      } else {
        const newIntruders = detectIntruders(results, history);
        setIntruders(newIntruders);
      }

      // Merge defensivo:
      // - Nunca degradar MAC/vendor si ya teniamos mejor intel previa.
      // - No eliminamos nodos previos si el scan ve menos (ARP puede ser parcial).
      //   El inventario autoritativo lo aporta el gateway audit via `fetch_router_devices`.
      const merged = fingerprintChanged ? results : mergeScanInventory(devicesRef.current, results);

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
