// src/ui/features/attack_lab/catalog/scenarios/http/httpFingerprintHeaders.ts
// Escenario DEVICE external: fingerprint de cabeceras HTTP via HEAD para inventario/hardening (sin credenciales).

import type { AttackLabScenario } from "../../types";
import { isWindows } from "../_shared/platform";

export const httpFingerprintHeadersScenario: AttackLabScenario = {
  id: "device_http_headers",
  title: "HTTP: Fingerprint de cabeceras (HEAD)",
  description: "Obtiene cabeceras HTTP (sin credenciales) para inventario y hardening (por ejemplo Server, WWW-Authenticate, etc.).",
  mode: "external",
  category: "DEVICE",
  isSupported: () => {
    if (!isWindows()) return { supported: false, reason: "Preset pensado para Windows. Usa modo CUSTOM en otros SO." };
    return { supported: true };
  },
  buildRequest: ({ device }) => {
    const ip = device.ip;
    return {
      binaryPath: "powershell.exe",
      args: [
        "-NoProfile",
        "-Command",
        `try { (Invoke-WebRequest -UseBasicParsing -Method Head -TimeoutSec 5 -Uri http://${ip}/).Headers | Format-List * } catch { Write-Error $_ }`,
      ],
      timeoutMs: 60000,
    };
  },
};

