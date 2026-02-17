// src-tauri/src/api/commands/mod.rs
// Facade de comandos Tauri: exporta entrypoints `#[tauri::command]` agrupados por feature, sin archivo monolitico.

// Submodulos (separacion por responsabilidades / SOLID)
pub mod attack_lab;
pub mod credentials;
pub mod gateway_credential_presets;
pub mod history;
pub mod http_fingerprint;
pub mod internal_validation;
pub mod opsec;
pub mod router_audit;
pub mod scanner;
pub mod settings;
pub mod snapshot;
pub mod system;
pub mod wifi;
pub mod wordlist;
