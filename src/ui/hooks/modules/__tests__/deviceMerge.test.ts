import { describe, expect, it } from "vitest";
import { mergeRouterInventory, mergeScanInventory } from "../shared/deviceMerge";
import { DeviceDTO } from "../../../../shared/dtos/NetworkDTOs";

describe("deviceMerge", () => {
  it("debe mantener nodos previos cuando scan trae menos resultados", () => {
    const previous: DeviceDTO[] = [
      { ip: "192.168.1.10", mac: "AA:BB:CC:DD:EE:FF", vendor: "Laptop" },
      { ip: "192.168.1.20", mac: "11:22:33:44:55:66", vendor: "Phone" },
    ];
    const scanResults: DeviceDTO[] = [
      { ip: "192.168.1.10", mac: "AA:BB:CC:DD:EE:FF", vendor: "Laptop" },
    ];

    const merged = mergeScanInventory(previous, scanResults);

    expect(merged).toHaveLength(2);
    expect(merged.some((d) => d.ip === "192.168.1.20")).toBe(true);
  });

  it("debe conservar MAC valida anterior si router aporta MAC invalida", () => {
    const previous: DeviceDTO[] = [
      { ip: "192.168.1.50", mac: "AA:BB:CC:DD:EE:FF", vendor: "Old Vendor" },
    ];
    const routerDevices: DeviceDTO[] = [
      { ip: "192.168.1.50", mac: "00:00:00:00:00:00", vendor: "New Vendor" },
    ];

    const merged = mergeRouterInventory(previous, routerDevices);

    expect(merged[0].mac).toBe("AA:BB:CC:DD:EE:FF");
    expect(merged[0].vendor).toBe("Old Vendor");
  });
});

