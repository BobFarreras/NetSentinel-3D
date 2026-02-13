// src-tauri/src/application/history/mod.rs
// Caso de uso de historial: persistencia y lectura de sesiones (save_scan / get_history) via `HistoryRepositoryPort`.

pub mod service;

pub use service::HistoryService;

