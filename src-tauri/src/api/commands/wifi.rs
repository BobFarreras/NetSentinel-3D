// src-tauri/src/api/commands/wifi.rs

use tauri::State;
use crate::api::dtos::WifiNetworkDTO;
use crate::application::wifi_service::WifiService;

// Función existente
pub async fn scan_airwaves(service: State<'_, WifiService>) -> Result<Vec<WifiNetworkDTO>, String> {
    let networks = service.scan_airwaves().await?;
    Ok(networks.into_iter().map(WifiNetworkDTO::from).collect())
}

// NUEVA Función (Sin #[tauri::command] aquí, porque se pone en commands.rs)
pub async fn wifi_connect(
    service: State<'_, WifiService>,
    ssid: String,
    password: String
) -> Result<bool, String> {
    service.connect_to_network(ssid, password).await
}