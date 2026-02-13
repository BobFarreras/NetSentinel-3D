// src-tauri/src/application/attack_lab/mod.rs
// Descripcion: caso de uso Attack Lab. Orquesta ejecucion/cancelacion via puertos (runner + sink) y valida request.

pub mod service;
pub mod types;
pub mod validation;

pub use service::AttackLabService;
#[allow(unused_imports)]
pub use types::{AttackLabExitEvent, AttackLabLogEvent, AttackLabRequest};
