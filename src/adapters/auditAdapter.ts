import { invokeCommand } from "../shared/tauri/bridge";
import { DeviceDTO, OpenPortDTO, RouterAuditResult, SecurityReportDTO } from "../shared/dtos/NetworkDTOs";

export const auditAdapter = {
  auditTargetPorts: async (ip: string): Promise<OpenPortDTO[]> => {
    // El backend retorna un SecurityReportDTO, nosaltres volem els ports
    const report = await invokeCommand<SecurityReportDTO>('audit_target', { ip });
    return report.openPorts || [];
  },

  auditRouter: async (gatewayIp: string): Promise<RouterAuditResult> => {
    return await invokeCommand<RouterAuditResult>('audit_router', { gatewayIp });
  },

  fetchRouterDevices: async (gatewayIp: string, user: string, pass: string): Promise<DeviceDTO[]> => {
    return await invokeCommand<DeviceDTO[]>('fetch_router_devices', { 
      gatewayIp, 
      user, 
      pass 
    });
  }
};
