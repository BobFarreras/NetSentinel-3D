// src/core/logic/__tests__/deviceAliasRegistry.test.ts
// Descripcion: tests del registro de alias de dispositivos (memoria de nombres/hostnames).

import { describe, expect, it, vi, beforeEach } from "vitest";
import { deviceAliasRegistry } from "../deviceAliasRegistry";

describe("deviceAliasRegistry", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useRealTimers();
  });

  it("debe recordar name/hostname por MAC e IP y rellenar un scan futuro sin label", () => {
    const now = 1700000000000;

    deviceAliasRegistry.rememberFromDevices(
      [
        { ip: "192.168.1.130", mac: "de:95:77:0f:09:71", name: "Redmi-15" } as any,
        { ip: "192.168.1.10", mac: "AA-BB-CC-DD-EE-FF", hostname: "DESKTOP-K0N" } as any,
      ],
      now
    );

    const next = deviceAliasRegistry.applyAliases([
      { ip: "192.168.1.130", mac: "DE-95-77-0F-09-71" } as any,
      { ip: "192.168.1.10", mac: "aa:bb:cc:dd:ee:ff" } as any,
    ]);

    expect(next[0]?.name).toBe("Redmi-15");
    expect(next[1]?.name).toBe("DESKTOP-K0N");
  });

  it("no debe sobreescribir un name existente", () => {
    deviceAliasRegistry.rememberFromDevices([{ ip: "192.168.1.2", mac: "aa:bb", name: "A" } as any], 1);
    const next = deviceAliasRegistry.applyAliases([{ ip: "192.168.1.2", mac: "aa:bb", name: "B" } as any]);
    expect(next[0]?.name).toBe("B");
  });
});

