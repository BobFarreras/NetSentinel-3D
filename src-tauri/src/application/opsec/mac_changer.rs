// src-tauri/src/application/opsec/mac_changer.rs
// Servicio de cambio de MAC (Windows): habilita randomizacion nativa (WlanSvc) y reinicia adaptador para aplicar.

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
        println!("👻 [GHOST MODE] Activando 'Windows Random Hardware Addresses' para: {}", identifier);

        let ps_script = format!(
            r#"
            $ErrorActionPreference = 'Continue'
            
            # --- 0. CHECK ADMIN ---
            $currentPrincipal = [Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()
            if (-not $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {{
                Write-Error "REQUIERE ADMIN. Windows no deja cambiar config de WLAN sin permisos."
                exit 1
            }}

            $inputRouter = "{input_id}"
            
            # --- 1. BUSCAR ADAPTADOR ---
            $adapter = Get-NetAdapter | Where-Object {{ $_.InterfaceGuid -eq $inputRouter }} | Select-Object -First 1
            if (-not $adapter) {{
                $adapter = Get-NetAdapter -Name $inputRouter -ErrorAction SilentlyContinue
            }}
            
            if (-not $adapter) {{
                Write-Error "CRITICAL: Adaptador no encontrado."
                exit 1
            }}

            $guid = $adapter.InterfaceGuid
            $name = $adapter.Name
            
            Write-Output "DEBUG: Configurando Windows WLAN Service para: $name ($guid)"

            # --- 2. ACTIVAR ALEATORIZACIÓN NATIVA DE WINDOWS ---
            # En lugar de tocar el driver, tocamos la config del servicio WlanSvc.
            # Ruta: HKLM\SOFTWARE\Microsoft\WlanSvc\Interfaces\{{GUID}}
            
            $wlanKeyPath = "HKLM:\SOFTWARE\Microsoft\WlanSvc\Interfaces\$guid"
            
            if (-not (Test-Path $wlanKeyPath)) {{
                Write-Error "CRITICAL: No se encontró configuración WLAN para este adaptador. ¿Es una tarjeta Wi-Fi real?"
                exit 1
            }}

            # Valor: RandomMacSourceObject
            # 0 = Desactivado
            # 1 = Activado (Aleatorio)
            try {{
                Set-ItemProperty -Path $wlanKeyPath -Name "RandomMacSourceObject" -Value 1 -Type DWord -ErrorAction Stop
                Write-Output "DEBUG: Interruptor 'Direcciones aleatorias' -> ACTIVADO (ON)"
            }} catch {{
                Write-Error "ERROR: No se pudo activar el interruptor nativo. $_"
                exit 1
            }}

            # --- 3. REINICIO PARA APLICAR ---
            # Al reiniciar, Windows leerá la nueva config y generará la MAC él mismo.
            
            Disable-NetAdapter -Name $name -Confirm:$false
            Start-Sleep -Seconds 3
            Enable-NetAdapter -Name $name -Confirm:$false
            
            # Esperamos un poco a que Windows genere la MAC
            Start-Sleep -Seconds 2
            
            # --- 4. VERIFICACIÓN ---
            $newDetails = Get-NetAdapter -Name $name
            $currentMac = $newDetails.MacAddress
            
            # Devolvemos la MAC que Windows ha decidido usar
            Write-Output $currentMac
            "#,
            input_id = identifier
        );

        let output = Command::new("powershell")
            .args(["-NoProfile", "-Command", &ps_script])
            .creation_flags(CREATE_NO_WINDOW)
            .output()
            .map_err(|e| format!("Error proceso: {}", e))?;

        let stdout = String::from_utf8_lossy(&output.stdout).trim().to_string();
        
        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
            return Err(format!("FALLO SCRIPT:\nSTDERR: {}", stderr));
        }

        // Buscamos la línea que parece una MAC
        if let Some(mac_line) = stdout.lines().last() {
            let clean = mac_line.trim().replace("-", ":");
            if clean.len() >= 12 { // 17 con separadores
                return Ok(clean.to_string());
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
