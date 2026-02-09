import { useState, useEffect, useRef } from 'react';
import { systemAdapter } from '../../../adapters/systemAdapter';

export const useSocketLogs = () => {
  const [deviceLogs, setDeviceLogs] = useState<Record<string, string[]>>({});
  const activeTargetIp = useRef<string | null>(null);

  const addLog = (ip: string, message: string) => {
    setDeviceLogs(prev => ({
      ...prev,
      [ip]: [...(prev[ip] || []), message]
    }));
  };

  const clearLogs = (ip: string) => {
    setDeviceLogs(prev => ({ ...prev, [ip]: [] }));
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

  return { deviceLogs, addLog, clearLogs, setActiveTarget };
};