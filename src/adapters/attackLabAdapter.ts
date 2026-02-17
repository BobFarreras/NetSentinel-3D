// src/adapters/attackLabAdapter.ts
// Adapter IPC del Attack Lab: invoca comandos Tauri y escucha eventos (logs/salida) tipados.

import { invokeCommand, listenEvent, UnlistenFn } from '../shared/tauri/bridge';
import type { AttackLabExitEvent, AttackLabLogEvent, AttackLabRequestDTO } from '../shared/dtos/NetworkDTOs';

export const attackLabAdapter = {
  start: async (request: AttackLabRequestDTO): Promise<string> => {
    return await invokeCommand<string>('start_attack_lab', { request });
  },

  cancel: async (auditId: string): Promise<void> => {
    await invokeCommand('cancel_attack_lab', { auditId });
  },

  onLog: async (callback: (event: AttackLabLogEvent) => void): Promise<UnlistenFn> => {
    return await listenEvent<AttackLabLogEvent>('attack-lab-log', (event) => {
      callback(event.payload);
    });
  },

  onExit: async (callback: (event: AttackLabExitEvent) => void): Promise<UnlistenFn> => {
    return await listenEvent<AttackLabExitEvent>('attack-lab-exit', (event) => {
      callback(event.payload);
    });
  },
};
