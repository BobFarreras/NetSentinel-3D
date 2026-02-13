// src/ui/features/attack_lab/__tests__/AttackLabPanel.test.tsx
// Tests del panel Attack Lab: valida auto-ejecucion en modo LAB con target + escenario por defecto.

import { describe, expect, it, vi } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { AttackLabPanel } from "../panel/AttackLabPanel";

const startSimulated = vi.fn(async () => {});
const start = vi.fn(async () => "audit-id");
const cancel = vi.fn(async () => {});
const clear = vi.fn();

vi.mock("../hooks/useAttackLab", () => ({
  useAttackLab: () => ({
    auditId: null,
    isRunning: false,
    rows: [],
    lastExit: null,
    error: null,
    summary: "idle",
    startSimulated,
    start,
    cancel,
    clear,
  }),
}));

vi.mock("../catalog/attackLabScenarios", () => ({
  getAttackLabScenarios: () => [
    {
      id: "sim-1",
      title: "Simulado: baseline",
      description: "Escenario simulado para tests",
      mode: "simulated",
      simulate: () => [{ delayMs: 0, stream: "stdout", line: "ok" }],
    },
  ],
}));

describe("AttackLabPanel", () => {
  it("debe auto-ejecutar el escenario LAB cuando autoRunToken cambia y hay target + defaultScenarioId", async () => {
    render(
      <AttackLabPanel
        onClose={() => {}}
        targetDevice={{ ip: "192.168.1.10", mac: "aa:bb", vendor: "ACME" } as any}
        identity={null as any}
        defaultScenarioId="sim-1"
        autoRunToken={1}
      />
    );

    await waitFor(() => {
      expect(startSimulated).toHaveBeenCalledTimes(1);
    });
  });
});
