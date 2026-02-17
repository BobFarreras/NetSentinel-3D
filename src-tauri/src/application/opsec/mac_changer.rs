// src-tauri/src/application/opsec/mac_changer.rs
// Servicio de cambio de MAC (Windows): aplica un override explicito via NetworkAddress y reinicia adaptador.
//
// Nota: la opcion nativa "Random Hardware Addresses" (WlanSvc) puede NO cambiar la MAC inmediatamente
// o reutilizar el mismo valor. Aqui generamos un MAC LAA unicast distinto del actual y verificamos el cambio.

use std::process::Command;

#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;

const CREATE_NO_WINDOW: u32 = 0x08000000;

pub struct MacChangerService;

impl MacChangerService {
    pub fn new() -> Self {
        Self
    }

    #[cfg(target_os = "windows")]
    pub async fn randomize_mac(&self, identifier: String) -> Result<String, String> {
        println!("[ghost] solicitando cambio de MAC para: {}", identifier);

        // PowerShell:
        // - Busca adaptador por InterfaceGuid o Name.
        // - Genera un MAC local-administered unicast diferente.
        // - Intenta aplicar por Set-NetAdapterAdvancedProperty (NetworkAddress) y fallback a registro.
        // - Reinicia adaptador y hace polling hasta ver cambio.
        let ps_script = format!(
            r#"
$ErrorActionPreference = 'Stop'

$currentPrincipal = [Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()
if (-not $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {{
  Write-Error "REQUIERE ADMIN: no se puede aplicar NetworkAddress sin permisos."
  exit 1
}}

$inputId = "{input_id}"

$adapter = Get-NetAdapter | Where-Object {{ $_.InterfaceGuid -eq $inputId }} | Select-Object -First 1
if (-not $adapter) {{
  $adapter = Get-NetAdapter -Name $inputId -ErrorAction SilentlyContinue | Select-Object -First 1
}}
if (-not $adapter) {{
  Write-Error "CRITICAL: adaptador no encontrado."
  exit 1
}}

$guid = $adapter.InterfaceGuid
$name = $adapter.Name
$oldMac = (Get-NetAdapter -Name $name).MacAddress

function New-RandomMacHex([string]$notEqMac) {{
  $rng = New-Object System.Security.Cryptography.RNGCryptoServiceProvider
  $bytes = New-Object 'Byte[]' 6
  $hexNotEq = ($notEqMac -replace '[:-]','').ToUpperInvariant()

  for ($i=0; $i -lt 40; $i++) {{
    $rng.GetBytes($bytes)
    # LAA + unicast
    $bytes[0] = ($bytes[0] -bor 2) -band 254
    $hex = -join ($bytes | ForEach-Object {{ $_.ToString('X2') }})
    if ($hex -ne $hexNotEq -and $hex -ne '000000000000') {{
      return $hex
    }}
  }}
  throw "No se pudo generar un MAC aleatorio diferente (40 intentos)."
}}

$newHex = New-RandomMacHex $oldMac

$applied = $false
try {{
  Set-NetAdapterAdvancedProperty -Name $name -RegistryKeyword "NetworkAddress" -RegistryValue $newHex -ErrorAction Stop | Out-Null
  $applied = $true
}} catch {{
  $applied = $false
}}

if (-not $applied) {{
  # Fallback: clave de driver por NetCfgInstanceId
  $classGuid = "{{4d36e972-e325-11ce-bfc1-08002be10318}}"
  $base = "HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Class\\$classGuid"
  $found = $false

  Get-ChildItem -Path $base -ErrorAction SilentlyContinue | ForEach-Object {{
    try {{
      $id = (Get-ItemProperty -Path $_.PSPath -Name "NetCfgInstanceId" -ErrorAction Stop).NetCfgInstanceId
      if ($id -and ($id.ToString() -eq $guid.ToString())) {{
        Set-ItemProperty -Path $_.PSPath -Name "NetworkAddress" -Value $newHex -ErrorAction Stop
        $found = $true
      }}
    }} catch {{
      # ignore
    }}
  }}

  if (-not $found) {{
    Write-Error "CRITICAL: no se pudo localizar la clave del driver para aplicar NetworkAddress."
    exit 1
  }}
}}

Disable-NetAdapter -Name $name -Confirm:$false -ErrorAction SilentlyContinue | Out-Null
Start-Sleep -Seconds 2
Enable-NetAdapter -Name $name -Confirm:$false -ErrorAction SilentlyContinue | Out-Null

$newMac = $null
for ($t=0; $t -lt 20; $t++) {{
  Start-Sleep -Seconds 1
  try {{
    $m = (Get-NetAdapter -Name $name).MacAddress
    if ($m -and ($m -ne $oldMac)) {{
      $newMac = $m
      break
    }}
  }} catch {{
    # ignore
  }}
}}

if (-not $newMac) {{
  Write-Error ("CRITICAL: la MAC no cambio. old=" + $oldMac + " attemptedHex=" + $newHex)
  exit 1
}}

Write-Output $newMac
"#,
            input_id = identifier
        );

        let output = Command::new("powershell")
            .args(["-NoProfile", "-Command", &ps_script])
            .creation_flags(CREATE_NO_WINDOW)
            .output()
            .map_err(|e| format!("Error proceso: {e}"))?;

        let stdout = String::from_utf8_lossy(&output.stdout).trim().to_string();
        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
            return Err(format!("FALLO SCRIPT:\nSTDOUT: {stdout}\nSTDERR: {stderr}"));
        }

        if let Some(mac_line) = stdout.lines().last() {
            let clean = mac_line.trim().replace('-', ":");
            if clean.len() >= 12 {
                return Ok(clean);
            }
        }

        Ok(stdout)
    }

    #[cfg(not(target_os = "windows"))]
    pub async fn randomize_mac(&self, _identifier: String) -> Result<String, String> {
        Err("Solo Windows".to_string())
    }

    #[allow(dead_code)]
    pub async fn restore_original_mac(&self, _interface_name: String) -> Result<(), String> {
        Ok(())
    }
}
