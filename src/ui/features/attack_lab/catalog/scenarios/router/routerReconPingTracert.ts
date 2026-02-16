// src/ui/features/attack_lab/catalog/scenarios/router/routerReconPingTracert.ts
// Escenario ROUTER external: reconocimiento basico no intrusivo (PING + TRACERT) para baseline de conectividad y ruta.

import type { AttackLabScenario } from "../../types";
import { isWindows } from "../_shared/platform";

const escapePsSingleQuoted = (value: string) => value.replace(/'/g, "''");

export const routerReconPingTracertScenario: AttackLabScenario = {
  id: "router_recon_ping_tracert",
  title: "Router: Recon basico (PING + TRACERT)",
  description:
    "Baseline de conectividad hacia el gateway: resuelve PTR (si existe), mide latencia (ping) y traza ruta (tracert). Util para explicar fallos antes de auditar puertos/servicios.",
  mode: "external",
  category: "ROUTER",
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
        // Script inline (sin shell) con salida estructurada para que un junior entienda "que esta pasando".
        // Nota: usamos single-quotes en PS para evitar problemas de escaping en TS.
        [
          "$ErrorActionPreference = 'Continue'",
          `$targetIp = '${ipSafe}'`,
          "Write-Output '=== ROUTER RECON: BASELINE (PING + TRACERT) ==='",
          "Write-Output ('TARGET_IP: ' + $targetIp)",
          "Write-Output ('TIMESTAMP: ' + (Get-Date).ToString('s'))",
          "Write-Output ''",
          "if (-not ([System.Net.IPAddress]::TryParse($targetIp, [ref]$null))) {",
          "  Write-Error ('Invalid IPv4: ' + $targetIp)",
          "  exit 2",
          "}",
          "Write-Output '== DNS (reverse) =='",
          "try {",
          "  $rev = Resolve-DnsName -ErrorAction Stop -Type PTR -Name $targetIp | Select-Object -First 1 -ExpandProperty NameHost",
          "  if ($rev) { Write-Output ('PTR: ' + $rev) } else { Write-Output 'PTR: <none>' }",
          "} catch {",
          "  Write-Output ('PTR: <error> ' + $_.Exception.Message)",
          "}",
          "Write-Output ''",
          "Write-Output '== PING (Test-Connection) =='",
          "try {",
          "  $p = Test-Connection -ComputerName $targetIp -Count 4 -ErrorAction Stop",
          "  $avg = [Math]::Round(($p | Measure-Object -Property ResponseTime -Average).Average, 2)",
          "  $min = ($p | Measure-Object -Property ResponseTime -Minimum).Minimum",
          "  $max = ($p | Measure-Object -Property ResponseTime -Maximum).Maximum",
          "  Write-Output ('PING_OK: true | AVG_MS=' + $avg + ' MIN_MS=' + $min + ' MAX_MS=' + $max)",
          "  $p | Select-Object Address, ResponseTime, Status | Format-Table -AutoSize | Out-String -Width 180 | ForEach-Object { $_.TrimEnd() }",
          "} catch {",
          "  Write-Output ('PING_OK: false | ' + $_.Exception.Message)",
          "}",
          "Write-Output ''",
          "Write-Output '== TRACERT (max 12 hops) =='",
          "try {",
          "  tracert -d -h 12 $targetIp | ForEach-Object { $_.TrimEnd() }",
          "} catch {",
          "  Write-Output ('TRACERT_ERROR: ' + $_.Exception.Message)",
          "}",
          "Write-Output ''",
          "Write-Output '== INTERPRETACION RAPIDA =='",
          "Write-Output '- Si PING_OK=false: puede haber ICMP filtrado o el host no responde; no implica que no exista servicio TCP.'",
          "Write-Output '- Si TRACERT muestra saltos externos o extraños en LAN: revisa NAT/bridge/VPN/segmentacion.'",
          "Write-Output '- Latencia alta/variable: interferencias WiFi, saturacion, bufferbloat o rutas inestables.'",
        ].join('; '),
      ],
      timeoutMs: 180000,
    };
  },
};
