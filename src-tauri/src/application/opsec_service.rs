// src-tauri/src/application/opsec_service.rs

use std::sync::Arc;
use crate::domain::security::mac_validator::MacValidator;
use crate::infrastructure::system_scanner::SystemScanner;
use crate::api::dtos::MacSecurityStatusDTO;

// ✅ CORRECCIÓN: Usamos el trait REAL que definimos en ports.rs
use crate::domain::ports::NetworkScannerPort; 

pub struct OpSecService {
    scanner: Arc<SystemScanner>,
}

impl OpSecService {
    pub fn new(scanner: Arc<SystemScanner>) -> Self {
        Self { scanner }
    }

    pub fn check_interface_security(&self) -> Result<MacSecurityStatusDTO, String> {
        // 1. Obtenemos la identidad actual
        // Ahora sí funciona porque NetworkScannerPort tiene este método
        let identity = self.scanner.get_host_identity().map_err(|e| e.to_string())?;
        
        // Extraemos la MAC (String)
        let mac_string = identity.mac; // Esto mueve la propiedad, 'identity' ya no se usa despues

        // 2. Validamos si es segura
        // Pasamos una REFERENCIA (&str) porque is_spoofed espera &str
        let is_spoofed = MacValidator::is_spoofed(&mac_string);

        // 3. Construimos reporte
        // Pasamos 'mac_string' (String) al DTO.
        Ok(MacSecurityStatusDTO {
            current_mac: mac_string,
            is_spoofed,
            risk_level: if is_spoofed { "LOW".to_string() } else { "HIGH".to_string() },
        })
    }
}