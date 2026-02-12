import { useState, useEffect, useRef } from 'react';
import { systemAdapter } from '../../../../adapters/systemAdapter';
import { listenSystemLog } from '../../../utils/systemLogBus';

export const useSocketLogs = () => {
  const [deviceLogs, setDeviceLogs] = useState<Record<string, string[]>>({});
  const [systemLogs, setSystemLogs] = useState<string[]>([]);
  const activeTargetIp = useRef<string | null>(null);

  const addLog = (ip: string, message: string) => {
    setDeviceLogs(prev => ({
      ...prev,
      [ip]: [...(prev[ip] || []), message]
    }));
    // Duplicamos a SYSTEM LOGS para trazabilidad global.
    setSystemLogs(prev => [...prev, `[${ip}] ${message}`]);
  };

  const clearLogs = (ip: string) => {
    setDeviceLogs(prev => ({ ...prev, [ip]: [] }));
  };

  const addSystemLog = (message: string) => {
    setSystemLogs(prev => [...prev, message]);
  };

  const clearSystemLogs = () => {
    setSystemLogs([]);
  };

  const setActiveTarget = (ip: string | null) => {
    activeTargetIp.current = ip;
  };

  useEffect(() => {
    let isActive = true;
    let unlistenFn: (() => void) | undefined;

    const setupListener = async () => {
      const unlisten = await systemAdapter.onAuditLog((payload) => {
        const target = activeTargetIp.current;
        if (target) addLog(target, payload);
        else addSystemLog(payload);
      });
      if (!isActive) unlisten();
      else unlistenFn = unlisten;
    };
    setupListener();

    return () => { 
      isActive = false; 
      if (unlistenFn) unlistenFn(); 
    };
  }, []);

  useEffect(() => {
    const unlisten = listenSystemLog((payload) => {
      const timestamp = new Date(payload.ts).toLocaleTimeString("en-US", { hour12: false });
      addSystemLog(`${timestamp} [${payload.source}] [${payload.level}] ${payload.message}`);
    });
    return () => unlisten();
  }, []);

  return { deviceLogs, systemLogs, addLog, addSystemLog, clearLogs, clearSystemLogs, setActiveTarget };
};
