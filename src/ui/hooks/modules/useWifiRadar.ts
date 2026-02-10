import { useCallback, useState } from "react";
import type { WifiNetworkDTO } from "../../../shared/dtos/NetworkDTOs";
import { wifiAdapter } from "../../../adapters/wifiAdapter";

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
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setScanning(false);
    }
  }, []);

  return { scanning, networks, error, lastScanAt, scan };
};

