import { describe, it, expect, vi } from "vitest";

vi.mock("../../shared/tauri/bridge", () => ({
  invokeCommand: vi.fn(async () => [
    {
      bssid: "AA:BB:CC:DD:EE:FF",
      ssid: "<hidden>",
      channel: 6,
      signalLevel: -55,
      securityType: "OPEN",
      vendor: "Generic Device",
      distanceMock: 35,
      riskLevel: "OPEN",
      isTargetable: true,
      isConnected: false,
    },
  ]),
}));

describe("wifiAdapter", () => {
  it("debe invocar scan_airwaves", async () => {
    const { invokeCommand } = await import("../../shared/tauri/bridge");
    const { wifiAdapter } = await import("../wifiAdapter");

    const res = await wifiAdapter.scanAirwaves();

    expect(invokeCommand).toHaveBeenCalledWith("scan_airwaves");
    expect(res).toHaveLength(1);
    expect(res[0].bssid).toBe("AA:BB:CC:DD:EE:FF");
  });
});
