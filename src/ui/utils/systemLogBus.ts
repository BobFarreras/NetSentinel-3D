// src/ui/utils/systemLogBus.ts

const SYSTEM_LOG_EVENT = "netsentinel://system-log";

export type SystemLogLevel = "INFO" | "WARN" | "ERROR" | "DEBUG";

export type SystemLogPayload = {
  source: string;
  level: SystemLogLevel;
  message: string;
  ts: number;
};

export const emitSystemLog = (payload: Omit<SystemLogPayload, "ts">) => {
  const event = new CustomEvent<SystemLogPayload>(SYSTEM_LOG_EVENT, {
    detail: {
      ...payload,
      ts: Date.now(),
    },
  });
  window.dispatchEvent(event);
};

export const listenSystemLog = (callback: (payload: SystemLogPayload) => void) => {
  const handler = (evt: Event) => {
    const custom = evt as CustomEvent<SystemLogPayload>;
    callback(custom.detail);
  };
  window.addEventListener(SYSTEM_LOG_EVENT, handler as EventListener);
  return () => window.removeEventListener(SYSTEM_LOG_EVENT, handler as EventListener);
};

