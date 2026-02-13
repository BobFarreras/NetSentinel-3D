// src-tauri/src/application/legacy/external_audit_service.rs

// Shim de compatibilidad:
// Este modulo existia como un archivo monolitico. Ahora el codigo vive en:
// - `src-tauri/src/application/attack_lab/*`
// Mantener este shim evita romper imports existentes en `api/commands.rs` y `lib.rs`.

#[allow(unused_imports)]
pub use crate::application::attack_lab::{ExternalAuditRequest, ExternalAuditService};
