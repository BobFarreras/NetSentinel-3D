// src-tauri/src/api/commands/snapshot.rs

use tauri::State;

use crate::application::snapshot::LatestSnapshotService;
use crate::domain::entities::{Device, LatestSnapshot};

// --- SNAPSHOT (arranque rapido) ---
#[tauri::command]
pub async fn save_latest_snapshot(
    service: State<'_, LatestSnapshotService>,
    devices: Vec<Device>,
) -> Result<(), String> {
    service.save_devices(devices).await
}

#[tauri::command]
pub async fn load_latest_snapshot(
    service: State<'_, LatestSnapshotService>,
) -> Result<Option<LatestSnapshot>, String> {
    service.load_snapshot().await
}
