// src/ui/features/attack_lab/catalog/scenarios/http/__tests__/httpFingerprintHeaders.test.ts
// Tests del escenario device_http_headers: valida que el request intenta HTTP/HTTPS y extrae headers clave.

import { describe, expect, it } from "vitest";
import { httpFingerprintHeadersScenario } from "../httpFingerprintHeaders";

describe("httpFingerprintHeadersScenario", () => {
  it("debe ser un escenario native (Rust) sin PowerShell", () => {
    expect(httpFingerprintHeadersScenario.mode).toBe("native");
    expect(typeof httpFingerprintHeadersScenario.executeNative).toBe("function");
    expect(httpFingerprintHeadersScenario.buildRequest).toBeUndefined();
  });
});
