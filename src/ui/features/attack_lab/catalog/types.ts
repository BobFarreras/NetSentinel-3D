// src/ui/features/attack_lab/catalog/types.ts
// Tipos del catalogo de escenarios Attack Lab: contratos internos (external/simulated/native) usados por UI y runtime.

import type { AttackLabRequestDTO, DeviceDTO, HostIdentity } from "../../../../shared/dtos/NetworkDTOs";

export type ScenarioMode = "external" | "simulated" | "native";

export type ScenarioSupport = {
  supported: boolean;
  reason?: string;
};

export type SimStep = {
  delayMs: number;
  stream: "stdout" | "stderr";
  line: string;
};

// Contexto para ejecucion nativa + señal de abortar (para cancelación cooperativa).
export type NativeExecutionContext = {
  target: string;
  onLog: (stream: "stdout" | "stderr", line: string) => void;
  signal?: AbortSignal;
};

export type AttackLabScenario = {
  id: string;
  title: string;
  description: string;
  mode: ScenarioMode;
  category: "ROUTER" | "DEVICE" | "WIFI" | "IOT" | "EDU";

  // CLI (Mode External)
  buildRequest?: (ctx: { device: DeviceDTO; identity: HostIdentity | null }) => AttackLabRequestDTO;

  // Simulation (Mode Simulated)
  simulate?: (ctx: { device: DeviceDTO; identity: HostIdentity | null }) => SimStep[];

  // RUST (Mode Native)
  executeNative?: (ctx: NativeExecutionContext) => Promise<void>;

  isSupported?: (ctx: { device: DeviceDTO; identity: HostIdentity | null }) => ScenarioSupport;
};

