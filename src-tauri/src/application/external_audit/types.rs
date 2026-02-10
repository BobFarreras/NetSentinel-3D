// src-tauri/src/application/external_audit/types.rs

#[derive(Clone, Debug)]
pub struct ExternalAuditRequest {
    pub binary_path: String,
    pub args: Vec<String>,
    pub cwd: Option<String>,
    pub timeout_ms: Option<u64>,
    pub env: Vec<(String, String)>,
}

#[derive(Clone, Debug, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ExternalAuditLogEvent {
    pub audit_id: String,
    pub stream: String, // "stdout" | "stderr"
    pub line: String,
}

#[derive(Clone, Debug, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ExternalAuditExitEvent {
    pub audit_id: String,
    pub success: bool,
    pub exit_code: Option<i32>,
    pub duration_ms: u128,
    pub error: Option<String>,
}

