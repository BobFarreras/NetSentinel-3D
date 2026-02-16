// src/ui/features/attack_lab/panel/AttackLabPanel.tsx
// Panel Attack Lab (LAB/CUSTOM): composicion de UI y conexion con el hook de estado (sin mezclar logica de ejecucion/persistencia).

import React from "react";
import type { DeviceDTO, HostIdentity } from "../../../../shared/dtos/NetworkDTOs";
import { CyberConfirmModal } from "../../../components/shared/CyberConfirmModal";
import { AuditConsole } from "./AuditConsole";
import { AuditHeader } from "./AuditHeader";
import { CustomModeView } from "./CustomModeView";
import { LabModeView } from "./LabModeView";
import { useAttackLabPanelState } from "./hooks/useAttackLabPanelState";

interface AttackLabPanelProps {
  onClose: () => void;
  targetDevice?: DeviceDTO | null;
  availableDevices?: DeviceDTO[];
  availableRouters?: DeviceDTO[];
  identity?: HostIdentity | null;
  defaultScenarioId?: string | null;
  // Token monotono: si cambia, se intenta ejecutar automaticamente el escenario actual.
  // Esto evita auto-run al montar/desmontar por simple visibilidad (TopBar).
  autoRunToken?: number;
  embedded?: boolean;
}

export const AttackLabPanel: React.FC<AttackLabPanelProps> = ({
  onClose,
  targetDevice: propTargetDevice,
  availableDevices = [],
  availableRouters = [],
  identity = null,
  defaultScenarioId = null,
  autoRunToken: propAutoRunToken = 0,
  embedded = false,
}) => {
  const st = useAttackLabPanelState({
    targetDevice: propTargetDevice,
    availableDevices,
    availableRouters,
    identity,
    defaultScenarioId,
    autoRunToken: propAutoRunToken,
  });

  const isAnyRunning = st.runtime.state.isRunning;

  return (
    <div
      ref={st.rootRef}
      style={{
        width: embedded ? "100%" : 780,
        maxWidth: embedded ? "none" : "95vw",
      height: embedded ? "100%" : "80vh",
      background: "#050607",
      border: "1px solid rgba(0,255,136,0.25)",
      boxShadow: "0 0 0 1px rgba(0,255,136,0.12), 0 25px 80px rgba(0,0,0,0.65)",
      display: "flex", flexDirection: "column", fontFamily: "'Consolas', 'Courier New', monospace",
      position: "relative",
      minWidth: 0,
      overflow: "hidden",
    }}>
      <AuditHeader 
        mode={st.mode} setMode={st.setMode} 
        status={isAnyRunning ? st.t("attackLab.status.inProgress") : st.statusText} 
        isAutoRun={false} 
        compact={st.isNarrow}
        onClose={onClose} 
      />

      {/*
        Layout con scroll parcial:
        - La vista (LAB/CUSTOM) puede scrollear cuando el panel es pequeno.
        - La consola mantiene su propio scroll y ocupa el resto del alto.
      */}
      <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Bloque superior (selector/target/acciones): debe ocupar solo lo necesario.
            Si crece (descripciones largas), scrollea dentro de un maxHeight para no robar espacio a la consola. */}
        <div style={{
          flex: "0 0 auto",
          maxHeight: st.isNarrow ? 340 : 260,
          overflowY: "auto",
          overflowX: "hidden",
        }}>
          {st.mode === "LAB" ? (
            <LabModeView 
              scenarios={st.scenarios}
              selectedId={st.scenarioId}
              onSelect={(id) => st.setScenarioId(id)} 
              targetDevice={st.localTarget}
              routerTargets={st.routerTargetOptions}
              onSelectRouterTarget={(ip) => st.selectRouterTarget(ip || null)}
              deviceTargets={st.deviceTargetOptions}
              onSelectDeviceTarget={(ip) => st.selectDeviceTarget(ip || null)}
              wifiTargets={st.wifiTargets}
              onSelectWifiTarget={(bssid) => st.selectWifiTarget(bssid || null)}
              selectedScenario={st.selectedScenario}
              isRunning={isAnyRunning} 
              onRun={st.handleRunLab}
              onCancel={st.handleCancel}
              layout={st.isNarrow ? "narrow" : "wide"}
              wifiEvidence={st.wifiEvidence}
              onWifiEvidenceImported={st.onWifiEvidenceImported}
              onWifiEvidenceCleared={st.onWifiEvidenceCleared}
            />
          ) : (
            <CustomModeView 
              isRunning={st.runtime.state.isRunning}
              onStart={st.runtime.actions.startExternal}
              onCancel={st.runtime.actions.cancel}
              layout={st.isNarrow ? "narrow" : "wide"}
            />
          )}
        </div>

        <AuditConsole rows={st.displayRows} error={st.runtime.state.error} nextSteps={st.nextSteps} />
      </div>

      {/* MODAL CON STATUS OPSEC */}
      <CyberConfirmModal 
        isOpen={st.showConfirm}
        title={
          st.macStatus?.risk_level === "HIGH"
            ? `⚠ ${st.t("attackLab.opsec.warningTitle")}`
            : `✅ ${st.t("attackLab.opsec.safeTitle")}`
        }
        macStatus={st.macStatus}
        isLoading={st.isCheckingOpsec}
        message={st.t("attackLab.opsec.wifiExclusiveMessage")}
        onConfirm={st.onOpsecConfirm}
        onCancel={st.onOpsecCancel}
      />
    </div>
  );
};
