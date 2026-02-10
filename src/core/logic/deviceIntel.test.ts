import { describe, expect, it } from "vitest";
import { classifyDeviceIntel } from "./deviceIntel";

describe("deviceIntel", () => {
  it("debe clasificar el host local como PC con alta confianza", () => {
    const intel = classifyDeviceIntel(
      { ip: "192.168.1.50", mac: "AA:BB", vendor: "NETSENTINEL (HOST)" } as any,
      { hostIp: "192.168.1.50", gatewayIp: "192.168.1.1" }
    );
    expect(intel.deviceType).toBe("PC");
    expect(intel.confidence).toBeGreaterThanOrEqual(90);
  });

  it("debe clasificar el gateway como ROUTER", () => {
    const intel = classifyDeviceIntel({ ip: "192.168.1.1", mac: "AA:BB", vendor: "Router", isGateway: true } as any, {
      hostIp: "192.168.1.50",
      gatewayIp: "192.168.1.1",
    });
    expect(intel.deviceType).toBe("ROUTER");
  });

  it("debe sugerir PHONE si el nombre contiene redmi", () => {
    const intel = classifyDeviceIntel({ ip: "192.168.1.130", mac: "AA:BB", vendor: "Xiaomi", name: "Redmi-15" } as any);
    expect(intel.deviceType).toBe("PHONE");
  });
});

