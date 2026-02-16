// src/ui/features/attack_lab/catalog/scenarios/http/__tests__/httpFingerprintHeaders.test.ts
// Tests del escenario device_http_headers: valida que el request intenta HTTP/HTTPS y extrae headers clave.

import { describe, expect, it } from "vitest";
import { httpFingerprintHeadersScenario } from "../httpFingerprintHeaders";

describe("httpFingerprintHeadersScenario", () => {
  it("debe construir un request PowerShell con Invoke-WebRequest sobre http/https", () => {
    const req = httpFingerprintHeadersScenario.buildRequest?.({
      device: { ip: "192.168.1.50", mac: "AA", vendor: "Device" } as any,
      identity: null,
    });

    expect(req?.binaryPath).toBe("powershell.exe");
    const cmd = (req?.args ?? []).join(" ");
    expect(cmd).toContain("Invoke-WebRequest");
    expect(cmd).toContain("http://");
    expect(cmd).toContain("https://");
    expect(cmd).toContain("WWW-Authenticate");
    expect(cmd).toContain("Set-Cookie");
    expect(cmd).toContain("Location");
  });
});

