// src/ui/features/attack_lab/panel/hooks/useAttackLabExecutionState.ts
// Hook de ejecucion del Attack Lab: run/cancel, opsec confirm, autorun y generacion de next-steps sin acoplar a JSX.

import { invoke } from "@tauri-apps/api/core";
import { useEffect, useMemo, useRef, useState } from "react";
import { windowingAdapter } from "../../../../../adapters/windowingAdapter";
import { emitSystemLog } from "../../../../utils/systemLogBus";
import type { DeviceDTO, HostIdentity } from "../../../../../shared/dtos/NetworkDTOs";
import type { AttackLabScenario } from "../../catalog/types";
import type { AttackLabPanelMode, AttackLabPanelNextStep } from "./attackLabPanelTypes";
import type { MacSecurityStatusDTO } from "../../../../components/shared/CyberConfirmModal";
import type { AttackLabRequestDTO } from "../../../../../shared/dtos/NetworkDTOs";
import type { AttackLabExitEvent } from "../../../../../shared/dtos/NetworkDTOs";

type AttackLabRuntimeLike = {
  state: {
    auditId: string | null;
    isRunning: boolean;
    rows: Array<{ ts: number; stream: "stdout" | "stderr"; line: string }>;
    lastExit: AttackLabExitEvent | null;
    error: string | null;
  };
  actions: {
    cancel: () => Promise<void>;
    pushLocalLog: (stream: "stdout" | "stderr", line: string) => void;
    startExternal: (req: AttackLabRequestDTO) => Promise<void>;
    startSimulated: (title: string, steps: any[]) => Promise<void>;
    startNative: (
      title: string,
      target: string,
      run: (ctx: { target: string; onLog: (stream: "stdout" | "stderr", line: string) => void; signal?: AbortSignal }) => Promise<void>,
    ) => Promise<void>;
  };
};

export const useAttackLabExecutionState = (params: {
  t: (key: any) => string;
  language: string;
  runtime: AttackLabRuntimeLike;
  identity: HostIdentity | null;
  setMode: (m: AttackLabPanelMode) => void;
  setScenarioId: (id: string) => void;
  selectedScenario: AttackLabScenario | null;
  scenarioById: Map<string, AttackLabScenario>;
  localTarget: DeviceDTO | null;
  autoRunToken: number;
  bumpAutoRunToken: () => void;
}) => {
  const { t, language, runtime, identity, setMode, setScenarioId, selectedScenario, scenarioById, localTarget, autoRunToken, bumpAutoRunToken } =
    params;

  const [showConfirm, setShowConfirm] = useState(false);
  const [macStatus, setMacStatus] = useState<MacSecurityStatusDTO | null>(null);
  const [isCheckingOpsec, setIsCheckingOpsec] = useState(false);

  const lastExecutedToken = useRef<number>(0);

  const executeNativeAttack = async (scenario: AttackLabScenario) => {
    const targetIp = localTarget?.ip || "unknown";

    emitSystemLog({
      source: "ATTACK_LAB",
      level: "INFO",
      message: `Inicio protocolo '${scenario.id}' target=${targetIp}`,
    });

    try {
      if (!scenario.executeNative) return;
      await runtime.actions.startNative(scenario.title, targetIp, async ({ target, onLog, signal }) => {
        onLog("stdout", `🚀 ${t("attackLab.native.startingProtocolPrefix")}: ${scenario.title}`);
        await scenario.executeNative?.({
          target,
          signal,
          onLog: (stream, line) => {
            if (line.includes("🧪 TRACE")) {
              emitSystemLog({
                source: "WIFI_NATIVE",
                level: stream === "stderr" ? "ERROR" : "DEBUG",
                message: line,
              });
              return;
            }

            onLog(stream, line);

            if (line.includes("PREDATOR HIT") || line.includes("ATAQUE ABORTADO") || line.includes("DICCIONARIO AGOTADO")) {
              emitSystemLog({
                source: "WIFI_NATIVE",
                level: stream === "stderr" ? "WARN" : "INFO",
                message: line,
              });
            }
          },
        });
      });
    } catch (e) {
      runtime.actions.pushLocalLog("stderr", `❌ ${t("attackLab.native.criticalErrorPrefix")}: ${e}`);
    }
  };

  const handleRunLab = async () => {
    if (!selectedScenario || runtime.state.isRunning) return;

    if (selectedScenario.mode === "native" && selectedScenario.category === "WIFI" && selectedScenario.requiresOpsecConfirm !== false) {
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
      await executeNativeAttack(selectedScenario);
      return;
    }

    if (selectedScenario.mode === "simulated") {
      if (!localTarget) return;
      const steps = selectedScenario.simulate?.({ device: localTarget, identity }) || [];
      await runtime.actions.startSimulated(selectedScenario.title, steps);
      return;
    }

    if (!localTarget) return;
    const support = selectedScenario.isSupported?.({ device: localTarget, identity }) || { supported: true };
    if (!support.supported) return;
    const req = selectedScenario.buildRequest?.({ device: localTarget, identity });
    if (!req) return;

    const baseEnv = req.env ?? [];
    const nextEnv = [...baseEnv, { key: "NETSENTINEL_UI_LANG", value: language }];
    await runtime.actions.startExternal({ ...req, env: nextEnv });
  };

  // Auto-run: solo para escenarios NO native.
  useEffect(() => {
    if (autoRunToken === 0) return;
    if (autoRunToken === lastExecutedToken.current) return;
    if (!selectedScenario || runtime.state.isRunning || !localTarget) return;

    if (selectedScenario.mode === "native") {
      lastExecutedToken.current = autoRunToken;
      runtime.actions.pushLocalLog("stdout", `🛑 ${t("attackLab.native.autoRunBlocked")}`);
      emitSystemLog({
        source: "ATTACK_LAB",
        level: "WARN",
        message: `Auto-run bloqueado para escenario native id='${selectedScenario.id}' (requiere confirmacion manual).`,
      });
      return;
    }

    lastExecutedToken.current = autoRunToken;
    void handleRunLab();
  }, [autoRunToken, selectedScenario, runtime.state.isRunning, localTarget]);

  const handleCancel = async () => {
    await runtime.actions.cancel();
  };

  const displayRows = runtime.state.rows;
  const canRunNext = !runtime.state.isRunning && Boolean(localTarget);

  const nextSteps: AttackLabPanelNextStep[] = useMemo(() => {
    if (!selectedScenario?.nextScenarioIds || selectedScenario.nextScenarioIds.length === 0) return [];
    if (displayRows.length === 0) return [];
    return selectedScenario.nextScenarioIds
      .map((id) => scenarioById.get(id))
      .filter((s): s is NonNullable<typeof s> => Boolean(s))
      .map((s) => ({
        id: s.id,
        title: s.title,
        disabled: !canRunNext,
        onRun: () => {
          setMode("LAB");
          setScenarioId(s.id);
          bumpAutoRunToken();
          void windowingAdapter.emitAttackLabContext({ targetDevice: localTarget, scenarioId: s.id, autoRun: false });
        },
      }));
  }, [selectedScenario?.id, selectedScenario?.nextScenarioIds, scenarioById, displayRows.length, canRunNext, localTarget]);

  const statusText = (() => {
    const s = runtime.state;
    if (!s.auditId) return t("attackLab.runtime.summary.idle");
    if (s.isRunning) return `${t("attackLab.runtime.summary.running")}: ${s.auditId}`;
    if (s.lastExit) return `${t("attackLab.runtime.summary.finished")}: ${s.auditId} (exit=${s.lastExit.exitCode ?? "?"}, ok=${s.lastExit.success})`;
    return `${t("attackLab.runtime.summary.ready")}: ${s.auditId}`;
  })();

  const onOpsecConfirm = () => {
    if (!selectedScenario) return;
    setShowConfirm(false);
    emitSystemLog({ source: "OPSEC", level: "INFO", message: "Operador autorizo ejecucion nativa WiFi" });
    void executeNativeAttack(selectedScenario);
  };

  const onOpsecCancel = () => {
    setShowConfirm(false);
    emitSystemLog({ source: "OPSEC", level: "WARN", message: "Operador cancelo ejecucion nativa WiFi" });
  };

  return {
    handleRunLab,
    handleCancel,
    displayRows,
    nextSteps,
    statusText,
    showConfirm,
    macStatus,
    isCheckingOpsec,
    onOpsecConfirm,
    onOpsecCancel,
  };
};
