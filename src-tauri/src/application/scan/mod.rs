// src-tauri/src/application/scan/mod.rs
// Caso de uso de escaneo: agrupa servicios relacionados con scan_network y audit_target (migracion progresiva desde `scanner_service`).

pub mod service;

pub use service::ScannerService;

