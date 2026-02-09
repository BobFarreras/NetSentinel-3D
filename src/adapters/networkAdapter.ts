import { invoke } from "@tauri-apps/api/core";
import { DeviceDTO, ScanSession } from "../shared/dtos/NetworkDTOs";

export const networkAdapter = {
  scanNetwork: async (range: string = '192.168.1.0/24'): Promise<DeviceDTO[]> => {
    return await invoke<DeviceDTO[]>('scan_network', { range });
  },

  saveScan: async (devices: DeviceDTO[]): Promise<void> => {
    await invoke('save_scan', { devices });
  },

  getHistory: async (): Promise<ScanSession[]> => {
    return await invoke<ScanSession[]>('get_history');
  }
};