// src/ui/hooks/modules/attack_lab/runtime/attackLabRuntimeActions.ts
// Acciones del runtime Attack Lab (external/simulated/native): timers, AbortController y cancel/clear usando el store.

import type { AttackLabRequestDTO } from "../../../../../shared/dtos/NetworkDTOs";
import type { SimStep } from "../../../../features/attack_lab/catalog/types";
import type { NativeRun } from "./attackLabRuntimeTypes";
import type { AttackLabAdapterCommands } from "./attackLabRuntimeWiring";
import type { ReturnTypeCreateAttackLabRuntimeStore } from "./attackLabRuntimeWiring";

let simTimers: number[] = [];
let nativeAbort: AbortController | null = null;

const stopSimulatedTimers = () => {
  simTimers.forEach((t) => window.clearTimeout(t));
  simTimers = [];
};

export const resetAttackLabRuntimeActionsForTests = () => {
  stopSimulatedTimers();
  nativeAbort?.abort();
  nativeAbort = null;
};

export function createAttackLabRuntimeActions(params: {
  store: ReturnTypeCreateAttackLabRuntimeStore;
  adapter: AttackLabAdapterCommands;
  now?: () => number;
}) {
  const now = params.now ?? (() => Date.now());

  return {
    pushLocalLog: (stream: "stdout" | "stderr", line: string) => {
      params.store.appendRow({ ts: now(), stream, line });
    },

    startExternal: async (request: AttackLabRequestDTO) => {
      await params.store.initOnce();
      stopSimulatedTimers();
      nativeAbort?.abort();
      nativeAbort = null;

      params.store.setState({ auditId: null, isRunning: true, runKind: "external", rows: [], lastExit: null, error: null });
      try {
        const id = await params.adapter.start(request);
        params.store.setState({ auditId: id, isRunning: true, runKind: "external" });
        params.store.appendRow({ ts: now(), stream: "stdout", line: `START auditId=${id}` });
      } catch (e) {
        params.store.setState({ isRunning: false, error: e instanceof Error ? e.message : String(e) });
      }
    },

    startSimulated: async (label: string, steps: SimStep[]) => {
      await params.store.initOnce();
      stopSimulatedTimers();
      nativeAbort?.abort();
      nativeAbort = null;

      const id = `sim_${now()}`;
      params.store.setState({ auditId: id, isRunning: true, runKind: "simulated", rows: [], lastExit: null, error: null });
      params.store.appendRow({ ts: now(), stream: "stdout", line: `SIM START: ${label}` });

      const activeId = id;
      steps.forEach((s) => {
        const timer = window.setTimeout(() => {
          const cur = params.store.getState();
          if (cur.auditId !== activeId) return;
          if (!cur.isRunning) return;
          params.store.appendRow({ ts: now(), stream: s.stream, line: s.line });
        }, s.delayMs);
        simTimers.push(timer);
      });

      const lastDelay = Math.max(0, ...steps.map((s) => s.delayMs));
      const exitTimer = window.setTimeout(() => {
        const cur = params.store.getState();
        if (cur.auditId !== activeId) return;
        params.store.setState({
          isRunning: false,
          lastExit: { auditId: activeId, success: true, exitCode: 0, durationMs: lastDelay },
        });
      }, lastDelay + 150);
      simTimers.push(exitTimer);
    },

    startNative: async (label: string, target: string, run: NativeRun) => {
      await params.store.initOnce();
      stopSimulatedTimers();
      nativeAbort?.abort();
      nativeAbort = new AbortController();

      const id = `native_${now()}`;
      params.store.setState({ auditId: id, isRunning: true, runKind: "native", rows: [], lastExit: null, error: null });
      params.store.appendRow({ ts: now(), stream: "stdout", line: `NATIVE START: ${label}` });

      try {
        await run({
          target,
          signal: nativeAbort.signal,
          onLog: (stream, line) => params.store.appendRow({ ts: now(), stream, line }),
        });
        params.store.setState({
          isRunning: false,
          lastExit: { auditId: id, success: true, exitCode: 0, durationMs: 0 },
        });
      } catch (e) {
        // AbortController lanza DOMException en algunos navegadores; lo tratamos como cancelación.
        const msg = e instanceof Error ? e.message : String(e);
        const aborted = nativeAbort?.signal.aborted === true;
        params.store.setState({
          isRunning: false,
          lastExit: { auditId: id, success: false, exitCode: aborted ? 130 : 1, durationMs: 0, error: aborted ? "canceled" : msg },
          error: aborted ? null : msg,
        });
      } finally {
        nativeAbort = null;
      }
    },

    cancel: async () => {
      await params.store.initOnce();
      const cur = params.store.getState();
      if (!cur.auditId) return;

      if (cur.runKind === "simulated") {
        stopSimulatedTimers();
        params.store.setState({
          isRunning: false,
          lastExit: { auditId: cur.auditId, success: false, exitCode: 130, durationMs: 0, error: "canceled" },
        });
        return;
      }

      if (cur.runKind === "native") {
        nativeAbort?.abort();
        params.store.setState({
          isRunning: false,
          lastExit: { auditId: cur.auditId, success: false, exitCode: 130, durationMs: 0, error: "canceled" },
        });
        return;
      }

      try {
        await params.adapter.cancel(cur.auditId);
        params.store.appendRow({ ts: now(), stream: "stderr", line: "CANCEL requested" });
      } catch (e) {
        params.store.setState({ error: e instanceof Error ? e.message : String(e) });
      }
    },

    clear: () => {
      stopSimulatedTimers();
      nativeAbort?.abort();
      nativeAbort = null;
      params.store.setState({ rows: [], lastExit: null, error: null, auditId: null, isRunning: false, runKind: null });
    },
  };
}

