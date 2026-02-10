// src-tauri/src/application/external_audit_service.rs

// Shim de compatibilidad:
// Este modulo existia como un archivo monolitico. Ahora el codigo vive en:
// - `src-tauri/src/application/external_audit/*`
// Mantener este shim evita romper imports existentes en `api/commands.rs` y `lib.rs`.

pub use crate::application::external_audit::{
    ExternalAuditRequest, ExternalAuditService,
};
