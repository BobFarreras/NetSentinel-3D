import { invokeCommand } from "../shared/tauri/bridge";
import type { WifiNetworkDTO } from "../shared/dtos/NetworkDTOs";

export const wifiAdapter = {
  scanAirwaves: async (): Promise<WifiNetworkDTO[]> => {
    return await invokeCommand<WifiNetworkDTO[]>("scan_airwaves");
  },
};

