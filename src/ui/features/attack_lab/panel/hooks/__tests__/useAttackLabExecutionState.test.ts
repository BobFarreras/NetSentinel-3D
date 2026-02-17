// src/ui/features/attack_lab/panel/hooks/__tests__/useAttackLabExecutionState.test.ts
// Tests del hook de ejecucion del Attack Lab: auto-run debe bloquear modo native y generar log local.

import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  emitAttackLabContext: vi.fn(),
}));

vi.mock("../../../../../../adapters/windowingAdapter", () => ({
  windowingAdapter: mocks,
}));

import { useAttackLabExecutionState } from "../useAttackLabExecutionState";

describe("useAttackLabExecutionState", () => {
  it("debe bloquear auto-run en escenarios native", async () => {
    const runtime = {
      state: {
        auditId: "audit_x",
        isRunning: false,
        rows: [],
        lastExit: null,
        error: null,
      },
      actions: {
        cancel: vi.fn(async () => undefined),
        pushLocalLog: vi.fn(),
        startExternal: vi.fn(async () => undefined),
        startSimulated: vi.fn(async () => undefined),
        startNative: vi.fn(async () => undefined),
      },
    };

    renderHook(() =>
      useAttackLabExecutionState({
        t: (k: any) => String(k),
        language: "ca",
        runtime,
        identity: null,
        setMode: vi.fn(),
        setScenarioId: vi.fn(),
        selectedScenario: { id: "wifi_dictionary", mode: "native" } as any,
        scenarioById: new Map(),
        localTarget: { ip: "192.168.1.1" } as any,
        autoRunToken: 1,
        bumpAutoRunToken: vi.fn(),
      })
    );

    await waitFor(() => {
      expect(runtime.actions.pushLocalLog).toHaveBeenCalled();
    });

    expect(runtime.actions.startNative).not.toHaveBeenCalled();
  });
});

