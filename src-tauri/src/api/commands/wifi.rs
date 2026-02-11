// src-tauri/src/api/commands/wifi.rs

use tauri::State;

use crate::api::dtos::WifiNetworkDTO;
use crate::application::wifi_service::WifiService;

// --- WIFI RADAR VIEW ---
pub async fn scan_airwaves(service: State<'_, WifiService>) -> Result<Vec<WifiNetworkDTO>, String> {
    let networks = service.scan_airwaves().await?;
    Ok(networks.into_iter().map(WifiNetworkDTO::from).collect())
}
