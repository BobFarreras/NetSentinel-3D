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
        externalAuditTargetIp: "192.168.1.20",
        externalAuditScenarioId: "device_http_headers",
        showRadar: true,
        showExternalAudit: true,
      })
    );

    await act(async () => {
      await result.current.undockPanel("external");
    });

    expect(result.current.detachedPanels.external).toBe(true);
    expect(result.current.detachedModes.external).toBe("tauri");
  });

  it("debe reacoplar si recibe evento dock", async () => {
    let dockCb: ((panel: "console" | "device" | "radar" | "external" | "scene3d") => void) | null = null;
    mocks.listenDockPanel.mockImplementation(async (cb) => {
      dockCb = cb;
      return () => undefined;
    });

    const { result } = renderHook(() =>
      usePanelDockingState({
        selectedDeviceIp: "192.168.1.10",
        externalAuditTargetIp: "192.168.1.20",
        externalAuditScenarioId: "device_http_headers",
        showRadar: true,
        showExternalAudit: true,
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
