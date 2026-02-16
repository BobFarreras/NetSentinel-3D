// src/ui/features/attack_lab/catalog/scenarios/http/httpFingerprintHeaders.ts
// Escenario DEVICE external: fingerprint de cabeceras HTTP via HEAD para inventario/hardening (sin credenciales).

import type { AttackLabScenario } from "../../types";
import { isWindows } from "../_shared/platform";

const escapePsSingleQuoted = (value: string) => value.replace(/'/g, "''");

export const httpFingerprintHeadersScenario: AttackLabScenario = {
  id: "device_http_headers",
  title: "HTTP: Fingerprint de cabeceras (HEAD)",
  description:
    "Baseline de superficie web: intenta HEAD sobre HTTP/HTTPS y extrae headers clave (Server, WWW-Authenticate, Set-Cookie, Location). Util para inventario y hardening.",
  mode: "external",
  category: "DEVICE",
  isSupported: () => {
    if (!isWindows()) return { supported: false, reason: "Preset pensado para Windows. Usa modo CUSTOM en otros SO." };
    return { supported: true };
  },
  buildRequest: ({ device }) => {
    const ip = device.ip;
    const ipSafe = escapePsSingleQuoted(ip);
    return {
      binaryPath: "powershell.exe",
      args: [
        "-NoProfile",
        "-Command",
        [
          "$ErrorActionPreference = 'Continue'",
          `$targetIp = '${ipSafe}'`,
          "Write-Output '=== HTTP FINGERPRINT: HEADERS (HTTP/HTTPS) ==='",
          "Write-Output ('TARGET_IP: ' + $targetIp)",
          "Write-Output ('TIMESTAMP: ' + (Get-Date).ToString('s'))",
          "Write-Output ''",
          "if (-not ([System.Net.IPAddress]::TryParse($targetIp, [ref]$null))) {",
          "  Write-Error ('Invalid IPv4: ' + $targetIp)",
          "  exit 2",
          "}",
          "",
          "function Print-Headers($resp) {",
          "  if (-not $resp) { return }",
          "  try { Write-Output ('STATUS: ' + [int]$resp.StatusCode + ' ' + $resp.StatusDescription) } catch {}",
          "  $h = $resp.Headers",
          "  $keys = @('Server','WWW-Authenticate','Set-Cookie','Location','Strict-Transport-Security','X-Frame-Options','Content-Security-Policy')",
          "  foreach ($k in $keys) {",
          "    try {",
          "      $v = $h[$k]",
          "      if ($v) { Write-Output ($k + ': ' + $v) }",
          "    } catch {}",
          "  }",
          "}",
          "",
          "Write-Output '== HTTP (port 80) =='",
          "try {",
          "  $http = Invoke-WebRequest -UseBasicParsing -Method Head -TimeoutSec 5 -Uri ('http://' + $targetIp + '/')",
          "  Print-Headers $http",
          "} catch {",
          "  Write-Output ('HTTP_ERROR: ' + $_.Exception.Message)",
          "}",
          "Write-Output ''",
          "Write-Output '== HTTPS (port 443) =='",
          "try {",
          "  [System.Net.ServicePointManager]::ServerCertificateValidationCallback = { $true }",
          "  $https = Invoke-WebRequest -UseBasicParsing -Method Head -TimeoutSec 5 -Uri ('https://' + $targetIp + '/')",
          "  Print-Headers $https",
          "} catch {",
          "  Write-Output ('HTTPS_ERROR: ' + $_.Exception.Message)",
          "}",
          "Write-Output ''",
          "Write-Output '== INTERPRETACION RAPIDA =='",
          "Write-Output '- Server/WWW-Authenticate: pista de stack y tipo de auth (Basic/Digest/Bearer).'", 
          "Write-Output '- Set-Cookie: sesiones y flags (Secure/HttpOnly/SameSite).'", 
          "Write-Output '- Location: redirects a /login o panel admin.'", 
          "Write-Output '- Si ambos fallan: puede no haber web UI o estar en otro puerto.'",
        ].join('; '),
      ],
      timeoutMs: 60000,
    };
  },
};
