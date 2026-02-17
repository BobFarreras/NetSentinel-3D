// src-tauri/src/api/commands/wifi.rs

use crate::api::dtos::WifiNetworkDTO;
use crate::application::wifi::WifiService;
use tauri::State;

#[tauri::command]
pub async fn scan_airwaves(service: State<'_, WifiService>) -> Result<Vec<WifiNetworkDTO>, String> {
    let networks = service.scan_airwaves().await?;
    Ok(networks.into_iter().map(WifiNetworkDTO::from).collect())
}

#[tauri::command]
pub async fn wifi_connect(
    service: State<'_, WifiService>,
    ssid: String,
    password: String,
) -> Result<bool, String> {
    service.connect_to_network(ssid, password).await
}
