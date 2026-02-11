// src/ui/components/panels/external_audit/ExternalAuditPanel.tsx

import React, { useEffect, useMemo, useRef, useState } from "react";
import type { DeviceDTO, HostIdentity } from "../../../../shared/dtos/NetworkDTOs";
import { useExternalAudit } from "../../../hooks/modules/ui/useExternalAudit";
import { getExternalAuditScenarios } from "../../../../core/logic/externalAuditScenarios";
import { AuditHeader } from "./AuditHeader";
import { AuditConsole } from "./AuditConsole";
import { LabModeView } from "./LabModeView"; 
import { CustomModeView } from "./CustomModeView"; 
import { windowingAdapter } from "../../../../adapters/windowingAdapter";
import { CyberConfirmModal } from "../../shared/CyberConfirmModal"; // IMPORTANTE: El nuevo componente

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
  autoRun = false,
  embedded = false,
}) => {
  const audit = useExternalAudit();

  const [localTarget, setLocalTarget] = useState<DeviceDTO | null>(propTargetDevice || null);
  const [mode, setMode] = useState<"LAB" | "CUSTOM">(() => (localTarget || defaultScenarioId ? "LAB" : "CUSTOM"));
  const [scenarioId, setScenarioId] = useState<string>(() => defaultScenarioId || "");
  
  const [nativeRows, setNativeRows] = useState<{ ts: number; stream: "stdout" | "stderr"; line: string }[]>([]);
  const [isNativeRunning, setIsNativeRunning] = useState(false);
  
  // ESTADO DEL MODAL
  const [showConfirm, setShowConfirm] = useState(false);


  const hasAutoRun = useRef(false);
  const abortController = useRef<AbortController | null>(null);

  const scenarios = useMemo(() => getExternalAuditScenarios(), []);
  const selectedScenario = useMemo(() => scenarios.find((s) => s.id === scenarioId) || null, [scenarios, scenarioId]);

  useEffect(() => {
    if (propTargetDevice) {
        setLocalTarget(propTargetDevice);
        setMode("LAB");
    }
  }, [propTargetDevice]);

  useEffect(() => {
    const unlistenPromise = windowingAdapter.listenExternalAuditContext((payload) => {
      if (payload.targetDevice) setLocalTarget(payload.targetDevice);
      if (payload.scenarioId) {
        setScenarioId(payload.scenarioId);
        setMode("LAB");
      }
      if (payload.autoRun) hasAutoRun.current = false;
      else hasAutoRun.current = true;
    });
    return () => { unlistenPromise.then((unlisten) => unlisten()); };
  }, []);

  // --- EJECUCIÓN REAL (Después de confirmar) ---
  const executeNativeAttack = async () => {
    if (!selectedScenario) return;
    const targetIp = localTarget?.ip || "unknown";

    setNativeRows([]);
    setIsNativeRunning(true);
    abortController.current = new AbortController();

    // LOG INICIAL EN PANTALLA NEGRA
    setNativeRows([{ ts: Date.now(), stream: "stdout", line: `🚀 INICIANDO PROTOCOLO: ${selectedScenario.title}` }]);

    try {
      if (selectedScenario.executeNative) {
          await selectedScenario.executeNative({
            target: targetIp, 
            signal: abortController.current.signal, 
            onLog: (stream, line) => {
              setNativeRows(prev => [...prev, { ts: Date.now(), stream, line }]);
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

  // --- MANEJADOR DEL BOTÓN EXECUTE ---
  const handleRunLab = async () => {
    if (!selectedScenario || isNativeRunning) return;

    // SI ES MODO NATIVO (WIFI) -> PEDIR CONFIRMACIÓN CYBERPUNK
    if (selectedScenario.mode === "native" && selectedScenario.category === "WIFI") {
        setShowConfirm(true);
        return; // Esperamos a que el usuario diga "Authorize"
    }

    // SI ES OTRO MODO -> EJECUTAR DIRECTAMENTE
    if (selectedScenario.mode === "native") {
        await executeNativeAttack();
        return;
    }

    // MODOS CLI / SIMULADO
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

  const handleCancel = async () => {
      if (isNativeRunning && abortController.current) {
          abortController.current.abort(); 
      }
      if (audit.isRunning) {
          await audit.cancel();
      }
  };

  // Auto-Run
  useEffect(() => {
    if (autoRun && mode === "LAB" && selectedScenario && !audit.isRunning && !isNativeRunning && !hasAutoRun.current && localTarget) {
      hasAutoRun.current = true;
      void handleRunLab();
    }
  }, [autoRun, mode, selectedScenario, audit.isRunning, isNativeRunning, localTarget]);

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
      position: "relative" // Necesario para el modal absolute
    }}>
      <AuditHeader 
        mode={mode} setMode={setMode} 
        status={isNativeRunning ? "⚠️ ATTACK IN PROGRESS" : audit.summary} 
        isAutoRun={autoRun} onClose={onClose} 
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

      {/* EL MODAL CYBERPUNK */}
      <CyberConfirmModal 
        isOpen={showConfirm}
        title="⚠ CONNECTION INTERRUPT"
        message={`Este ataque requiere control exclusivo del adaptador WiFi.\n\nSe interrumpirá tu conexión a internet actual para inyectar credenciales contra el objetivo.\n\n¿Autorizar desconexión temporal?`}
        onConfirm={() => {
            setShowConfirm(false);
            executeNativeAttack();
        }}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  );
};