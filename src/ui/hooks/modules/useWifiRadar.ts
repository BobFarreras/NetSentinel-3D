import { useCallback, useState } from "react";
import type { WifiNetworkDTO } from "../../../shared/dtos/NetworkDTOs";
import { wifiAdapter } from "../../../adapters/wifiAdapter";
import { addRadarErrorLog, addRadarNetworkLog, addRadarScanLog } from "./useRadarLogs";

export const useWifiRadar = () => {
  const [scanning, setScanning] = useState(false);
  const [networks, setNetworks] = useState<WifiNetworkDTO[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lastScanAt, setLastScanAt] = useState<number | null>(null);

  const scan = useCallback(async () => {
    setScanning(true);
    setError(null);
    try {
      const results = await wifiAdapter.scanAirwaves();
      setNetworks(results);
      setLastScanAt(Date.now());

      // Trazabilidad local: registrar resumen y detalle de redes en RADAR LOGS (ConsoleLogs).
      addRadarScanLog(results.length);
      results.forEach((n) => addRadarNetworkLog(n));
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      addRadarErrorLog(`scan_airwaves: ${msg}`);
    } finally {
      setScanning(false);
    }
  }, []);

  return { scanning, networks, error, lastScanAt, scan };
};
