// src-tauri/src/application/mod.rs
// Modulo de aplicacion: expone casos de uso/servicios y coordina la estructura por dominios (manteniendo wrappers legacy durante la migracion).

pub mod scan;
pub mod history;
pub mod snapshot;
pub mod credentials;
pub mod wordlist;
pub mod opsec;
pub mod settings;
pub mod audit;
pub mod traffic;
pub mod jammer;
pub mod wifi;
pub mod attack_lab;

// Modulos legacy: shims de compatibilidad para mantener imports historicos mientras migramos a modulos por dominio.
#[path = "legacy/scanner_service.rs"]
pub mod scanner_service;
#[path = "legacy/audit_service.rs"]
pub mod audit_service;
#[path = "legacy/history_service.rs"]
pub mod history_service;
#[path = "legacy/traffic_service.rs"]
pub mod traffic_service;
#[path = "legacy/jammer_service.rs"]
pub mod jammer_service;
#[path = "legacy/wifi_service.rs"]
pub mod wifi_service;
#[path = "legacy/wifi_normalizer.rs"]
pub mod wifi_normalizer;
#[path = "legacy/attack_lab_service.rs"]
pub mod attack_lab_service;
#[path = "legacy/external_audit_service.rs"]
pub mod external_audit_service;
#[path = "legacy/latest_snapshot_service.rs"]
pub mod latest_snapshot_service;
#[path = "legacy/credential_service.rs"]
pub mod credential_service;
#[path = "legacy/wordlist_service.rs"]
pub mod wordlist_service;
#[path = "legacy/opsec_service.rs"]
pub mod opsec_service;
#[path = "legacy/mac_changer_service.rs"]
pub mod mac_changer_service;
#[path = "legacy/settings_service.rs"]
pub mod settings_service;
