import { describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import type { DeviceDTO } from "../../../../shared/dtos/NetworkDTOs";

const devices: DeviceDTO[] = [
  { ip: "192.168.1.10", mac: "AA:AA:AA:AA:AA:AA", vendor: "Laptop", hostname: "MY-PC" },
  { ip: "192.168.1.20", mac: "BB:BB:BB:BB:BB:BB", vendor: "Phone", hostname: "Unknown" },
];

const packets = [
  {
    id: 1,
    timestamp: 1,
    sourceIp: "192.168.1.10",
    destinationIp: "8.8.8.8",
    protocol: "TCP",
    length: 20,
    info: "PKT-A",
    isIntercepted: false,
  },
  {
    id: 2,
    timestamp: 2,
    sourceIp: "192.168.1.20",
    destinationIp: "192.168.1.1",
    protocol: "UDP",
    length: 10,
    info: "PKT-B",
    isIntercepted: true,
  },
];

describe("useTrafficPanelState", () => {
  it("debe filtrar por JAMMED", async () => {
    const { useTrafficPanelState } = await import("../useTrafficPanelState");
    const { result } = renderHook(() =>
      useTrafficPanelState({
        packets: packets as any,
        jammedPackets: [packets[1]] as any,
        devices,
      })
    );

    expect(result.current.filteredPackets).toHaveLength(2);
    act(() => {
      result.current.handleFilterChange("JAMMED");
    });
    expect(result.current.filteredPackets).toHaveLength(1);
    expect(result.current.filteredPackets[0].info).toBe("PKT-B");
  });

  it("debe activar TARGET automaticamente si hay selectedDevice", async () => {
    const { useTrafficPanelState } = await import("../useTrafficPanelState");
    const { result } = renderHook(() =>
      useTrafficPanelState({
        packets: packets as any,
        jammedPackets: [] as any,
        devices,
        selectedDevice: { ip: "192.168.1.10", mac: "AA", vendor: "Laptop" } as any,
      })
    );

    expect(result.current.filterMode).toBe("TARGET");
    expect(result.current.filteredPackets).toHaveLength(1);
    expect(result.current.filteredPackets[0].sourceIp).toBe("192.168.1.10");
  });

  it("debe resolver nombres por IP y casos especiales", async () => {
    const { useTrafficPanelState } = await import("../useTrafficPanelState");
    const { result } = renderHook(() =>
      useTrafficPanelState({
        packets: [] as any,
        jammedPackets: [] as any,
        devices,
      })
    );

    expect(result.current.resolveName("192.168.1.10")).toContain("MY-PC");
    expect(result.current.resolveName("255.255.255.255")).toContain("BROADCAST");
    expect(result.current.resolveName("8.8.8.8")).toContain("GOOGLE DNS");
    expect(result.current.resolveName("10.0.0.1")).toBe("10.0.0.1");
  });
});
