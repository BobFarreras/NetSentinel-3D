// src/ui/features/attack_lab/catalog/scenarios/router/__tests__/routerReconPingTracert.test.ts
// Tests del escenario router_recon_ping_tracert: valida que el request incluye baseline (DNS + ping + tracert) en PowerShell.

import { describe, expect, it } from "vitest";
import { routerReconPingTracertScenario } from "../routerReconPingTracert";

describe("routerReconPingTracertScenario", () => {
  it("debe construir un request PowerShell con DNS/PING/TRACERT", () => {
    const req = routerReconPingTracertScenario.buildRequest?.({
      device: { ip: "192.168.1.1", mac: "AA", vendor: "Router", isGateway: true } as any,
      identity: { gatewayIp: "192.168.1.1" } as any,
    });

    expect(req?.binaryPath).toBe("powershell.exe");
    const cmd = (req?.args ?? []).join(" ");
    expect(cmd).toContain("Resolve-DnsName");
    expect(cmd).toContain("Test-Connection");
    expect(cmd).toContain("tracert");
  });
});

