// src/ui/features/attack_lab/catalog/scenarios/_shared/powershellNetBaseline.ts
// Builder de script PowerShell: baseline de conectividad (PTR + ping + tracert) con resumen VERDICT/WHY/NEXT.

const escapePsSingleQuoted = (value: string) => value.replace(/'/g, "''");

export const buildNetBaselinePs = (targetIpRaw: string): string => {
  const targetIp = escapePsSingleQuoted(targetIpRaw);

  // Importante: se devuelve un script inline en una sola linea (se unirá con '; ').
  // Esto evita depender de ficheros externos y mantiene el escenario portable.
  return [
    "$ErrorActionPreference = 'Continue'",
    `$targetIp = '${targetIp}'`,
    "Write-Output '=== NET BASELINE: PTR + PING + TRACERT ==='",
    "Write-Output ('TARGET_IP: ' + $targetIp)",
    "Write-Output ('TIMESTAMP: ' + (Get-Date).ToString('s'))",
    "Write-Output ''",
    "if (-not ([System.Net.IPAddress]::TryParse($targetIp, [ref]$null))) {",
    "  Write-Error ('Invalid IPv4: ' + $targetIp)",
    "  exit 2",
    "}",
    "",
    // PTR
    "$ptrOk = $false",
    "$ptrValue = ''",
    "Write-Output '== DNS (reverse) =='",
    "try {",
    "  $ptrValue = Resolve-DnsName -ErrorAction Stop -Type PTR -Name $targetIp | Select-Object -First 1 -ExpandProperty NameHost",
    "  if ($ptrValue) {",
    "    $ptrOk = $true",
    "    Write-Output ('PTR: ' + $ptrValue)",
    "  } else {",
    "    Write-Output 'PTR: <none>'",
    "  }",
    "} catch {",
    "  Write-Output ('PTR: <error> ' + $_.Exception.Message)",
    "}",
    "Write-Output ''",
    "",
    // Ping
    "$pingOk = $false",
    "$avg = $null; $min = $null; $max = $null",
    "Write-Output '== PING (Test-Connection) =='",
    "try {",
    "  $p = Test-Connection -ComputerName $targetIp -Count 4 -ErrorAction Stop",
    "  $avg = [Math]::Round(($p | Measure-Object -Property ResponseTime -Average).Average, 2)",
    "  $min = ($p | Measure-Object -Property ResponseTime -Minimum).Minimum",
    "  $max = ($p | Measure-Object -Property ResponseTime -Maximum).Maximum",
    "  $pingOk = $true",
    "  Write-Output ('PING_OK: true | AVG_MS=' + $avg + ' MIN_MS=' + $min + ' MAX_MS=' + $max)",
    "  $p | Select-Object Address, ResponseTime, Status | Format-Table -AutoSize | Out-String -Width 180 | ForEach-Object { $_.TrimEnd() }",
    "} catch {",
    "  Write-Output ('PING_OK: false | ' + $_.Exception.Message)",
    "}",
    "Write-Output ''",
    "",
    // Tracert
    "$hopCount = 0",
    "Write-Output '== TRACERT (max 12 hops) =='",
    "try {",
    // `tracert` puede tardar mucho si ICMP TTL-exceeded esta filtrado.
    // Reducimos timeout por probe para que el escenario siempre llegue a VERDICT en un tiempo razonable.
    "  $t = tracert -d -h 12 -w 250 $targetIp",
    "  $t | ForEach-Object { $_.TrimEnd() }",
    "  $hopCount = ($t | Where-Object { $_ -match '^\\s*\\d+\\s' }).Count",
    "} catch {",
    "  Write-Output ('TRACERT_ERROR: ' + $_.Exception.Message)",
    "}",
    "Write-Output ''",
    "",
    // Verdict
    "$verdict = 'OK'",
    "$reasons = @()",
    "if (-not $pingOk) { $verdict = 'WARN'; $reasons += 'PING fallo (ICMP filtrado o host no responde). No concluyente para TCP.' }",
    "if ($hopCount -gt 1) { $verdict = 'WARN'; $reasons += ('TRACERT con ' + $hopCount + ' hops: posible VPN/bridge/segmentacion.' ) }",
    "if ($pingOk -and $avg -ne $null -and $avg -gt 50) { $verdict = 'WARN'; $reasons += ('Latencia media alta (' + $avg + 'ms): WiFi saturado/bufferbloat/ruta inestable.') }",
    "Write-Output '== VERDICT =='",
    "Write-Output ('VERDICT: ' + $verdict)",
    "if ($reasons.Count -eq 0) { $reasons += 'Baseline consistente: conectividad LAN estable hacia el target.' }",
    "Write-Output 'WHY:'",
    "$reasons | ForEach-Object { Write-Output ('- ' + $_) }",
    "Write-Output ''",
    "Write-Output 'NEXT:'",
    "Write-Output '- Si quieres saber \"que esta expuesto\": ejecuta un audit de puertos TCP/servicios.'",
    "Write-Output '- Si es un router con panel web: ejecuta HTTP Fingerprint (HEAD) y revisa redirects/auth.'",
  ].join("; ");
};
