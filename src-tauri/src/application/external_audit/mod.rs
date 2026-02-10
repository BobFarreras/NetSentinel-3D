// src-tauri/src/application/external_audit/mod.rs

pub mod runner;
pub mod service;
pub mod sink;
pub mod types;
pub mod validation;

pub use service::ExternalAuditService;
#[allow(unused_imports)]
pub use types::{ExternalAuditExitEvent, ExternalAuditLogEvent, ExternalAuditRequest};

#[cfg(test)]
mod tests;
