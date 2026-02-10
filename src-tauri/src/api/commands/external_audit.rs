// src-tauri/src/api/commands/external_audit.rs

use tauri::State;

use crate::api::dtos::ExternalAuditRequestDTO;
use crate::application::external_audit_service::{ExternalAuditRequest, ExternalAuditService};

// --- EXTERNAL AUDIT (WRAPPER CLI) ---
pub async fn start_external_audit(
    service: State<'_, ExternalAuditService>,
    app: tauri::AppHandle,
    request: ExternalAuditRequestDTO,
) -> Result<String, String> {
    let env_pairs = request
        .env
        .unwrap_or_default()
        .into_iter()
        .map(|e| (e.key, e.value))
        .collect();

    service
        .start_audit(
            app,
            ExternalAuditRequest {
                binary_path: request.binary_path,
                args: request.args,
                cwd: request.cwd,
                timeout_ms: request.timeout_ms,
                env: env_pairs,
            },
        )
        .await
}

pub async fn cancel_external_audit(service: State<'_, ExternalAuditService>, audit_id: String) -> Result<(), String> {
    service.cancel_audit(&audit_id).await
}
