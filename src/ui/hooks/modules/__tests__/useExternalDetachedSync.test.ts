import { renderHook, act } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  listenExternalAuditContext: vi.fn(),
  emitExternalAuditContext: vi.fn(),
}));

vi.mock("../../../../adapters/windowingAdapter", () => ({
  windowingAdapter: mocks,
}));

import { useExternalDetachedSync } from "../ui/useExternalDetachedSync";

describe("useExternalDetachedSync", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debe actualizar target/escenario al recibir contexto", async () => {
    let cb: ((payload: { targetDevice: { ip: string; mac: string; vendor: string } | null; scenarioId?: string; autoRun?: boolean }) => void) | null = null;
    mocks.listenExternalAuditContext.mockImplementation(async (handler) => {
      cb = handler;
      return () => undefined;
    });

    const { result } = renderHook(() => useExternalDetachedSync());

    act(() => {
      cb?.({
        targetDevice: { ip: "192.168.1.40", mac: "AA:BB", vendor: "Node" },
        scenarioId: "device_http_headers",
        autoRun: true,
      });
    });

    expect(result.current.detachedExternalTarget?.ip).toBe("192.168.1.40");
    expect(result.current.detachedExternalScenarioId).toBe("device_http_headers");
    expect(result.current.detachedExternalAutoRunToken).toBe(1);
  });
});
