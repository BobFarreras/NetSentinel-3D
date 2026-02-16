// src/ui/hooks/modules/attack_lab/useAttackLabRuntime.ts
// Runtime persistente del Attack Lab: mantiene ejecuciones/logs aunque el panel se cierre y reabra (shared store).

import { useMemo, useSyncExternalStore } from "react";
import type { AttackLabExitEvent, AttackLabRequestDTO } from "../../../../shared/dtos/NetworkDTOs";
import { attackLabAdapter } from "../../../../adapters/attackLabAdapter";
import type { SimStep } from "../../../features/attack_lab/catalog/attackLabScenarios";

export type AttackLabLogRow = {
  ts: number;
  stream: "stdout" | "stderr";
  line: string;
};

export type AttackLabRunKind = "external" | "simulated" | "native" | null;

type AttackLabRuntimeState = {
  auditId: string | null;
  isRunning: boolean;
  runKind: AttackLabRunKind;
  rows: AttackLabLogRow[];
  lastExit: AttackLabExitEvent | null;
  error: string | null;
};

type NativeRun = (ctx: {
  target: string;
  onLog: (stream: "stdout" | "stderr", line: string) => void;
  signal?: AbortSignal;
}) => Promise<void>;

const STORAGE_KEY = "netsentinel.attackLab.runtime.v1";
const MAX_ROWS = 2000;
const PERSIST_ROWS = 400;

const clampRows = (rows: AttackLabLogRow[], max: number) => {
  if (rows.length <= max) return rows;
  return rows.slice(rows.length - max);
};

let state: AttackLabRuntimeState = {
  auditId: null,
  isRunning: false,
  runKind: null,
  rows: [],
  lastExit: null,
  error: null,
};

let simTimers: number[] = [];
let nativeAbort: AbortController | null = null;
let unlistenLog: (() => void) | null = null;
let unlistenExit: (() => void) | null = null;
let isInit = false;

const listeners = new Set<() => void>();

let persistTimer: number | null = null;
const schedulePersist = () => {
  if (persistTimer) return;
  persistTimer = window.setTimeout(() => {
    persistTimer = null;
    try {
      const snapshot = {
        ...state,
        rows: state.rows.slice(Math.max(0, state.rows.length - PERSIST_ROWS)),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
    } catch {
      // ignore
    }
  }, 250);
};

const emit = () => {
  schedulePersist();
  listeners.forEach((l) => l());
};

const setState = (next: Partial<AttackLabRuntimeState>) => {
  state = { ...state, ...next };
  emit();
};

const appendRow = (row: AttackLabLogRow) => {
  state = { ...state, rows: clampRows([...state.rows, row], MAX_ROWS) };
  emit();
};

function safeLoadPersisted(): Partial<AttackLabRuntimeState> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AttackLabRuntimeState>;
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

async function initOnce() {
  if (isInit) return;
  isInit = true;

  const persisted = safeLoadPersisted();
  if (persisted) {
    state = {
      ...state,
      ...persisted,
      // Nunca arrancamos como running por persistencia: si estaba en curso, la UI debe reflejarlo por eventos vivos.
      // Evita "stuck running" tras refresh/relanzar.
      isRunning: false,
      rows: Array.isArray(persisted.rows) ? persisted.rows : [],
    };
  }

  // Listener global: captura logs aunque el panel se desmonte.
  // En tests/web sin Tauri, `listenEvent()` puede fallar: lo degradamos a "runtime local" sin streaming.
  try {
    unlistenLog = await attackLabAdapter.onLog((evt) => {
      if (!state.auditId) return;
      if (evt.auditId !== state.auditId) return;
      appendRow({ ts: Date.now(), stream: evt.stream, line: evt.line });
    });
  } catch {
    unlistenLog = null;
  }

  try {
    unlistenExit = await attackLabAdapter.onExit((evt) => {
      if (!state.auditId) return;
      if (evt.auditId !== state.auditId) return;
      setState({
        isRunning: false,
        lastExit: evt,
        error: evt.success ? null : evt.error || null,
      });
    });
  } catch {
    unlistenExit = null;
  }
}

function stopSimulatedTimers() {
  simTimers.forEach((t) => window.clearTimeout(t));
  simTimers = [];
}

export function __resetAttackLabRuntimeForTests() {
  stopSimulatedTimers();
  nativeAbort?.abort();
  nativeAbort = null;
  if (unlistenLog) unlistenLog();
  if (unlistenExit) unlistenExit();
  unlistenLog = null;
  unlistenExit = null;
  isInit = false;
  state = { auditId: null, isRunning: false, runKind: null, rows: [], lastExit: null, error: null };
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function useAttackLabRuntime() {
  // Inicializa side-effects una vez (lazily) al primer subscriber.
  void initOnce();

  const snapshot = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => state,
    () => state
  );

  const actions = useMemo(() => {
    return {
      pushLocalLog: (stream: "stdout" | "stderr", line: string) => {
        appendRow({ ts: Date.now(), stream, line });
      },
      startExternal: async (request: AttackLabRequestDTO) => {
        await initOnce();
        stopSimulatedTimers();
        nativeAbort?.abort();
        nativeAbort = null;

        setState({ auditId: null, isRunning: true, runKind: "external", rows: [], lastExit: null, error: null });
        try {
          const id = await attackLabAdapter.start(request);
          setState({ auditId: id, isRunning: true, runKind: "external" });
          appendRow({ ts: Date.now(), stream: "stdout", line: `START auditId=${id}` });
        } catch (e) {
          setState({ isRunning: false, error: e instanceof Error ? e.message : String(e) });
        }
      },

      startSimulated: async (label: string, steps: SimStep[]) => {
        await initOnce();
        stopSimulatedTimers();
        nativeAbort?.abort();
        nativeAbort = null;

        const id = `sim_${Date.now()}`;
        setState({ auditId: id, isRunning: true, runKind: "simulated", rows: [], lastExit: null, error: null });
        appendRow({ ts: Date.now(), stream: "stdout", line: `SIM START: ${label}` });

        const activeId = id;
        steps.forEach((s) => {
          const timer = window.setTimeout(() => {
            if (state.auditId !== activeId) return;
            if (!state.isRunning) return;
            appendRow({ ts: Date.now(), stream: s.stream, line: s.line });
          }, s.delayMs);
          simTimers.push(timer);
        });

        const lastDelay = Math.max(0, ...steps.map((s) => s.delayMs));
        const exitTimer = window.setTimeout(() => {
          if (state.auditId !== activeId) return;
          setState({
            isRunning: false,
            lastExit: { auditId: activeId, success: true, exitCode: 0, durationMs: lastDelay },
          });
        }, lastDelay + 150);
        simTimers.push(exitTimer);
      },

      startNative: async (label: string, target: string, run: NativeRun) => {
        await initOnce();
        stopSimulatedTimers();
        nativeAbort?.abort();
        nativeAbort = new AbortController();

        const id = `native_${Date.now()}`;
        setState({ auditId: id, isRunning: true, runKind: "native", rows: [], lastExit: null, error: null });
        appendRow({ ts: Date.now(), stream: "stdout", line: `NATIVE START: ${label}` });

        try {
          await run({
            target,
            signal: nativeAbort.signal,
            onLog: (stream, line) => appendRow({ ts: Date.now(), stream, line }),
          });
          setState({
            isRunning: false,
            lastExit: { auditId: id, success: true, exitCode: 0, durationMs: 0 },
          });
        } catch (e) {
          // AbortController lanza DOMException en algunos navegadores; lo tratamos como cancelación.
          const msg = e instanceof Error ? e.message : String(e);
          const aborted = nativeAbort?.signal.aborted === true;
          setState({
            isRunning: false,
            lastExit: { auditId: id, success: false, exitCode: aborted ? 130 : 1, durationMs: 0, error: aborted ? "canceled" : msg },
            error: aborted ? null : msg,
          });
        } finally {
          nativeAbort = null;
        }
      },

      cancel: async () => {
        await initOnce();
        if (!state.auditId) return;

        if (state.runKind === "simulated") {
          stopSimulatedTimers();
          setState({
            isRunning: false,
            lastExit: { auditId: state.auditId, success: false, exitCode: 130, durationMs: 0, error: "canceled" },
          });
          return;
        }

        if (state.runKind === "native") {
          nativeAbort?.abort();
          setState({
            isRunning: false,
            lastExit: { auditId: state.auditId, success: false, exitCode: 130, durationMs: 0, error: "canceled" },
          });
          return;
        }

        try {
          await attackLabAdapter.cancel(state.auditId);
          appendRow({ ts: Date.now(), stream: "stderr", line: "CANCEL requested" });
        } catch (e) {
          setState({ error: e instanceof Error ? e.message : String(e) });
        }
      },

      clear: () => {
        stopSimulatedTimers();
        nativeAbort?.abort();
        nativeAbort = null;
        setState({ rows: [], lastExit: null, error: null, auditId: null, isRunning: false, runKind: null });
      },
    };
  }, []);

  return { state: snapshot, actions };
}
