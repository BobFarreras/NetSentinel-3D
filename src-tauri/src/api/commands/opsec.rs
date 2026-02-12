// src-tauri/src/api/commands/opsec.rs

use tauri::State;
use crate::application::opsec_service::OpSecService;
use crate::api::dtos::MacSecurityStatusDTO;

// NOTA: Sin macro, lógica pura (siguiendo tu arquitectura)
pub fn check_mac_security(service: State<'_, OpSecService>) -> Result<MacSecurityStatusDTO, String> {
    service.check_interface_security()
}