// src/ui/features/attack_lab/__tests__/useAttackLabDetachedSync.test.ts
// Tests del sync desacoplado del Attack Lab: valida recepcion de contexto y token monotono de autorun.

import { renderHook, act } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  listenAttackLabContext: vi.fn(),
  emitAttackLabContext: vi.fn(),
  setAttackLabDetachedBootstrap: vi.fn(),
  consumeAttackLabDetachedBootstrap: vi.fn(() => null),
}));

vi.mock("../../../../adapters/windowingAdapter", () => ({
  windowingAdapter: mocks,
}));

import { useAttackLabDetachedSync } from "../hooks/useAttackLabDetachedSync";

describe("useAttackLabDetachedSync", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debe actualizar target/escenario al recibir contexto", async () => {
    let cb: ((payload: { targetDevice: { ip: string; mac: string; vendor: string } | null; scenarioId?: string; autoRun?: boolean }) => void) | null = null;
    mocks.listenAttackLabContext.mockImplementation(async (handler) => {
      cb = handler;
      return () => undefined;
    });

    const { result } = renderHook(() => useAttackLabDetachedSync());

    act(() => {
      cb?.({
        targetDevice: { ip: "192.168.1.40", mac: "AA:BB", vendor: "Node" },
        scenarioId: "device_http_headers",
        autoRun: true,
      });
    });

    expect(result.current.detachedAttackLabTarget?.ip).toBe("192.168.1.40");
    expect(result.current.detachedAttackLabScenarioId).toBe("device_http_headers");
    expect(result.current.detachedAttackLabAutoRunToken).toBe(1);
  });
});
