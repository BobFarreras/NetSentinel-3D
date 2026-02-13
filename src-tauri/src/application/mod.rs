// src-tauri/src/application/mod.rs
// Modulo de aplicacion: expone casos de uso/servicios y coordina la estructura por dominios (manteniendo wrappers legacy durante la migracion).

pub mod scan;
pub mod scanner_service;
pub mod history;
pub mod snapshot;
pub mod credentials;
pub mod wordlist;
pub mod opsec;
pub mod settings;
pub mod audit;
pub mod traffic;
pub mod jammer;
pub mod audit_service;
pub mod history_service;
pub mod traffic_service;
pub mod jammer_service;
pub mod wifi_service;
pub mod wifi_normalizer;
pub mod attack_lab;
pub mod attack_lab_service;
pub mod external_audit_service;
pub mod latest_snapshot_service;
pub mod credential_service;
pub mod wordlist_service;
pub mod opsec_service;
pub mod mac_changer_service;
pub mod settings_service;
