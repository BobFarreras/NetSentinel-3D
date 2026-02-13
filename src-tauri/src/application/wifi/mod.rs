// src-tauri/src/application/wifi/mod.rs
// Caso de uso WiFi: escaneo de airwaves, normalizacion de registros y (opcional) conexion a SSID.

pub mod normalizer;
pub mod service;

pub use service::WifiService;

