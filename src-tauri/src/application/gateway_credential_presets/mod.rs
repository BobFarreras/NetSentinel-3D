// src-tauri/src/application/gateway_credential_presets/mod.rs
// Modulo de presets de credenciales: expone el servicio para gestionar pares user/pass persistidos localmente.

pub mod service;

pub use service::GatewayCredentialPresetService;
