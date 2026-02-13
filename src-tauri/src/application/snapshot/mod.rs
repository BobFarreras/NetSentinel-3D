// src-tauri/src/application/snapshot/mod.rs
// Caso de uso de snapshots: persistencia/carga del ultimo inventario para arranque rapido (save_latest_snapshot / load_latest_snapshot).

pub mod service;

pub use service::LatestSnapshotService;

