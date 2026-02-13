// src-tauri/src/api/commands/attack_lab.rs
// Comandos internos de Attack Lab: traduce DTO -> request interno y delega en el servicio de application.

use tauri::State;

use crate::api::dtos::AttackLabRequestDTO;
use crate::api::sinks::attack_lab_tauri_sink::TauriAttackLabSink;
use crate::application::attack_lab::{AttackLabRequest, AttackLabService};

pub async fn start_attack_lab(
    service: State<'_, AttackLabService>,
    app: tauri::AppHandle,
    request: AttackLabRequestDTO,
) -> Result<String, String> {
    let env_pairs = request
        .env
        .unwrap_or_default()
        .into_iter()
        .map(|e| (e.key, e.value))
        .collect();

    service
        .start_audit(
            AttackLabRequest {
                binary_path: request.binary_path,
                args: request.args,
                cwd: request.cwd,
                timeout_ms: request.timeout_ms,
                env: env_pairs,
            },
            std::sync::Arc::new(TauriAttackLabSink::new(app)),
        )
        .await
}

pub async fn cancel_attack_lab(service: State<'_, AttackLabService>, audit_id: String) -> Result<(), String> {
    service.cancel_audit(&audit_id).await
}
