import React, { useEffect, useMemo, useRef, useState } from "react";
import type { DeviceDTO, HostIdentity } from "../../../../shared/dtos/NetworkDTOs";
import { useExternalAudit } from "../../../hooks/modules/ui/useExternalAudit";
import { getExternalAuditScenarios } from "../../../../core/logic/externalAuditScenarios";
import { AuditHeader } from "./AuditHeader";
import { AuditConsole } from "./AuditConsole";
import { LabModeView } from "./LabModeView"; 
import { CustomModeView } from "./CustomModeView"; 
import { windowingAdapter } from "../../../../adapters/windowingAdapter";
import { CyberConfirmModal } from "../../shared/CyberConfirmModal";

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
  autoRun: initialAutoRunProp = false, // Renombramos para evitar confusión
  embedded = false,
}) => {
  const audit = useExternalAudit();

  const [localTarget, setLocalTarget] = useState<DeviceDTO | null>(propTargetDevice || null);
  const [mode, setMode] = useState<"LAB" | "CUSTOM">(() => (localTarget || defaultScenarioId ? "LAB" : "CUSTOM"));
  const [scenarioId, setScenarioId] = useState<string>(() => defaultScenarioId || "");
  
  const [nativeRows, setNativeRows] = useState<{ ts: number; stream: "stdout" | "stderr"; line: string }[]>([]);
  const [isNativeRunning, setIsNativeRunning] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // CORRECCIÓ 1: Token comença SEMPRE a 0. Ignorem props inicials per seguretat.
  const [autoRunToken, setAutoRunToken] = useState<number>(0);
  const lastExecutedToken = useRef<number>(0);
  
  const abortController = useRef<AbortController | null>(null);

  const scenarios = useMemo(() => getExternalAuditScenarios(), []);
  const selectedScenario = useMemo(() => scenarios.find((s) => s.id === scenarioId) || null, [scenarios, scenarioId]);

  // Sincronitzar props (només dades, mai execució)
  useEffect(() => {
    if (propTargetDevice) {
        console.log("📥 [PANEL] Prop Target Updated:", propTargetDevice.ip);
        setLocalTarget(propTargetDevice);
        setMode("LAB");
    }
  }, [propTargetDevice]);

  // CORRECCIÓ 2: Listener d'Events
  useEffect(() => {
    const unlistenPromise = windowingAdapter.listenExternalAuditContext((payload) => {
      console.log("⚡ [PANEL] Event Context Received:", payload);
      
      if (payload.targetDevice) setLocalTarget(payload.targetDevice);
      if (payload.scenarioId) {
        setScenarioId(payload.scenarioId);
        setMode("LAB");
      }
      
      // Només disparem si el payload ho demana explícitament a true
      if (payload.autoRun === true) {
        console.log("🔥 [PANEL] Event requested AutoRun!");
        setAutoRunToken(Date.now());
      } else {
        console.log("✋ [PANEL] Event requested data update only (No AutoRun)");
      }
    });
    return () => { unlistenPromise.then((unlisten) => unlisten()); };
  }, []);

  // --- EJECUCIÓN ---
  const executeNativeAttack = async () => {
    if (!selectedScenario) return;
    const targetIp = localTarget?.ip || "unknown";

    setNativeRows([]);
    setIsNativeRunning(true);
    abortController.current = new AbortController();

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

  const handleRunLab = async () => {
    if (!selectedScenario || isNativeRunning) return;

    if (selectedScenario.mode === "native" && selectedScenario.category === "WIFI") {
        setShowConfirm(true);
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

  // EFECTE AUTO-RUN (Molt estricte)
  useEffect(() => {
    // 1. Si el token és 0, no fem res.
    if (autoRunToken === 0) return;

    // 2. Si ja hem executat aquest token, no repetim.
    if (autoRunToken === lastExecutedToken.current) return;

    // 3. Validacions d'estat
    if (!selectedScenario || audit.isRunning || isNativeRunning || !localTarget) {
        console.warn("⚠️ [PANEL] AutoRun requested but conditions not met (no scenario/target or running)");
        return;
    }

    console.log("🚀 [PANEL] Executing AutoRun via Token:", autoRunToken);
    lastExecutedToken.current = autoRunToken;
    
    // ATENCIÓ: AutoRun NUNCA hauria de saltar-se la confirmació per temes de seguretat (WiFi).
    // Així que cridem a handleRunLab, que obrirà el modal si cal.
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
        isAutoRun={false} // Visualment no mostrem "AUTO" per no confondre
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

      <CyberConfirmModal 
        isOpen={showConfirm}
        title="⚠ CONNECTION INTERRUPT"
        message={`Este ataque requiere control exclusivo del adaptador WiFi.\n\nSe interrumpirá tu conexión a internet actual para inyectar credenciales contra el objetivo.\n\n¿Autorizar desconexión temporal?`}
        onConfirm={() => { setShowConfirm(false); executeNativeAttack(); }}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  );
};