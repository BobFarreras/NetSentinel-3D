// src/ui/features/attack_lab/catalog/__tests__/attackLabScenarios.test.ts
// Tests del catalogo Attack Lab: valida que el agregador exporta escenarios esperados (ids estables) tras modularizacion.

import { describe, expect, it } from "vitest";
import { getAttackLabScenarios } from "../attackLabScenarios";

describe("attackLabScenarios catalog", () => {
  it("debe exponer ids esperados", () => {
    const ids = getAttackLabScenarios().map((s) => s.id);
    expect(ids).toEqual([
      "wifi_brute_force_dict",
      "router_recon_ping_tracert",
      "device_recon_ping_tracert",
      "device_http_headers",
      "iot_risk_profile_quick_ports",
      "edu_pmkid_exposure_sim",
    ]);
  });
});
