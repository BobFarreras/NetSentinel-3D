// src/ui/utils/logger.ts
type LogMeta = unknown;

const isDev = import.meta.env.DEV;
// En Vitest queremos evitar ruido en salida. En runtime real, warnings/errores siguen activos.
const isTest = import.meta.env.MODE === "test";

const formatError = (error?: LogMeta): unknown => {
  if (error instanceof Error) return error;
  return error;
};

export const uiLogger = {
  info: (message: string, meta?: LogMeta) => {
    if (!isDev || isTest) return;
    console.info(`[ui] ${message}`, meta ?? "");
  },
  warn: (message: string, meta?: LogMeta) => {
    if (isTest) return;
    console.warn(`[ui] ${message}`, meta ?? "");
  },
  error: (message: string, error?: LogMeta) => {
    if (isTest) return;
    console.error(`[ui] ${message}`, formatError(error));
  },
};
