// src/ui/hooks/modules/attack_lab/runtime/attackLabRuntimeStore.ts
// Store singleton del runtime de Attack Lab: persistencia parcial + suscripcion + listeners de eventos (sin logica de runners).

import type { AttackLabExitEvent, AttackLabLogEvent } from "../../../../../shared/dtos/NetworkDTOs";
import type { AttackLabLogRow, AttackLabRuntimeState } from "./attackLabRuntimeTypes";

export type AttackLabAdapterEvents = {
  onLog: (cb: (event: AttackLabLogEvent) => void) => Promise<() => void>;
  onExit: (cb: (event: AttackLabExitEvent) => void) => Promise<() => void>;
};

const STORAGE_KEY = "netsentinel.attackLab.runtime.v1";
const MAX_ROWS = 2000;
const PERSIST_ROWS = 400;

const clampRows = (rows: AttackLabLogRow[], max: number) => {
  if (rows.length <= max) return rows;
  return rows.slice(rows.length - max);
};

function safeLoadPersisted(storage: Storage): Partial<AttackLabRuntimeState> | null {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AttackLabRuntimeState>;
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function createAttackLabRuntimeStore(params: {
  adapter: AttackLabAdapterEvents;
  storage?: Storage;
  now?: () => number;
  setTimeoutFn?: typeof window.setTimeout;
  clearTimeoutFn?: typeof window.clearTimeout;
}) {
  const storage = params.storage ?? localStorage;
  const now = params.now ?? (() => Date.now());
  const setTimeoutFn = params.setTimeoutFn ?? window.setTimeout.bind(window);
  const clearTimeoutFn = params.clearTimeoutFn ?? window.clearTimeout.bind(window);

  let state: AttackLabRuntimeState = {
    auditId: null,
    isRunning: false,
    runKind: null,
    rows: [],
    lastExit: null,
    error: null,
  };

  let unlistenLog: (() => void) | null = null;
  let unlistenExit: (() => void) | null = null;
  let isInit = false;

  const listeners = new Set<() => void>();

  let persistTimer: number | null = null;
  const schedulePersist = () => {
    if (persistTimer) return;
    persistTimer = setTimeoutFn(() => {
      persistTimer = null;
      try {
        const snapshot = {
          ...state,
          rows: state.rows.slice(Math.max(0, state.rows.length - PERSIST_ROWS)),
        };
        storage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
      } catch {
        // ignore
      }
    }, 250) as unknown as number;
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

  const getState = () => state;

  const subscribe = (cb: () => void) => {
    listeners.add(cb);
    return () => listeners.delete(cb);
  };

  async function initOnce() {
    if (isInit) return;
    isInit = true;

    const persisted = safeLoadPersisted(storage);
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
    // En tests/web sin Tauri, `listenEvent()` puede fallar: degradamos a "runtime local" sin streaming.
    try {
      unlistenLog = await params.adapter.onLog((evt) => {
        const cur = getState();
        if (!cur.auditId) return;
        if (evt.auditId !== cur.auditId) return;
        appendRow({ ts: now(), stream: evt.stream, line: evt.line });
      });
    } catch {
      unlistenLog = null;
    }

    try {
      unlistenExit = await params.adapter.onExit((evt) => {
        const cur = getState();
        if (!cur.auditId) return;
        if (evt.auditId !== cur.auditId) return;
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

  const clearPersisted = () => {
    try {
      storage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  const resetForTests = () => {
    if (persistTimer) {
      clearTimeoutFn(persistTimer as any);
      persistTimer = null;
    }

    if (unlistenLog) unlistenLog();
    if (unlistenExit) unlistenExit();
    unlistenLog = null;
    unlistenExit = null;
    isInit = false;

    state = { auditId: null, isRunning: false, runKind: null, rows: [], lastExit: null, error: null };
    clearPersisted();
  };

  return {
    initOnce,
    subscribe,
    getState,
    setState,
    appendRow,
    resetForTests,
    clearPersisted,
  };
}

