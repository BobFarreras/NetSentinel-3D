// src/shared/tauri/e2e_mock/mockBus.ts
// Bus de eventos E2E (mock): simula `tauri.listen` y `app.emit` cuando `VITE_E2E_MOCK_TAURI=true`.

export type EventEnvelope<T> = { payload: T };
export type EventCallback<T> = (event: EventEnvelope<T>) => void;
export type UnlistenFn = () => void;

const listeners = new Map<string, Set<EventCallback<unknown>>>();

export const emitMock = <T>(eventName: string, payload: T): void => {
  const eventListeners = listeners.get(eventName);
  if (!eventListeners) return;
  const envelope: EventEnvelope<T> = { payload };
  eventListeners.forEach((callback) => callback(envelope as EventEnvelope<unknown>));
};

export const listenMock = async <T>(
  eventName: string,
  callback: EventCallback<T>,
): Promise<UnlistenFn> => {
  const current = listeners.get(eventName) || new Set<EventCallback<unknown>>();
  current.add(callback as EventCallback<unknown>);
  listeners.set(eventName, current);

  return () => {
    const bucket = listeners.get(eventName);
    if (!bucket) return;
    bucket.delete(callback as EventCallback<unknown>);
    if (bucket.size === 0) listeners.delete(eventName);
  };
};

export const __resetMockBusForTests = (): void => {
  listeners.clear();
};

