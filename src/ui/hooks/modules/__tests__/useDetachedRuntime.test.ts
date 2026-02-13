// src/ui/hooks/modules/__tests__/useDetachedRuntime.test.ts
// Tests del runtime detached: valida el retardo de "ready" y el re-dock automatico en pagehide.

import { renderHook, act } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  emitDockPanel: vi.fn(),
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

  it("debe emitir dock en pagehide", () => {
    renderHook(() => useDetachedRuntime({ panel: "radar" }));

    act(() => {
      window.dispatchEvent(new Event("pagehide"));
    });

    expect(mocks.emitDockPanel).toHaveBeenCalledWith("radar");
  });

  it("debe emitir dock en beforeunload", () => {
    renderHook(() => useDetachedRuntime({ panel: "console" }));

    act(() => {
      window.dispatchEvent(new Event("beforeunload"));
    });

    expect(mocks.emitDockPanel).toHaveBeenCalledWith("console");
  });

  it("registra listener de close-requested en Tauri via adapter", () => {
    renderHook(() => useDetachedRuntime({ panel: "attack_lab" }));
    expect(mocks.listenCurrentWindowCloseRequested).toHaveBeenCalledTimes(1);
  });
});
