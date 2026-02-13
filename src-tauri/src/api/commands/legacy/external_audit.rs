// src-tauri/src/api/commands/external_audit.rs
// Alias legacy: comandos historicos "external audit" que delegan en Attack Lab.

use tauri::State;

use crate::api::dtos::ExternalAuditRequestDTO;
use crate::application::external_audit_service::{ExternalAuditRequest, ExternalAuditService};
use super::attack_lab;

// --- EXTERNAL AUDIT (WRAPPER CLI) ---
pub async fn start_external_audit(
    service: State<'_, ExternalAuditService>,
    app: tauri::AppHandle,
    request: ExternalAuditRequestDTO,
) -> Result<String, String> {
    // Nota: DTO y servicio son aliases a los tipos reales de Attack Lab.
    let _ = ExternalAuditRequest {
        binary_path: request.binary_path.clone(),
        args: request.args.clone(),
        cwd: request.cwd.clone(),
        timeout_ms: request.timeout_ms,
        env: request
            .env
            .clone()
            .unwrap_or_default()
            .into_iter()
            .map(|e| (e.key, e.value))
            .collect(),
    };
    attack_lab::start_attack_lab(service, app, request).await
}

pub async fn cancel_external_audit(service: State<'_, ExternalAuditService>, audit_id: String) -> Result<(), String> {
    attack_lab::cancel_attack_lab(service, audit_id).await
}
