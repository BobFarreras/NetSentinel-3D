import { invokeCommand, listenEvent, UnlistenFn } from '../shared/tauri/bridge';
import type { ExternalAuditExitEvent, ExternalAuditLogEvent, ExternalAuditRequestDTO } from '../shared/dtos/NetworkDTOs';

export const externalAuditAdapter = {
  start: async (request: ExternalAuditRequestDTO): Promise<string> => {
    return await invokeCommand<string>('start_external_audit', { request });
  },

  cancel: async (auditId: string): Promise<void> => {
    await invokeCommand('cancel_external_audit', { auditId });
  },

  onLog: async (callback: (event: ExternalAuditLogEvent) => void): Promise<UnlistenFn> => {
    return await listenEvent<ExternalAuditLogEvent>('external-audit-log', (event) => {
      callback(event.payload);
    });
  },

  onExit: async (callback: (event: ExternalAuditExitEvent) => void): Promise<UnlistenFn> => {
    return await listenEvent<ExternalAuditExitEvent>('external-audit-exit', (event) => {
      callback(event.payload);
    });
  },
};

