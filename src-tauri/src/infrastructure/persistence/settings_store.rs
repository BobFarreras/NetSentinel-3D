// src-tauri/src/infrastructure/persistence/settings_store.rs
// Descripcion: almacenamiento de settings en JSON dentro del directorio de config de la app (file-backed).

use std::fs;
use std::path::PathBuf;

use tauri::{AppHandle, Manager};

use crate::domain::entities::AppSettings;
use crate::domain::ports::SettingsStorePort;

pub struct FileSettingsStore {
    path: PathBuf,
}

impl FileSettingsStore {
    pub fn new(app: &AppHandle) -> Self {
        let path = app.path().app_config_dir().unwrap().join("settings.json");
        if let Some(parent) = path.parent() {
            let _ = fs::create_dir_all(parent);
        }
        Self { path }
    }
}

impl SettingsStorePort for FileSettingsStore {
    fn load(&self) -> Result<AppSettings, String> {
        if let Ok(content) = fs::read_to_string(&self.path) {
            Ok(serde_json::from_str(&content).unwrap_or_default())
        } else {
            Ok(AppSettings::default())
        }
    }

    fn save(&self, settings: &AppSettings) -> Result<(), String> {
        let json = serde_json::to_string_pretty(settings).map_err(|e| e.to_string())?;
        fs::write(&self.path, json).map_err(|e| e.to_string())
    }
}

