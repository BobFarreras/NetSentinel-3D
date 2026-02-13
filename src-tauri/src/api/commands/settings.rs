// src-tauri/src/api/commands/settings.rs
// Descripcion: comandos de settings. Expone carga/guardado de `AppSettings` (ej. idioma UI) via `SettingsService`.

use std::sync::Arc;

use crate::application::settings::SettingsService;
use crate::domain::entities::AppSettings;

fn validate_ui_language(lang: &Option<String>) -> Result<(), String> {
    let Some(raw) = lang else { return Ok(()); };
    let v = raw.trim().to_lowercase();
    if v.is_empty() {
        return Ok(());
    }
    match v.as_str() {
        "es" | "ca" | "en" => Ok(()),
        _ => Err(format!("ui_language invalido: {} (valores permitidos: es|ca|en)", raw)),
    }
}

pub fn get_app_settings(service: tauri::State<'_, Arc<SettingsService>>) -> Result<AppSettings, String> {
    Ok(service.get_settings())
}

pub fn save_app_settings(
    service: tauri::State<'_, Arc<SettingsService>>,
    settings: AppSettings,
) -> Result<(), String> {
    validate_ui_language(&settings.ui_language)?;
    service.save_settings(settings)
}

pub fn set_ui_language(
    service: tauri::State<'_, Arc<SettingsService>>,
    ui_language: Option<String>,
) -> Result<(), String> {
    validate_ui_language(&ui_language)?;
    service.set_ui_language(ui_language)
}

