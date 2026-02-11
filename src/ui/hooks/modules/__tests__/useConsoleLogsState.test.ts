import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";

const { toggleMonitoringMock, clearPacketsMock, radarClearMock, setSelectedBssidMock } = vi.hoisted(() => ({
  toggleMonitoringMock: vi.fn(async () => {}),
  clearPacketsMock: vi.fn(() => {}),
  radarClearMock: vi.fn(() => {}),
  setSelectedBssidMock: vi.fn((_bssid: string) => {}),
}));

vi.mock("../traffic/useTrafficMonitor", () => ({
  useTrafficMonitor: () => ({
    isActive: false,
    speed: 0,
    packets: [],
    jammedPackets: [],
    toggleMonitoring: toggleMonitoringMock,
    clearPackets: clearPacketsMock,
  }),
}));

vi.mock("../radar/useRadarLogs", () => ({
  useRadarLogs: () => ({
    logs: [],
    clear: radarClearMock,
  }),
}));

vi.mock("../radar/useWifiRadarSelection", () => ({
  useWifiRadarSelection: () => ({
    selectedBssid: null,
    setSelectedBssid: setSelectedBssidMock,
  }),
}));

describe("useConsoleLogsState", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it("debe iniciar en pestaña SYSTEM", async () => {
    const { useConsoleLogsState } = await import("../ui/useConsoleLogsState");
    const { result } = renderHook(() => useConsoleLogsState());
    expect(result.current.activeTab).toBe("SYSTEM");
  });

  it("debe limpiar logs segun pestaña activa", async () => {
    const { useConsoleLogsState } = await import("../ui/useConsoleLogsState");
    const onClearSystemLogs = vi.fn();
    const { result } = renderHook(() => useConsoleLogsState());

    act(() => {
      result.current.handleClearByTab(onClearSystemLogs);
    });
    expect(onClearSystemLogs).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.setActiveTab("TRAFFIC");
    });
    act(() => {
      result.current.handleClearByTab(onClearSystemLogs);
    });
    expect(clearPacketsMock).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.setActiveTab("RADAR");
    });
    act(() => {
      result.current.handleClearByTab(onClearSystemLogs);
    });
    expect(radarClearMock).toHaveBeenCalledTimes(1);
  });

  it("debe activar loading temporal al hacer toggle de trafico", async () => {
    const { useConsoleLogsState } = await import("../ui/useConsoleLogsState");
    const { result } = renderHook(() => useConsoleLogsState());

    await act(async () => {
      await result.current.handleToggleTraffic();
    });

    expect(toggleMonitoringMock).toHaveBeenCalledTimes(1);
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(result.current.isLoading).toBe(false);
  });
});
