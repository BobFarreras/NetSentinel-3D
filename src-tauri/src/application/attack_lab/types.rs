// src-tauri/src/application/attack_lab/types.rs
// Descripcion: aliases/exports para mantener imports estables. Los tipos reales viven en `domain/entities.rs`.

pub use crate::domain::entities::{AttackLabRequest, AttackLabLogEvent, AttackLabExitEvent};

// Aliases legacy (compat): nombres historicos para no romper imports.
#[allow(dead_code)]
pub type ExternalAuditRequest = AttackLabRequest;
#[allow(dead_code)]
pub type ExternalAuditLogEvent = AttackLabLogEvent;
#[allow(dead_code)]
pub type ExternalAuditExitEvent = AttackLabExitEvent;
