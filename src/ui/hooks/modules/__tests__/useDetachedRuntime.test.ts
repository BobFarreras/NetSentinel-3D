// src/ui/hooks/modules/__tests__/useDetachedRuntime.test.ts
// Tests del runtime detached: valida el retardo de "ready" y el re-dock automatico en pagehide.

import { renderHook, act } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  emitDockPanel: vi.fn(),
  closeCurrentWindow: vi.fn(async () => undefined),
  destroyCurrentWindow: vi.fn(async () => undefined),
  listenCurrentWindowCloseRequested: vi.fn(async () => () => {}),
}));

vi.mock("../../../../adapters/windowingAdapter", () => ({
  windowingAdapter: mocks,
}));

import { useDetachedRuntime } from "../ui/useDetachedRuntime";

describe("useDetachedRuntime", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  it("debe activar panel ready tras retardo en modo detached", () => {
    const { result } = renderHook(() =>
      useDetachedRuntime({ panel: "attack_lab", targetIp: "192.168.1.20", scenarioId: "device_http_headers" })
    );

    expect(result.current.detachedPanelReady).toBe(false);

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current.detachedPanelReady).toBe(true);
  });

  it("no gestiona redock (lo hace el main)", () => {
    renderHook(() => useDetachedRuntime({ panel: "console" }));
    act(() => {
      window.dispatchEvent(new Event("pagehide"));
      window.dispatchEvent(new Event("beforeunload"));
    });
    expect(mocks.emitDockPanel).not.toHaveBeenCalled();
    expect(mocks.listenCurrentWindowCloseRequested).not.toHaveBeenCalled();
  });
});
