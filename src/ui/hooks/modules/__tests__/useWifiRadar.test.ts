import { describe, it, expect, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

vi.mock("../../../../adapters/wifiAdapter", () => ({
  wifiAdapter: {
    scanAirwaves: vi.fn(async () => [
      {
        bssid: "AA:BB:CC:DD:EE:FF",
        ssid: "LAB_WIFI",
        channel: 1,
        signalLevel: -40,
        securityType: "WPA2-PSK",
        vendor: "TP-Link",
        distanceMock: 20,
        riskLevel: "STANDARD",
        isTargetable: false,
        isConnected: false,
      },
    ]),
  },
}));

describe("useWifiRadar", () => {
  it("debe escanear y exponer networks y lastScanAt", async () => {
    const { useWifiRadar } = await import("../radar/useWifiRadar");
    const { result } = renderHook(() => useWifiRadar());

    expect(result.current.scanning).toBe(false);
    expect(result.current.networks).toEqual([]);

    await act(async () => {
      await result.current.scan();
    });

    await waitFor(() => {
      expect(result.current.scanning).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.networks).toHaveLength(1);
      expect(result.current.lastScanAt).not.toBe(null);
    });
  });

  it("debe exponer error si falla el escaneo", async () => {
    const { wifiAdapter } = await import("../../../../adapters/wifiAdapter");
    (wifiAdapter.scanAirwaves as unknown as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("boom"));

    const { useWifiRadar } = await import("../radar/useWifiRadar");
    const { result } = renderHook(() => useWifiRadar());

    await act(async () => {
      await result.current.scan();
    });

    await waitFor(() => {
      expect(result.current.scanning).toBe(false);
      expect(result.current.error).toContain("boom");
    });
  });
});
