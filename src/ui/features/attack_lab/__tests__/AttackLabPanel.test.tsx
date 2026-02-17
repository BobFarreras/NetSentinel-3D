// src/ui/features/attack_lab/__tests__/AttackLabPanel.test.tsx
// Tests del panel Attack Lab: valida auto-ejecucion en modo LAB con target + escenario por defecto.

import { describe, expect, it, vi } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { AttackLabPanel } from "../panel/AttackLabPanel";
import { I18nProvider } from "../../../i18n";

const startSimulated = vi.fn(async () => {});

vi.mock("../../../hooks/modules/attack_lab/useAttackLabRuntime", () => ({
  useAttackLabRuntime: () => ({
    state: {
      auditId: null,
      isRunning: false,
      runKind: null,
      rows: [],
      lastExit: null,
      error: null,
    },
    actions: {
      startExternal: vi.fn(async () => {}),
      startSimulated,
      startNative: vi.fn(async () => {}),
      cancel: vi.fn(async () => {}),
      clear: vi.fn(),
      pushLocalLog: vi.fn(),
    },
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
      <I18nProvider>
        <AttackLabPanel
          onClose={() => {}}
          targetDevice={{ ip: "192.168.1.10", mac: "aa:bb", vendor: "ACME" } as any}
          identity={null as any}
          defaultScenarioId="sim-1"
          autoRunToken={1}
        />
      </I18nProvider>
    );

    await waitFor(() => {
      expect(startSimulated).toHaveBeenCalledTimes(1);
    });
  });
});
