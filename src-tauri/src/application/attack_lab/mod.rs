// src-tauri/src/application/attack_lab/mod.rs
// Modulo Attack Lab: runner de procesos externos con streaming stdout/stderr, validacion y cancelacion testeable.

pub mod runner;
pub mod service;
pub mod sink;
pub mod types;
pub mod validation;

pub use service::AttackLabService;
#[allow(unused_imports)]
pub use types::{AttackLabExitEvent, AttackLabLogEvent, AttackLabRequest};

#[cfg(test)]
mod tests;

// Aliases legacy (compat): "external_audit" fue el nombre historico del modulo.
pub type ExternalAuditService = AttackLabService;
pub type ExternalAuditRequest = AttackLabRequest;
