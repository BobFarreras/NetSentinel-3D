// src/ui/hooks/modules/attack_lab/runtime/attackLabRuntimeTypes.ts
// Tipos del runtime de Attack Lab: estado global persistente, filas de log y runner nativo.

import type { AttackLabExitEvent } from "../../../../../shared/dtos/NetworkDTOs";

export type AttackLabLogRow = {
  ts: number;
  stream: "stdout" | "stderr";
  line: string;
};

export type AttackLabRunKind = "external" | "simulated" | "native" | null;

export type AttackLabRuntimeState = {
  auditId: string | null;
  isRunning: boolean;
  runKind: AttackLabRunKind;
  rows: AttackLabLogRow[];
  lastExit: AttackLabExitEvent | null;
  error: string | null;
};

export type NativeRun = (ctx: {
  target: string;
  onLog: (stream: "stdout" | "stderr", line: string) => void;
  signal?: AbortSignal;
}) => Promise<void>;

