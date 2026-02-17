// src/ui/features/attack_lab/logic/__tests__/parseWifiEvidence.test.ts
// Tests del parser de evidencias WiFi: deteccion WPA*02 (PMKID) y decodificacion de SSID en hex.

import { describe, expect, it } from "vitest";
import { parseWifiEvidence } from "../parseWifiEvidence";

describe("parseWifiEvidence", () => {
  it("debe parsear un PMKID WPA*02 y extraer SSID", () => {
    const raw = "WPA*02*00112233445566778899aabbccddeeff*3c585dd368e7*001122334455*4d794e6574";
    const parsed = parseWifiEvidence(raw);
    expect(parsed).not.toBeNull();
    expect(parsed?.kind).toBe("pmkid");
    expect(parsed?.apMac).toBe("3c:58:5d:d3:68:e7");
    expect(parsed?.ssid).toBe("MyNet");
  });

  it("debe devolver null si no hay linea de evidencia", () => {
    expect(parseWifiEvidence("hello\nworld")).toBeNull();
  });
});

