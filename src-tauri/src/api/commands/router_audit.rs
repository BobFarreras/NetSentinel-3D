// src-tauri/src/api/commands/router_audit.rs

use tauri::State;

use crate::api::dtos::{DeviceDTO, RouterAuditResultDTO};
use crate::api::validators::validate_usable_host_ipv4;
use crate::application::audit::AuditService;

use super::internal_validation::validate_router_credentials_input;

// --- ROUTER AUDIT ---
pub async fn audit_router(service: State<'_, AuditService>, gateway_ip: String) -> Result<RouterAuditResultDTO, String> {
    validate_usable_host_ipv4(&gateway_ip, "gateway_ip")?;

    // Nota: el logging se emite via evento global (wiring en `src-tauri/src/lib.rs`).
    let result = service.brute_force_gateway(gateway_ip).await;
    Ok(RouterAuditResultDTO::from(result))
}

pub async fn fetch_router_devices(
    service: State<'_, AuditService>,
    gateway_ip: String,
    user: String,
    pass: String,
) -> Result<Vec<DeviceDTO>, String> {
    validate_router_credentials_input(&gateway_ip, &user, &pass)?;

    let devices = service.extract_router_data(gateway_ip, user, pass).await;
    Ok(devices.into_iter().map(DeviceDTO::from).collect())
}
