// src/ui/hooks/modules/attack_lab/useAttackLabRuntime.ts
// Runtime persistente del Attack Lab: hook thin wrapper sobre store singleton + acciones (external/simulated/native).

import { useMemo, useSyncExternalStore } from "react";
import { attackLabRuntimeAdapter, attackLabRuntimeStore } from "./runtime/attackLabRuntimeWiring";
import { createAttackLabRuntimeActions, resetAttackLabRuntimeActionsForTests } from "./runtime/attackLabRuntimeActions";

// Re-export de tipos publicos (compatibilidad).
export type { AttackLabLogRow, AttackLabRunKind } from "./runtime/attackLabRuntimeTypes";

export function __resetAttackLabRuntimeForTests() {
  resetAttackLabRuntimeActionsForTests();
  attackLabRuntimeStore.resetForTests();
}

export function useAttackLabRuntime() {
  // Inicializa side-effects una vez (lazily) al primer subscriber.
  void attackLabRuntimeStore.initOnce();

  const snapshot = useSyncExternalStore(
    (cb) => attackLabRuntimeStore.subscribe(cb),
    () => attackLabRuntimeStore.getState(),
    () => attackLabRuntimeStore.getState(),
  );

  const actions = useMemo(() => {
    return createAttackLabRuntimeActions({
      store: attackLabRuntimeStore,
      adapter: attackLabRuntimeAdapter,
    });
  }, []);

  return { state: snapshot, actions };
}

