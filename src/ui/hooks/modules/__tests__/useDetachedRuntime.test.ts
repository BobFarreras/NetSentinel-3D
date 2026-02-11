import { renderHook, act } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  emitDockPanel: vi.fn(),
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
      useDetachedRuntime({ panel: "external", targetIp: "192.168.1.20", scenarioId: "device_http_headers" })
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
});
