// src-tauri/src/api/commands/credentials.rs

use std::time::{SystemTime, UNIX_EPOCH};

use tauri::State;

use crate::api::validators::validate_usable_host_ipv4;
use crate::application::credential_service::CredentialService;
use crate::domain::entities::GatewayCredentials;

use super::internal_validation::validate_router_credentials_input;

// --- CREDENCIALES (gateway) ---
pub async fn save_gateway_credentials(
    service: State<'_, CredentialService>,
    gateway_ip: String,
    user: String,
    pass: String,
) -> Result<(), String> {
    validate_router_credentials_input(&gateway_ip, &user, &pass)?;

    let saved_at = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as u64;

    service
        .save_gateway_credentials(GatewayCredentials {
            gateway_ip,
            user,
            pass,
            saved_at,
        })
        .await
}

pub async fn get_gateway_credentials(
    service: State<'_, CredentialService>,
    gateway_ip: String,
) -> Result<Option<GatewayCredentials>, String> {
    validate_usable_host_ipv4(&gateway_ip, "gateway_ip")?;
    service.get_gateway_credentials(&gateway_ip).await
}

pub async fn delete_gateway_credentials(service: State<'_, CredentialService>, gateway_ip: String) -> Result<(), String> {
    validate_usable_host_ipv4(&gateway_ip, "gateway_ip")?;
    service.delete_gateway_credentials(&gateway_ip).await
}
