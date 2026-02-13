// src-tauri/src/api/commands/opsec.rs
// Descripcion: comandos OpSec (estado de seguridad MAC + randomize) delegando en `OpSecService`.

use tauri::State;
use crate::application::opsec::OpSecService;
use crate::api::dtos::MacSecurityStatusDTO;

pub fn check_mac_security(service: State<'_, OpSecService>) -> Result<MacSecurityStatusDTO, String> {
    let status = service.check_interface_security()?;
    Ok(MacSecurityStatusDTO {
        current_mac: status.current_mac,
        is_spoofed: status.is_spoofed,
        risk_level: status.risk_level,
    })
}


pub async fn randomize_mac(service: State<'_, OpSecService>) -> Result<String, String> {
    service.randomize_identity().await
}
