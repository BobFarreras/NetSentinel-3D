import { invokeCommand } from "../shared/tauri/bridge";
import { DeviceDTO, ScanSession, HostIdentity, LatestSnapshotDTO, GatewayCredentialsDTO } from "../shared/dtos/NetworkDTOs";

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
  },

  saveLatestSnapshot: async (devices: DeviceDTO[]): Promise<void> => {
    await invokeCommand('save_latest_snapshot', { devices });
  },

  loadLatestSnapshot: async (): Promise<LatestSnapshotDTO | null> => {
    const snap = await invokeCommand<LatestSnapshotDTO | null>('load_latest_snapshot');
    return snap ?? null;
  },

  saveGatewayCredentials: async (gatewayIp: string, user: string, pass: string): Promise<void> => {
    await invokeCommand('save_gateway_credentials', { gatewayIp, user, pass });
  },

  getGatewayCredentials: async (gatewayIp: string): Promise<GatewayCredentialsDTO | null> => {
    const creds = await invokeCommand<GatewayCredentialsDTO | null>('get_gateway_credentials', { gatewayIp });
    return creds ?? null;
  },

  deleteGatewayCredentials: async (gatewayIp: string): Promise<void> => {
    await invokeCommand('delete_gateway_credentials', { gatewayIp });
  },
};
