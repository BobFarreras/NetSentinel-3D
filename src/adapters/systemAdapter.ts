import { listenEvent, UnlistenFn } from '../shared/tauri/bridge';

export const systemAdapter = {
  onAuditLog: async (callback: (log: string) => void): Promise<UnlistenFn> => {
    return await listenEvent<string>('audit-log', (event) => {
      callback(event.payload);
    });
  }
};
