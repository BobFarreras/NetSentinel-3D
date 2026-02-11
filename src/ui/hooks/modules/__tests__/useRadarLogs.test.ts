import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";

import { addRadarErrorLog, addRadarNetworkLog, addRadarScanLog, clearRadarLogs, useRadarLogs } from "../radar/useRadarLogs";

describe("useRadarLogs", () => {
  it("debe añadir y limpiar logs", () => {
    clearRadarLogs();

    const { result } = renderHook(() => useRadarLogs());
    expect(result.current.logs).toEqual([]);

    act(() => {
      addRadarScanLog(2);
    });

    expect(result.current.logs).toHaveLength(1);
    expect(result.current.logs[0].kind).toBe("scan");

    act(() => {
      addRadarErrorLog("boom");
    });

    expect(result.current.logs).toHaveLength(2);
    expect(result.current.logs[1].kind).toBe("error");

    act(() => {
      addRadarNetworkLog({
        bssid: "AA:BB:CC:DD:EE:FF",
        ssid: "LAB_WIFI",
        channel: 6,
        signalLevel: -55,
        securityType: "WPA2-PSK",
        vendor: "Generic Device",
        distanceMock: 35,
        riskLevel: "STANDARD",
        isTargetable: false,
        isConnected: false,
      });
    });

    expect(result.current.logs).toHaveLength(3);
    expect(result.current.logs[2].kind).toBe("network");

    act(() => {
      result.current.clear();
    });

    expect(result.current.logs).toEqual([]);
  });
});
