// src-tauri/src/application/opsec/service.rs
// Descripcion: caso de uso OpSec. Calcula estado de spoofing MAC y ejecuta `randomize_mac` coordinando settings + mac changer.

use std::sync::Arc;

use crate::application::settings::SettingsService;
use crate::domain::entities::{HostIdentity, MacSecurityStatus};
use crate::domain::ports::NetworkScannerPort;
use super::mac_changer::MacChangerService;

pub struct OpSecService {
    scanner: Arc<dyn NetworkScannerPort>,
    settings: Arc<SettingsService>,
    changer: Arc<MacChangerService>,
}

impl OpSecService {
    pub fn new(
        scanner: Arc<dyn NetworkScannerPort>,
        settings: Arc<SettingsService>,
        changer: Arc<MacChangerService>,
    ) -> Self {
        Self {
            scanner,
            settings,
            changer,
        }
    }

    pub fn get_identity(&self) -> Result<HostIdentity, String> {
        self.scanner.get_host_identity()
    }

    pub fn check_interface_security(&self) -> Result<MacSecurityStatus, String> {
        // 1) Obtener MAC actual
        let identity = self.scanner.get_host_identity()?;
        let current_mac = identity.mac.to_uppercase().replace("-", ":");

        // 2) Obtener MAC "real" persistida (si no existe, inicializa con la actual)
        let real_mac = self.settings.get_or_init_real_mac(current_mac.clone())
            .to_uppercase()
            .replace("-", ":");

        // 3) Heuristica: si son diferentes -> spoofed (lo consideramos "LOW" en riesgo).
        // Nota: si el primer arranque ocurre con MAC ya cambiada, se guardara como "real".
        let is_different = current_mac != real_mac;

        // Heuristica extra: Local Administered Address (02/06/0A/0E...) suele indicar spoofing.
        let is_laa = crate::domain::security::mac_validator::MacValidator::is_spoofed(&current_mac);
        let is_spoofed = is_different || is_laa;

        Ok(MacSecurityStatus {
            current_mac,
            is_spoofed,
            risk_level: if is_spoofed { "LOW".to_string() } else { "HIGH".to_string() },
        })
    }

    pub async fn randomize_identity(&self) -> Result<String, String> {
        let identity = self.scanner.get_host_identity()?;
        // Necesitamos el nombre de la interfaz (ej: "Wi-Fi") para PowerShell.
        self.changer.randomize_mac(identity.interface_name).await
    }
}
