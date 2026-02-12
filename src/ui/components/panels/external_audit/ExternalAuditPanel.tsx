// src/ui/components/panels/external_audit/ExternalAuditPanel.tsx

import React, { useEffect, useMemo, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core"; // <--- IMPORTANTE
import type { DeviceDTO, HostIdentity } from "../../../../shared/dtos/NetworkDTOs";
import { useExternalAudit } from "../../../hooks/modules/ui/useExternalAudit";
import { getExternalAuditScenarios } from "../../../../core/logic/externalAuditScenarios";
import { AuditHeader } from "./AuditHeader";
import { AuditConsole } from "./AuditConsole";
import { LabModeView } from "./LabModeView"; 
import { CustomModeView } from "./CustomModeView"; 
import { windowingAdapter } from "../../../../adapters/windowingAdapter";
import { CyberConfirmModal, type MacSecurityStatusDTO } from "../../shared/CyberConfirmModal"; // Importamos el tipo del modal
import { emitSystemLog } from "../../../utils/systemLogBus";

interface ExternalAuditPanelProps {
  onClose: () => void;
  targetDevice?: DeviceDTO | null;
  identity?: HostIdentity | null;
  defaultScenarioId?: string | null;
  autoRun?: boolean;
  embedded?: boolean;
}

export const ExternalAuditPanel: React.FC<ExternalAuditPanelProps> = ({
  onClose,
  targetDevice: propTargetDevice,
  identity = null,
  defaultScenarioId = null,
  autoRun: _initialAutoRunProp = false,
  embedded = false,
}) => {
  const audit = useExternalAudit();

  const [localTarget, setLocalTarget] = useState<DeviceDTO | null>(propTargetDevice || null);
  const [mode, setMode] = useState<"LAB" | "CUSTOM">(() => (localTarget || defaultScenarioId ? "LAB" : "CUSTOM"));
  const [scenarioId, setScenarioId] = useState<string>(() => defaultScenarioId || "");
  
  const [nativeRows, setNativeRows] = useState<{ ts: number; stream: "stdout" | "stderr"; line: string }[]>([]);
  const [isNativeRunning, setIsNativeRunning] = useState(false);
  
  // ESTADOS MODAL & OPSEC
  const [showConfirm, setShowConfirm] = useState(false);
  const [macStatus, setMacStatus] = useState<MacSecurityStatusDTO | null>(null);
  const [isCheckingOpsec, setIsCheckingOpsec] = useState(false);

  const [autoRunToken, setAutoRunToken] = useState<number>(0);
  const lastExecutedToken = useRef<number>(0);
  
  const abortController = useRef<AbortController | null>(null);

  const scenarios = useMemo(() => getExternalAuditScenarios(), []);
  const selectedScenario = useMemo(() => scenarios.find((s) => s.id === scenarioId) || null, [scenarios, scenarioId]);

  useEffect(() => {
    if (propTargetDevice) {
        setLocalTarget(propTargetDevice);
        setMode("LAB");
        emitSystemLog({
          source: "EXTERNAL_AUDIT",
          level: "DEBUG",
          message: `target actualizado por props ip=${propTargetDevice.ip}`,
        });
    }
  }, [propTargetDevice]);

  useEffect(() => {
    const unlistenPromise = windowingAdapter.listenExternalAuditContext((payload) => {
      if (payload.targetDevice) setLocalTarget(payload.targetDevice);
      if (payload.scenarioId) {
        setScenarioId(payload.scenarioId);
        setMode("LAB");
      }
      
      if (payload.autoRun === true) {
        setAutoRunToken(Date.now());
      }
    });
    return () => { unlistenPromise.then((unlisten) => unlisten()); };
  }, []);

  const executeNativeAttack = async () => {
    if (!selectedScenario) return;
    const targetIp = localTarget?.ip || "unknown";

    setNativeRows([]);
    setIsNativeRunning(true);
    abortController.current = new AbortController();

    setNativeRows([{ ts: Date.now(), stream: "stdout", line: `🚀 INICIANDO PROTOCOLO: ${selectedScenario.title}` }]);
    emitSystemLog({
      source: "EXTERNAL_AUDIT",
      level: "INFO",
      message: `Inicio protocolo '${selectedScenario.id}' target=${targetIp}`,
    });

    try {
      if (selectedScenario.executeNative) {
          await selectedScenario.executeNative({
            target: targetIp, 
            signal: abortController.current.signal, 
            onLog: (stream, line) => {
              // Las trazas de diagnostico van a SYSTEM LOGS para no saturar la consola del panel.
              if (line.includes("🧪 TRACE")) {
                emitSystemLog({
                  source: "WIFI_NATIVE",
                  level: stream === "stderr" ? "ERROR" : "DEBUG",
                  message: line,
                });
                return;
              }

              setNativeRows(prev => [...prev, { ts: Date.now(), stream, line }]);

              // Duplicamos solo eventos de control importantes.
              if (line.includes("PREDATOR HIT") || line.includes("ATAQUE ABORTADO") || line.includes("DICCIONARIO AGOTADO")) {
                emitSystemLog({
                  source: "WIFI_NATIVE",
                  level: stream === "stderr" ? "WARN" : "INFO",
                  message: line,
                });
              }
            }
          });
      }
    } catch (e) {
      setNativeRows(prev => [...prev, { ts: Date.now(), stream: "stderr", line: `❌ ERROR CRÍTICO: ${e}` }]);
    } finally {
      setIsNativeRunning(false); 
      abortController.current = null;
    }
  };

  const handleRunLab = async () => {
    if (!selectedScenario || isNativeRunning) return;

    // --- CHECK NATIVO (WIFI) ---
    if (selectedScenario.mode === "native" && selectedScenario.category === "WIFI") {
        // Mostramos el modal de inmediato y resolvemos el check OPSEC en segundo plano.
        setMacStatus(null);
        setIsCheckingOpsec(true);
        setShowConfirm(true);

        void (async () => {
          try {
            const status = await invoke<MacSecurityStatusDTO>("check_mac_security");
            setMacStatus(status);
            emitSystemLog({
              source: "OPSEC",
              level: status.risk_level === "HIGH" ? "WARN" : "INFO",
              message: `check_mac_security risk=${status.risk_level} mac=${status.current_mac}`,
            });
          } catch (e) {
            setMacStatus({ current_mac: "UNKNOWN", is_spoofed: false, risk_level: "HIGH" });
            emitSystemLog({
              source: "OPSEC",
              level: "ERROR",
              message: `check_mac_security error=${String(e)}`,
            });
          } finally {
            setIsCheckingOpsec(false);
          }
        })();

        return; 
    }

    if (selectedScenario.mode === "native") {
        await executeNativeAttack();
        return;
    }

    // Legacy
    if (selectedScenario.mode === "simulated") {
      const steps = selectedScenario.simulate?.({ device: localTarget!, identity }) || [];
      await audit.startSimulated(selectedScenario.title, steps);
    } else if (localTarget) {
        const support = selectedScenario.isSupported?.({ device: localTarget, identity }) || { supported: true };
        if (support.supported) {
            const req = selectedScenario.buildRequest?.({ device: localTarget, identity });
            if (req) await audit.start(req);
        }
    }
  };

  useEffect(() => {
    if (autoRunToken === 0) return;
    if (autoRunToken === lastExecutedToken.current) return;
    if (!selectedScenario || audit.isRunning || isNativeRunning || !localTarget) {
        return;
    }

    lastExecutedToken.current = autoRunToken;
    void handleRunLab();
  }, [autoRunToken, selectedScenario, audit.isRunning, isNativeRunning, localTarget]);

  const handleCancel = async () => {
      if (isNativeRunning && abortController.current) abortController.current.abort(); 
      if (audit.isRunning) await audit.cancel();
  };

  const isAnyRunning = audit.isRunning || isNativeRunning;
  const displayRows = nativeRows.length > 0 ? nativeRows : audit.rows;

  return (
    <div style={{
      width: embedded ? "100%" : 780,
      maxWidth: embedded ? "none" : "95vw",
      height: embedded ? "100%" : "80vh",
      background: "#050607",
      border: "1px solid rgba(0,255,136,0.25)",
      boxShadow: "0 0 0 1px rgba(0,255,136,0.12), 0 25px 80px rgba(0,0,0,0.65)",
      display: "flex", flexDirection: "column", fontFamily: "'Consolas', 'Courier New', monospace",
      position: "relative"
    }}>
      <AuditHeader 
        mode={mode} setMode={setMode} 
        status={isNativeRunning ? "⚠️ ATTACK IN PROGRESS" : audit.summary} 
        isAutoRun={false} 
        onClose={onClose} 
      />

      {mode === "LAB" ? (
        <LabModeView 
          scenarios={scenarios}
          selectedId={scenarioId}
          onSelect={(id) => { setScenarioId(id); setNativeRows([]); }} 
          targetDevice={localTarget}
          selectedScenario={selectedScenario}
          isRunning={isAnyRunning} 
          onRun={handleRunLab}
          onCancel={handleCancel}
          onClear={() => { audit.clear(); setNativeRows([]); }}
        />
      ) : (
        <CustomModeView 
          isRunning={audit.isRunning}
          onStart={audit.start}
          onCancel={audit.cancel}
          onClear={audit.clear}
        />
      )}

      <AuditConsole rows={displayRows} error={audit.error} />

      {/* MODAL CON STATUS OPSEC */}
      <CyberConfirmModal 
        isOpen={showConfirm}
        title={macStatus?.risk_level === "HIGH" ? "⚠ OPSEC WARNING: REAL IDENTITY" : "✅ OPSEC: IDENTITY OBFUSCATED"}
        macStatus={macStatus}
        isLoading={isCheckingOpsec}
        message={`Este ataque requiere control exclusivo del adaptador WiFi.\n\nSe interrumpirá tu conexión a internet actual para inyectar credenciales contra el objetivo.`}
        onConfirm={() => {
          setShowConfirm(false);
          emitSystemLog({ source: "OPSEC", level: "INFO", message: "Operador autorizo ejecucion nativa WiFi" });
          executeNativeAttack();
        }}
        onCancel={() => {
          setShowConfirm(false);
          emitSystemLog({ source: "OPSEC", level: "WARN", message: "Operador cancelo ejecucion nativa WiFi" });
        }}
      />
    </div>
  );
};
