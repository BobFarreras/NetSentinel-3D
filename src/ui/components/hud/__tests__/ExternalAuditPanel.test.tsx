import { describe, expect, it, vi } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { ExternalAuditPanel } from "../../panels/external_audit/ExternalAuditPanel";

const startSimulated = vi.fn(async () => {});
const start = vi.fn(async () => "audit-id");
const cancel = vi.fn(async () => {});
const clear = vi.fn();

vi.mock("../../../hooks/modules/ui/useExternalAudit", () => ({
  useExternalAudit: () => ({
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

vi.mock("../../../../core/logic/externalAuditScenarios", () => ({
  getExternalAuditScenarios: () => [
    {
      id: "sim-1",
      title: "Simulado: baseline",
      description: "Escenario simulado para tests",
      mode: "simulated",
      simulate: () => [{ delayMs: 0, stream: "stdout", line: "ok" }],
    },
  ],
}));

describe("ExternalAuditPanel", () => {
  it("debe auto-ejecutar el escenario LAB cuando autoRun=true y hay target + defaultScenarioId", async () => {
    render(
      <ExternalAuditPanel
        onClose={() => {}}
        targetDevice={{ ip: "192.168.1.10", mac: "aa:bb", vendor: "ACME" } as any}
        identity={null as any}
        defaultScenarioId="sim-1"
        autoRun={true}
      />
    );

    await waitFor(() => {
      expect(startSimulated).toHaveBeenCalledTimes(1);
    });
  });
});
