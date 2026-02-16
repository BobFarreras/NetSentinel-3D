// src-tauri/src/infrastructure/persistence/gateway_credential_preset_repository.rs
// Descripcion: repositorio file-backed (JSON) para presets de credenciales (pares user/pass) usados en auditoria de gateways.

use std::fs;
use std::path::PathBuf;

use tauri::Manager;

use crate::domain::entities::GatewayCredentialPreset;
use crate::domain::ports::GatewayCredentialPresetRepositoryPort;

pub struct FileGatewayCredentialPresetRepository {
    file_path: PathBuf,
}

impl FileGatewayCredentialPresetRepository {
    pub fn new(app_handle: &tauri::AppHandle) -> Self {
        let path = app_handle
            .path()
            .app_config_dir()
            .unwrap()
            .join("gateway_cred_presets.json");
        if let Some(parent) = path.parent() {
            let _ = fs::create_dir_all(parent);
        }
        Self { file_path: path }
    }

    fn defaults() -> Vec<GatewayCredentialPreset> {
        vec![
            // Defaults globales ("*"): sirven como base para cualquier gateway.
            GatewayCredentialPreset { gateway_ip: "*".to_string(), user: "admin".to_string(), pass: "admin".to_string() },
            GatewayCredentialPreset { gateway_ip: "*".to_string(), user: "admin".to_string(), pass: "1234".to_string() },
            GatewayCredentialPreset { gateway_ip: "*".to_string(), user: "user".to_string(), pass: "user".to_string() },
            GatewayCredentialPreset { gateway_ip: "*".to_string(), user: "1234".to_string(), pass: "1234".to_string() },
        ]
    }
}

impl GatewayCredentialPresetRepositoryPort for FileGatewayCredentialPresetRepository {
    fn load(&self) -> Result<Vec<GatewayCredentialPreset>, String> {
        if !self.file_path.exists() {
            let defaults = Self::defaults();
            self.save(&defaults)?;
            return Ok(defaults);
        }

        let raw = fs::read_to_string(&self.file_path).map_err(|e| e.to_string())?;
        if raw.trim().is_empty() {
            let defaults = Self::defaults();
            self.save(&defaults)?;
            return Ok(defaults);
        }

        // Compat: si existe JSON legacy (v1) sin `gatewayIp`, lo migramos a presets globales.
        if let Ok(v2) = serde_json::from_str::<Vec<GatewayCredentialPreset>>(&raw) {
            return Ok(v2);
        }

        #[derive(serde::Deserialize)]
        #[serde(rename_all = "camelCase")]
        struct LegacyPreset {
            user: String,
            pass: String,
        }

        let legacy = serde_json::from_str::<Vec<LegacyPreset>>(&raw).map_err(|e| e.to_string())?;
        let migrated: Vec<GatewayCredentialPreset> = legacy
            .into_iter()
            .filter(|p| !p.user.trim().is_empty() && !p.pass.trim().is_empty())
            .map(|p| GatewayCredentialPreset { gateway_ip: "*".to_string(), user: p.user, pass: p.pass })
            .collect();
        self.save(&migrated)?;
        Ok(migrated)
    }

    fn save(&self, presets: &[GatewayCredentialPreset]) -> Result<(), String> {
        let json = serde_json::to_string_pretty(presets).map_err(|e| e.to_string())?;
        fs::write(&self.file_path, json).map_err(|e| e.to_string())
    }
}
