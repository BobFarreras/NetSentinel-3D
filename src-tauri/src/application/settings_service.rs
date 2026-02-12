use std::fs;
use std::path::PathBuf;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};


#[derive(Serialize, Deserialize, Default, Clone, Debug)]
pub struct AppSettings {
    pub real_mac_address: Option<String>,
}

pub struct SettingsService {
    config_path: PathBuf,
}

impl SettingsService {
    pub fn new(app: &AppHandle) -> Self {
        let path = app.path().app_config_dir().unwrap().join("settings.json");
        if let Some(parent) = path.parent() {
            let _ = fs::create_dir_all(parent);
        }
        Self { config_path: path }
    }

    fn load(&self) -> AppSettings {
        if let Ok(content) = fs::read_to_string(&self.config_path) {
            serde_json::from_str(&content).unwrap_or_default()
        } else {
            AppSettings::default()
        }
    }

    fn save(&self, settings: &AppSettings) -> Result<(), String> {
        let json = serde_json::to_string_pretty(settings).map_err(|e| e.to_string())?;
        fs::write(&self.config_path, json).map_err(|e| e.to_string())
    }

    /// Devuelve la MAC real guardada. Si no existe, guarda la actual como real.
    pub fn get_or_init_real_mac(&self, current_mac: String) -> String {
        let mut settings = self.load();
        
        if let Some(real) = &settings.real_mac_address {
            return real.clone();
        }

        // Primera vez que se ejecuta: Guardamos la actual como la "Original"
        println!("💾 [SETTINGS] Guardando MAC original por primera vez: {}", current_mac);
        settings.real_mac_address = Some(current_mac.clone());
        let _ = self.save(&settings);
        current_mac
    }
}