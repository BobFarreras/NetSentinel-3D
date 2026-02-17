// src-tauri/src/api/commands/credentials.rs

use std::time::{SystemTime, UNIX_EPOCH};

use tauri::State;

use crate::api::validators::validate_usable_host_ipv4;
use crate::application::credentials::CredentialService;
use crate::domain::entities::GatewayCredentials;
use crate::infrastructure::persistence::credential_store::KEYRING_UNAVAILABLE_PREFIX;

use super::internal_validation::validate_router_credentials_input;

fn is_keyring_unavailable(err: &str) -> bool {
    err.starts_with(KEYRING_UNAVAILABLE_PREFIX)
}

// --- CREDENCIALES (gateway) ---
#[tauri::command]
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

    match service
        .save_gateway_credentials(GatewayCredentials {
            gateway_ip,
            user,
            pass,
            saved_at,
        })
        .await
    {
        Ok(()) => Ok(()),
        Err(e) if is_keyring_unavailable(&e) => {
            // Best-effort multi-OS: si no hay keyring, no bloqueamos el flujo.
            // La UI puede seguir con presets/brute-force.
            Ok(())
        }
        Err(e) => Err(e),
    }
}

#[tauri::command]
pub async fn get_gateway_credentials(
    service: State<'_, CredentialService>,
    gateway_ip: String,
) -> Result<Option<GatewayCredentials>, String> {
    validate_usable_host_ipv4(&gateway_ip, "gateway_ip")?;
    match service.get_gateway_credentials(&gateway_ip).await {
        Ok(v) => Ok(v),
        Err(e) if is_keyring_unavailable(&e) => Ok(None),
        Err(e) => Err(e),
    }
}

#[tauri::command]
pub async fn delete_gateway_credentials(
    service: State<'_, CredentialService>,
    gateway_ip: String,
) -> Result<(), String> {
    validate_usable_host_ipv4(&gateway_ip, "gateway_ip")?;
    match service.delete_gateway_credentials(&gateway_ip).await {
        Ok(()) => Ok(()),
        Err(e) if is_keyring_unavailable(&e) => Ok(()),
        Err(e) => Err(e),
    }
}
