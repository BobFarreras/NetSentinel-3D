// src/ui/features/attack_lab/hooks/useAttackLab.ts
// Wrapper del runtime persistente del Attack Lab para mantener imports estables en la feature.

import type { AttackLabRequestDTO } from "../../../../shared/dtos/NetworkDTOs";
import type { SimStep } from "../catalog/types";
import { useAttackLabRuntime } from "../../../hooks/modules/attack_lab/useAttackLabRuntime";

export const useAttackLab = () => {
  const { state, actions } = useAttackLabRuntime();

  return {
    auditId: state.auditId,
    isRunning: state.isRunning,
    rows: state.rows,
    lastExit: state.lastExit,
    error: state.error,
    // Se mantiene por compatibilidad; el panel ahora lo forma con i18n si lo necesita.
    summary: state.auditId ? `${state.runKind ?? "run"}:${state.auditId}` : "idle",
    start: (request: AttackLabRequestDTO) => actions.startExternal(request),
    startSimulated: (label: string, steps: SimStep[]) => actions.startSimulated(label, steps),
    startNative: (label: string, target: string, run: (ctx: any) => Promise<void>) =>
      actions.startNative(label, target, run as any),
    cancel: () => actions.cancel(),
    clear: () => actions.clear(),
  };
};
