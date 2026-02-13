// src-tauri/src/application/attack_lab/types.rs
// Tipos del Attack Lab: request interno (runner) y eventos serializables emitidos hacia UI.

#[derive(Clone, Debug)]
pub struct AttackLabRequest {
    pub binary_path: String,
    pub args: Vec<String>,
    pub cwd: Option<String>,
    pub timeout_ms: Option<u64>,
    pub env: Vec<(String, String)>,
}

#[derive(Clone, Debug, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AttackLabLogEvent {
  pub audit_id: String,
  pub stream: String, // "stdout" | "stderr"
  pub line: String,
}

#[derive(Clone, Debug, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AttackLabExitEvent {
  pub audit_id: String,
  pub success: bool,
  pub exit_code: Option<i32>,
  pub duration_ms: u128,
  pub error: Option<String>,
}

// Aliases legacy (compat): nombres historicos para no romper imports.
#[allow(dead_code)]
pub type ExternalAuditRequest = AttackLabRequest;
#[allow(dead_code)]
pub type ExternalAuditLogEvent = AttackLabLogEvent;
#[allow(dead_code)]
pub type ExternalAuditExitEvent = AttackLabExitEvent;
