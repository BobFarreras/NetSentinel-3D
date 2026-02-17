// src-tauri/src/infrastructure/persistence/mod.rs
// Descripcion: adaptadores de persistencia local (filesystem) usados por casos de uso via puertos del dominio.

pub mod credential_store;
pub mod gateway_credential_preset_repository;
pub mod history_repository;
pub mod latest_snapshot_repository;
pub mod settings_store;
pub mod wordlist_repository;
