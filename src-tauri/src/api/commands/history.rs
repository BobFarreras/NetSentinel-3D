// src-tauri/src/api/commands/history.rs

use tauri::State;

use crate::application::history::HistoryService;
use crate::domain::entities::{Device, ScanSession};

// --- HISTORY ---
pub async fn save_scan(service: State<'_, HistoryService>, devices: Vec<Device>) -> Result<String, String> {
    // Nota: el frontend envia JSON que coincide con la estructura de `Device`.
    // Tauri hace el parseo automatico gracias al `Deserialize` de `src-tauri/src/domain/entities.rs`.
    service.save_session(devices).await
}

pub async fn get_history(service: State<'_, HistoryService>) -> Result<Vec<ScanSession>, String> {
    Ok(service.get_history().await)
}
