// src-tauri/src/infrastructure/repositories/local_intelligence/ps_script.rs

use std::process::Command;

pub fn probe_identity(ip: &str) -> Result<String, String> {
    #[cfg(target_os = "windows")]
    {
        let script = identity_probe_script(ip);
        run_powershell(&script)
    }

    #[cfg(not(target_os = "windows"))]
    {
        let _ = ip;
        Err("identity probe no soportado fuera de Windows".to_string())
    }
}

pub fn fallback_detect_ipv4() -> Result<String, String> {
    #[cfg(target_os = "windows")]
    {
        // Fallback cuando falla UDP: primera IPv4 no loopback.
        // Emitimos una unica linea "IP=..." para poder reusar el mismo parser si hiciera falta.
        let script = r#"
$ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -ne "127.0.0.1" } | Select-Object -First 1 -ExpandProperty IPAddress)
if ($ip) { Write-Output $ip }
"#;
        let out = run_powershell(script)?;
        let ip = out.lines().next().unwrap_or("").trim().to_string();
        if ip.is_empty() {
            return Err("No se pudo detectar IPv4 via PowerShell".to_string());
        }
        Ok(ip)
    }

    #[cfg(not(target_os = "windows"))]
    {
        Err("No se pudo detectar IP (sin soporte para fallback en este OS)".to_string())
    }
}

#[cfg(target_os = "windows")]
fn identity_probe_script(ip: &str) -> String {
    // Generamos output estable con "KEY=VALUE" para parsing robusto.
    // Importante: Select-Object -First 1 para evitar ambiguedades.
    format!(
        r#"
$ErrorActionPreference = "SilentlyContinue"
$ip = "{ip}"
$addr = Get-NetIPAddress -AddressFamily IPv4 -IPAddress $ip | Select-Object -First 1
if (-not $addr) {{ exit 0 }}
$ifIndex = $addr.InterfaceIndex
$prefix = $addr.PrefixLength
$adapter = Get-NetAdapter -InterfaceIndex $ifIndex | Select-Object -First 1
$mac = $adapter.MacAddress
$name = $adapter.Name
$desc = $adapter.InterfaceDescription
$gw = (Get-NetRoute -InterfaceIndex $ifIndex -DestinationPrefix "0.0.0.0/0" | Sort-Object RouteMetric | Select-Object -First 1 -ExpandProperty NextHop)
$dns = ((Get-DnsClientServerAddress -InterfaceIndex $ifIndex -AddressFamily IPv4).ServerAddresses) -join ","
Write-Output ("MAC=" + $mac)
Write-Output ("IFNAME=" + $name)
Write-Output ("IFDESC=" + $desc)
Write-Output ("PREFIX=" + $prefix)
Write-Output ("GATEWAY=" + $gw)
Write-Output ("DNS=" + $dns)
"#
    )
}

#[cfg(target_os = "windows")]
fn run_powershell(script: &str) -> Result<String, String> {
    let output = Command::new("powershell")
        .args(["-NoProfile", "-NonInteractive", "-Command", script])
        .output()
        .map_err(|e| format!("No se pudo ejecutar PowerShell: {e}"))?;

    let mut text = String::new();
    text.push_str(&String::from_utf8_lossy(&output.stdout));
    text.push_str(&String::from_utf8_lossy(&output.stderr));
    Ok(text)
}

