// src/ui/features/attack_lab/panel/hooks/useAttackLabPanelState.ts
// Hook de estado del AttackLabPanel: compone sub-hooks (targets/ejecucion/persistencia) para mantener responsabilidades separadas.

import { useEffect, useMemo, useRef, useState } from "react";
import type { DeviceDTO, HostIdentity } from "../../../../../shared/dtos/NetworkDTOs";
import { useI18n } from "../../../../i18n/useI18n";
import { useAttackLabRuntime } from "../../../../hooks/modules/attack_lab/useAttackLabRuntime";
import { getAttackLabScenarios } from "../../catalog/attackLabScenarios";
import type { AttackLabScenario } from "../../catalog/types";
import type { ParsedWifiEvidence } from "../../logic/parseWifiEvidence";
import { emitSystemLog } from "../../../../utils/systemLogBus";
import { clearWifiEvidenceRaw, loadUiState, saveWifiEvidenceRaw, saveUiState } from "./attackLabPanelStorage";
import type { AttackLabPanelMode, AttackLabPanelNextStep } from "./attackLabPanelTypes";
import { useAttackLabExecutionState } from "./useAttackLabExecutionState";
import { useAttackLabTargetsState } from "./useAttackLabTargetsState";

export type { AttackLabPanelMode, AttackLabPanelNextStep };

export const useAttackLabPanelState = (params: {
  targetDevice?: DeviceDTO | null;
  availableDevices?: DeviceDTO[];
  availableRouters?: DeviceDTO[];
  identity?: HostIdentity | null;
  defaultScenarioId?: string | null;
  autoRunToken?: number;
}) => {
  const {
    targetDevice: propTargetDevice,
    availableDevices = [],
    availableRouters = [],
    identity = null,
    defaultScenarioId = null,
    autoRunToken: propAutoRunToken = 0,
  } = params;

  const { t, language } = useI18n();
  const runtime = useAttackLabRuntime();

  const rootRef = useRef<HTMLDivElement | null>(null);
  const [isNarrow, setIsNarrow] = useState(false);

  const persisted = loadUiState();

  const [mode, setMode] = useState<AttackLabPanelMode>(() => persisted?.mode ?? (propTargetDevice || defaultScenarioId ? "LAB" : "CUSTOM"));
  const [scenarioId, setScenarioId] = useState<string>(() => defaultScenarioId || persisted?.scenarioId || "");

  const [wifiEvidence, setWifiEvidence] = useState<ParsedWifiEvidence | null>(null);

  const [autoRunToken, setAutoRunToken] = useState<number>(0);
  const lastSeenPropAutoRunToken = useRef<number>(0);
  const bumpAutoRunToken = () => setAutoRunToken((tok) => tok + 1);

  // Responsive: narrow/wide con histeresis.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    if (typeof ResizeObserver === "undefined") return;

    const NARROW_AT = 720;
    const WIDE_AT = 760;

    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect?.width ?? 0;
      if (!w) return;
      setIsNarrow((prev) => {
        if (prev && w > WIDE_AT) return false;
        if (!prev && w < NARROW_AT) return true;
        return prev;
      });
    });

    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const scenarios = useMemo(() => getAttackLabScenarios(), []);
  const selectedScenario = useMemo(() => scenarios.find((s) => s.id === scenarioId) || null, [scenarios, scenarioId]);
  const scenarioById = useMemo(() => new Map(scenarios.map((s) => [s.id, s])), [scenarios]);

  const targets = useAttackLabTargetsState({
    selectedScenario,
    scenarioId,
    setScenarioId,
    setMode,
    bumpAutoRunToken,
    identity,
    propTargetDevice,
    availableDevices,
    availableRouters,
    persistedTargetIp: persisted?.targetIp ?? null,
  });

  // Persistimos UI state para que abrir/cerrar otros paneles no borre inputs.
  useEffect(() => {
    saveUiState({
      scenarioId: scenarioId || undefined,
      mode,
      targetIp: targets.localTarget?.ip || undefined,
    });
  }, [scenarioId, mode, targets.localTarget?.ip]);

  const onWifiEvidenceImported = (raw: string, parsed: ParsedWifiEvidence | null) => {
    saveWifiEvidenceRaw(raw);
    setWifiEvidence(parsed);
    emitSystemLog({
      source: "ATTACK_LAB",
      level: parsed ? "INFO" : "WARN",
      message: parsed ? `WiFi evidence import ok kind=${parsed.kind} ssid=${parsed.ssid ?? "-"}` : "WiFi evidence import failed (format unknown)",
    });
  };

  const onWifiEvidenceCleared = () => {
    clearWifiEvidenceRaw();
    setWifiEvidence(null);
    emitSystemLog({ source: "ATTACK_LAB", level: "INFO", message: "WiFi evidence cleared" });
  };

  // Auto-run explicitado por el contenedor (App/MainDockedLayout/DetachedPanelView).
  useEffect(() => {
    if (propAutoRunToken <= 0) return;
    if (lastSeenPropAutoRunToken.current === propAutoRunToken) return;
    lastSeenPropAutoRunToken.current = propAutoRunToken;
    bumpAutoRunToken();
  }, [propAutoRunToken]);

  const exec = useAttackLabExecutionState({
    t,
    language,
    runtime,
    identity,
    setMode,
    setScenarioId,
    selectedScenario: selectedScenario as AttackLabScenario | null,
    scenarioById,
    localTarget: targets.localTarget,
    autoRunToken,
    bumpAutoRunToken,
  });

  return {
    t,
    rootRef,
    isNarrow,
    mode,
    setMode,
    scenarios,
    scenarioId,
    setScenarioId,
    selectedScenario,
    localTarget: targets.localTarget,
    setLocalTarget: targets.setLocalTarget,
    routerTargetOptions: targets.routerTargetOptions,
    deviceTargetOptions: targets.deviceTargetOptions,
    wifiTargets: targets.wifiTargets,
    wifiEvidence,
    onWifiEvidenceImported,
    onWifiEvidenceCleared,
    runtime,
    displayRows: exec.displayRows,
    nextSteps: exec.nextSteps,
    statusText: exec.statusText,
    showConfirm: exec.showConfirm,
    macStatus: exec.macStatus,
    isCheckingOpsec: exec.isCheckingOpsec,
    onOpsecConfirm: exec.onOpsecConfirm,
    onOpsecCancel: exec.onOpsecCancel,
    handleRunLab: exec.handleRunLab,
    handleCancel: exec.handleCancel,
    selectRouterTarget: targets.selectRouterTarget,
    selectDeviceTarget: targets.selectDeviceTarget,
    selectWifiTarget: targets.selectWifiTarget,
  };
};
