import { useCallback, useState } from "react";
import type { WifiNetworkDTO } from "../../../shared/dtos/NetworkDTOs";
import { wifiAdapter } from "../../../adapters/wifiAdapter";
import { addRadarLog } from "./useRadarLogs";

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
      addRadarLog(`scan_airwaves: ${results.length} redes detectadas`);
      results.forEach((n) => {
        const ch = typeof n.channel === "number" ? `CH ${n.channel}` : "CH ?";
        const conn = n.isConnected ? "CONNECTED" : "NEARBY";
        addRadarLog(
          `[${conn}] [${(n.riskLevel || "UNKNOWN").toUpperCase()}] ${n.ssid} | ${n.bssid} | ${n.vendor} | ${n.securityType} | ${ch} | RSSI ${n.signalLevel} dBm`
        );
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      addRadarLog(`ERROR scan_airwaves: ${msg}`);
    } finally {
      setScanning(false);
    }
  }, []);

  return { scanning, networks, error, lastScanAt, scan };
};
