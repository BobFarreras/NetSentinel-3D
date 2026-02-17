// src/shared/tauri/bridge.ts
// Bridge IPC: punto unico de union Frontend <-> Backend (Tauri). En E2E puede operar con mock local.

import { invoke as tauriInvoke } from "@tauri-apps/api/core";
import { listen as tauriListen } from "@tauri-apps/api/event";
import type { EventCallback } from "./e2e_mock/mockBus";
import { invokeMock, listenMock } from "./e2e_mock";

export type UnlistenFn = () => void;

const isE2EMock = import.meta.env.VITE_E2E_MOCK_TAURI === "true";

export const invokeCommand = async <T>(command: string, args?: Record<string, unknown>): Promise<T> => {
  if (isE2EMock) return invokeMock<T>(command, args);
  return tauriInvoke<T>(command, args);
};

export const listenEvent = async <T>(
  eventName: string,
  callback: EventCallback<T>
): Promise<UnlistenFn> => {
  if (isE2EMock) return listenMock<T>(eventName, callback) as unknown as UnlistenFn;
  return tauriListen<T>(eventName, callback);
};
