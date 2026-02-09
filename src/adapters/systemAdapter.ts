import { listen, UnlistenFn } from '@tauri-apps/api/event';

export const systemAdapter = {
  onAuditLog: async (callback: (log: string) => void): Promise<UnlistenFn> => {
    return await listen<string>('audit-log', (event) => {
      callback(event.payload);
    });
  }
};