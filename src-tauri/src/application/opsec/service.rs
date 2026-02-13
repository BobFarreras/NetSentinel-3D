// src-tauri/src/application/opsec/service.rs
// Servicio OpSec: valida estado de spoofing MAC y ejecuta randomize_mac coordinando settings + mac changer.

use std::sync::{Arc, Mutex};
use crate::infrastructure::system_scanner::SystemScanner;
use crate::api::dtos::MacSecurityStatusDTO;
use crate::domain::ports::NetworkScannerPort;
use crate::application::settings::SettingsService;
use super::mac_changer::MacChangerService;


pub struct OpSecService {
    scanner: Arc<SystemScanner>,
    settings: Arc<Mutex<SettingsService>>,
    changer: Arc<MacChangerService>, 
}

impl OpSecService {
    pub fn new(
        scanner: Arc<SystemScanner>, 
        settings: Arc<Mutex<SettingsService>>,
        changer: Arc<MacChangerService>
    ) -> Self {
        Self { scanner, settings, changer }
    }

    pub fn check_interface_security(&self) -> Result<MacSecurityStatusDTO, String> {
        // 1. Obtener actual
        let identity = self.scanner.get_host_identity().map_err(|e| e.to_string())?;
        let current_mac = identity.mac.to_uppercase().replace("-", ":");

        // 2. Obtener la Original (Persistente)
        let settings_guard = self.settings.lock().map_err(|_| "Lock error")?;
        let real_mac = settings_guard.get_or_init_real_mac(current_mac.clone()).to_uppercase().replace("-", ":");

        // 3. Comparar
        // Si son diferentes, consideramos que está Spoofed (SAFE)
        // NOTA: Si es la primera vez que ejecutas y ya la tenías cambiada, guardará la cambiada como real.
        // El usuario deberá borrar settings.json si quiere resetear.
        let is_different = current_mac != real_mac;

        // Lógica extra: Si empieza por 02/06/0A/0E también es seguro
        let is_laa = crate::domain::security::mac_validator::MacValidator::is_spoofed(&current_mac);
        
        let is_safe = is_different || is_laa;

        Ok(MacSecurityStatusDTO {
            current_mac: current_mac,
            is_spoofed: is_safe,
            risk_level: if is_safe { "LOW".to_string() } else { "HIGH".to_string() },
        })
    }

    pub async fn randomize_identity(&self) -> Result<String, String> {
        let identity = self.scanner.get_host_identity().map_err(|e| e.to_string())?;
        // Necesitamos el nombre de la interfaz (ej: "Wi-Fi") para PowerShell
        // default-net nos lo da en identity.interface_name
        self.changer.randomize_mac(identity.interface_name).await
    }
}
