import { renderHook, act, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  closeDetachedPanelWindow: vi.fn(),
  openDetachedPanelWindow: vi.fn(),
  listenDockPanel: vi.fn(),
  isDetachedPanelWindowOpen: vi.fn(),
}));

vi.mock("../../../../adapters/windowingAdapter", () => ({
  windowingAdapter: mocks,
}));

import { usePanelDockingState } from "../ui/usePanelDockingState";

describe("usePanelDockingState", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.listenDockPanel.mockResolvedValue(() => undefined);
    mocks.isDetachedPanelWindowOpen.mockResolvedValue(true);
    mocks.openDetachedPanelWindow.mockResolvedValue(true);
  });

  it("debe marcar panel como desacoplado al undock", async () => {
    const { result } = renderHook(() =>
      usePanelDockingState({
        selectedDeviceIp: "192.168.1.10",
        attackLabTargetIp: "192.168.1.20",
        attackLabScenarioId: "device_http_headers",
        showRadar: true,
        showAttackLab: true,
      })
    );

    await act(async () => {
      await result.current.undockPanel("attack_lab");
    });

    expect(result.current.detachedPanels.attack_lab).toBe(true);
    expect(result.current.detachedModes.attack_lab).toBe("tauri");
  });

  it("debe reacoplar si recibe evento dock", async () => {
    let dockCb: ((panel: any) => void) | null = null;
    mocks.listenDockPanel.mockImplementation(async (cb) => {
      dockCb = cb;
      return () => undefined;
    });

    const { result } = renderHook(() =>
      usePanelDockingState({
        selectedDeviceIp: "192.168.1.10",
        attackLabTargetIp: "192.168.1.20",
        attackLabScenarioId: "device_http_headers",
        showRadar: true,
        showAttackLab: true,
      })
    );

    await act(async () => {
      await result.current.undockPanel("console");
    });

    act(() => {
      dockCb?.("console");
    });

    await waitFor(() => {
      expect(result.current.detachedPanels.console).toBe(false);
      expect(result.current.detachedModes.console).toBe(null);
    });
  });
});
