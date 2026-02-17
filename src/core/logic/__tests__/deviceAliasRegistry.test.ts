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

  it("debe permitir alias manual aunque el dispositivo ya tenga name (manual override)", () => {
    deviceAliasRegistry.setManualAliasForDevice({ ip: "192.168.1.3", mac: "AA:BB:CC:DD:EE:FF" } as any, "Alexa", 10);
    const next = deviceAliasRegistry.applyAliases([
      { ip: "192.168.1.3", mac: "AA:BB:CC:DD:EE:FF", name: "WRONG" } as any,
    ]);
    expect(next[0]?.name).toBe("Alexa");
  });

  it("no debe aplicar alias aprendido por IP cuando ya hay MAC valida (evita colisiones)", () => {
    // Primero se aprende por IP (simula scan sin MAC valida).
    deviceAliasRegistry.rememberFromDevices([{ ip: "192.168.1.140", mac: "00:00:00:00:00:00", name: "M2004J19C" } as any], 1);

    // Luego el device ya tiene MAC valida: no deberia heredar el nombre aprendido por IP.
    const next = deviceAliasRegistry.applyAliases([
      { ip: "192.168.1.140", mac: "50:D4:5C:68:28:5E" } as any,
    ]);
    expect(next[0]?.name).toBeUndefined();
  });
});
