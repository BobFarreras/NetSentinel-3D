// src-tauri/src/application/mod.rs
// Modulo de aplicacion: expone casos de uso/servicios y coordina la estructura por dominios (manteniendo wrappers legacy durante la migracion).

pub mod attack_lab;
pub mod audit;
pub mod credentials;
pub mod gateway_credential_presets;
pub mod history;
pub mod http_fingerprint;
pub mod jammer;
pub mod opsec;
pub mod scan;
pub mod settings;
pub mod snapshot;
pub mod traffic;
pub mod wifi;
pub mod wordlist;
