import { invoke } from "@tauri-apps/api/core";
import { DeviceDTO, OpenPortDTO, RouterAuditResult, SecurityReportDTO } from "../shared/dtos/NetworkDTOs";

export const auditAdapter = {
  auditTargetPorts: async (ip: string): Promise<OpenPortDTO[]> => {
    // El backend retorna un SecurityReportDTO, nosaltres volem els ports
    const report = await invoke<SecurityReportDTO>('audit_target', { ip });
    return report.openPorts || [];
  },

  auditRouter: async (gatewayIp: string): Promise<RouterAuditResult> => {
    return await invoke<RouterAuditResult>('audit_router', { gatewayIp });
  },

  fetchRouterDevices: async (gatewayIp: string, user: string, pass: string): Promise<DeviceDTO[]> => {
    return await invoke<DeviceDTO[]>('fetch_router_devices', { 
      gatewayIp, 
      user, 
      pass 
    });
  }
};