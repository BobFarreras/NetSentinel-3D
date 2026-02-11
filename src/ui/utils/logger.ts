// src/ui/utils/logger.ts
type LogMeta = unknown;

const isDev = import.meta.env.DEV;

const formatError = (error?: LogMeta): unknown => {
  if (error instanceof Error) return error;
  return error;
};

export const uiLogger = {
  info: (message: string, meta?: LogMeta) => {
    if (!isDev) return;
    console.info(`[ui] ${message}`, meta ?? "");
  },
  warn: (message: string, meta?: LogMeta) => {
    console.warn(`[ui] ${message}`, meta ?? "");
  },
  error: (message: string, error?: LogMeta) => {
    console.error(`[ui] ${message}`, formatError(error));
  },
};

