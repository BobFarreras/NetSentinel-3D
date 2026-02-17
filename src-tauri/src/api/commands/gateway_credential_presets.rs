// src-tauri/src/api/commands/gateway_credential_presets.rs
// Comandos: gestion de presets de credenciales (user/pass) para gateways (diccionario local en JSON).

use tauri::State;

use crate::api::validators::validate_usable_host_ipv4;
use crate::application::gateway_credential_presets::GatewayCredentialPresetService;
use crate::domain::entities::GatewayCredentialPreset;

fn validate_gateway_ip_or_global(gateway_ip: &str, field: &str) -> Result<(), String> {
    // Los presets incluyen entradas globales ("*") como base reutilizable.
    // La UI puede querer eliminarlos/actualizarlos, por lo que debemos aceptarlo aqui.
    if gateway_ip == "*" {
        return Ok(());
    }
    validate_usable_host_ipv4(gateway_ip, field)
}

#[tauri::command]
pub fn list_gateway_credential_presets(
    service: State<'_, GatewayCredentialPresetService>,
    gateway_ip: String,
) -> Result<Vec<GatewayCredentialPreset>, String> {
    validate_gateway_ip_or_global(&gateway_ip, "gateway_ip")?;
    service.list(&gateway_ip)
}

#[tauri::command]
pub fn add_gateway_credential_preset(
    service: State<'_, GatewayCredentialPresetService>,
    gateway_ip: String,
    user: String,
    pass: String,
) -> Result<Vec<GatewayCredentialPreset>, String> {
    validate_gateway_ip_or_global(&gateway_ip, "gateway_ip")?;
    service.add(&gateway_ip, user, pass)
}

#[tauri::command]
pub fn remove_gateway_credential_preset(
    service: State<'_, GatewayCredentialPresetService>,
    gateway_ip: String,
    user: String,
    pass: String,
) -> Result<Vec<GatewayCredentialPreset>, String> {
    validate_gateway_ip_or_global(&gateway_ip, "gateway_ip")?;
    service.remove(&gateway_ip, user, pass)
}

#[tauri::command]
pub fn update_gateway_credential_preset(
    service: State<'_, GatewayCredentialPresetService>,
    gateway_ip: String,
    old_user: String,
    old_pass: String,
    new_user: String,
    new_pass: String,
) -> Result<Vec<GatewayCredentialPreset>, String> {
    validate_gateway_ip_or_global(&gateway_ip, "gateway_ip")?;
    service.update(&gateway_ip, old_user, old_pass, new_user, new_pass)
}

#[cfg(test)]
mod tests {
    use super::validate_gateway_ip_or_global;

    #[test]
    fn accepts_global_star() {
        assert!(validate_gateway_ip_or_global("*", "gateway_ip").is_ok());
    }

    #[test]
    fn rejects_garbage() {
        assert!(validate_gateway_ip_or_global("not-an-ip", "gateway_ip").is_err());
    }
}
