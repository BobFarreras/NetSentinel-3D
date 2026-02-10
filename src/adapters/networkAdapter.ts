import { invokeCommand } from "../shared/tauri/bridge";
import { DeviceDTO, ScanSession, HostIdentity } from "../shared/dtos/NetworkDTOs";

export const networkAdapter = {
  scanNetwork: async (range: string = '192.168.1.0/24'): Promise<DeviceDTO[]> => {
    return await invokeCommand<DeviceDTO[]>('scan_network', { range });
  },

  saveScan: async (devices: DeviceDTO[]): Promise<void> => {
    await invokeCommand('save_scan', { devices });
  },

  getHistory: async (): Promise<ScanSession[]> => {
    return await invokeCommand<ScanSession[]>('get_history');
  },

  getHostIdentity: async (): Promise<HostIdentity> => {
    return await invokeCommand<HostIdentity>('get_identity');
  }
};
