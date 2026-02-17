// src/ui/hooks/modules/attack_lab/runtime/attackLabRuntimeWiring.ts
// Wiring del runtime Attack Lab: define interfaces minimas para store/acciones y crea el singleton con attackLabAdapter.

import { attackLabAdapter } from "../../../../../adapters/attackLabAdapter";
import type { AttackLabRequestDTO } from "../../../../../shared/dtos/NetworkDTOs";
import { createAttackLabRuntimeStore } from "./attackLabRuntimeStore";

export type AttackLabAdapterCommands = {
  start: (request: AttackLabRequestDTO) => Promise<string>;
  cancel: (auditId: string) => Promise<void>;
};

export type ReturnTypeCreateAttackLabRuntimeStore = ReturnType<typeof createAttackLabRuntimeStore>;

export const attackLabRuntimeStore = createAttackLabRuntimeStore({
  adapter: attackLabAdapter,
});

export const attackLabRuntimeAdapter: AttackLabAdapterCommands = attackLabAdapter;

