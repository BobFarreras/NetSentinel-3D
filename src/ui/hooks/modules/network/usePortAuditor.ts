// src/ui/hooks/modules/network/usePortAuditor.ts
// Hook de auditoria de puertos: ejecuta audit_target, guarda resultados y publica trazas en el log del target.

import { useState } from 'react';
import { OpenPortDTO } from '../../../../shared/dtos/NetworkDTOs';
import { auditAdapter } from '../../../../adapters/auditAdapter';

export const usePortAuditor = (addLog: (ip: string, msg: string) => void) => {
  const [auditing, setAuditing] = useState(false);
  const [auditResults, setAuditResults] = useState<OpenPortDTO[]>([]);

  const startAudit = async (ip: string) => {
    if (auditing) return;
    setAuditing(true);
    setAuditResults([]);
    addLog(ip, `> TARGET_IP: ${ip}`);
    addLog(ip, `> EXEC: FULL_TCP_CONNECT_SCAN...`);

    try {
      const ports = await auditAdapter.auditTargetPorts(ip);
      addLog(ip, `> ANALYSIS COMPLETE. PORTS FOUND: ${ports.length}`);
      setAuditResults(ports);
    } catch (e) {
      addLog(ip, `> ERROR: CONNECTION FAILURE`);
    } finally {
      setAuditing(false);
    }
  };

  const clearResults = () => setAuditResults([]);

  return { auditing, auditResults, startAudit, clearResults };
};
