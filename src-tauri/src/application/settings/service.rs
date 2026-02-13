// src-tauri/src/application/settings/service.rs
// Descripcion: caso de uso de settings. Gestiona configuracion (ej. MAC real) via el puerto `SettingsStorePort`.

use std::sync::{Arc, Mutex};

use crate::domain::entities::AppSettings;
use crate::domain::ports::SettingsStorePort;

pub struct SettingsService {
    store: Arc<dyn SettingsStorePort>,
    // Evita interleaving de operaciones load->save.
    io_guard: Mutex<()>,
}

impl SettingsService {
    pub fn new(store: Arc<dyn SettingsStorePort>) -> Self {
        Self {
            store,
            io_guard: Mutex::new(()),
        }
    }

    fn load(&self) -> AppSettings {
        self.store.load().unwrap_or_default()
    }

    fn save(&self, settings: &AppSettings) -> Result<(), String> {
        self.store.save(settings)
    }

    /// Devuelve el snapshot actual de settings persistidos.
    /// Nota: No valida campos semanticos (eso se hace en la capa API/command si aplica).
    pub fn get_settings(&self) -> AppSettings {
        let _guard = self.io_guard.lock().unwrap();
        self.load()
    }

    /// Persiste settings completos (se escribe el JSON entero).
    pub fn save_settings(&self, settings: AppSettings) -> Result<(), String> {
        let _guard = self.io_guard.lock().unwrap();
        self.save(&settings)
    }

    /// Actualiza solo el idioma de la UI (campo de UX). Mantiene el resto de settings intactos.
    pub fn set_ui_language(&self, ui_language: Option<String>) -> Result<(), String> {
        let _guard = self.io_guard.lock().unwrap();
        let mut settings = self.load();
        settings.ui_language = ui_language;
        self.save(&settings)
    }

    /// Devuelve la MAC real guardada. Si no existe, guarda la actual como real.
    pub fn get_or_init_real_mac(&self, current_mac: String) -> String {
        let _guard = self.io_guard.lock().unwrap();
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
