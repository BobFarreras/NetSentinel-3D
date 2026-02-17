// src/ui/features/attack_lab/panel/LabModeView.tsx
// Vista LAB del Attack Lab: composicion de cards (escenario/target/evidencia) y controles de ejecucion + acceso al Password Vault.

import React, { useState } from "react";
import type { DeviceDTO, WifiNetworkDTO } from "../../../../shared/dtos/NetworkDTOs";
import type { AttackLabScenario } from "../catalog/types";
import { WordlistManagerModal } from "./WordlistManagerModal";
import { ErrorBoundary } from "../../../components/shared/ErrorBoundary";
import type { ParsedWifiEvidence } from "../logic/parseWifiEvidence";
import { LabRunControls } from "./lab_mode/LabRunControls";
import { ScenarioSelectCard } from "./lab_mode/ScenarioSelectCard";
import { TargetSelectCard } from "./lab_mode/TargetSelectCard";
import { WifiEvidenceImportCard } from "./lab_mode/WifiEvidenceImportCard";

interface LabModeViewProps {
  scenarios: AttackLabScenario[];
  selectedId: string;
  onSelect: (id: string) => void;
  targetDevice: DeviceDTO | null;
  routerTargets?: DeviceDTO[];
  onSelectRouterTarget?: (ip: string | null) => void;
  deviceTargets?: DeviceDTO[];
  onSelectDeviceTarget?: (ip: string | null) => void;
  wifiTargets?: WifiNetworkDTO[];
  onSelectWifiTarget?: (bssid: string | null) => void;
  selectedScenario: AttackLabScenario | null;
  isRunning: boolean;
  onRun: () => void;
  onCancel: () => void;
  layout?: "wide" | "narrow";

  // Evidencia WiFi (opcional): se usa por el escenario "wifi_evidence_import".
  wifiEvidence?: ParsedWifiEvidence | null;
  onWifiEvidenceImported?: (raw: string, parsed: ParsedWifiEvidence | null) => void;
  onWifiEvidenceCleared?: () => void;
}

export const LabModeView: React.FC<LabModeViewProps> = ({
  scenarios,
  selectedId,
  onSelect,
  targetDevice,
  routerTargets = [],
  onSelectRouterTarget,
  deviceTargets = [],
  onSelectDeviceTarget,
  wifiTargets = [],
  onSelectWifiTarget,
  selectedScenario,
  isRunning,
  onRun,
  onCancel,
  layout = "wide",
  wifiEvidence = null,
  onWifiEvidenceImported,
  onWifiEvidenceCleared,
}) => {
  // ESTADO PARA EL MODAL DE DICCIONARIO
  const [showWordlist, setShowWordlist] = useState(false);

  const requiresTarget = selectedScenario?.id !== "wifi_evidence_import";
  const canRun = Boolean(selectedScenario) && (!requiresTarget || Boolean(targetDevice));

  return (
    <>
      <div
        style={{
          display: "flex",
          gap: 12,
          padding: 12,
          flexShrink: 0,
          flexDirection: layout === "narrow" ? "column" : "row",
          alignItems: "stretch",
        }}
      >
        <ScenarioSelectCard
          scenarios={scenarios}
          selectedId={selectedId}
          onSelect={onSelect}
          selectedScenario={selectedScenario}
          isRunning={isRunning}
          onOpenVault={() => setShowWordlist(true)}
        />

        <TargetSelectCard
          selectedScenario={selectedScenario}
          targetDevice={targetDevice}
          routerTargets={routerTargets}
          onSelectRouterTarget={onSelectRouterTarget}
          deviceTargets={deviceTargets}
          onSelectDeviceTarget={onSelectDeviceTarget}
          wifiTargets={wifiTargets}
          onSelectWifiTarget={onSelectWifiTarget}
          isRunning={isRunning}
          layout={layout}
        >
          {selectedScenario?.id === "wifi_evidence_import" && (
            <WifiEvidenceImportCard
              isRunning={isRunning}
              wifiEvidence={wifiEvidence}
              onImported={onWifiEvidenceImported}
              onCleared={onWifiEvidenceCleared}
            />
          )}

          <LabRunControls canRun={canRun} isRunning={isRunning} onRun={onRun} onCancel={onCancel} />
        </TargetSelectCard>
      </div>

        {/* MODAL DE DICCIONARIO (Se renderiza condicionalmente) */}
        <ErrorBoundary label="ATTACK_LAB_PASSWORD_VAULT">
          <WordlistManagerModal isOpen={showWordlist} onClose={() => setShowWordlist(false)} />
        </ErrorBoundary>
    </>
  );
};
