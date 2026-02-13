// src-tauri/src/application/opsec/mod.rs
// Caso de uso OpSec: valida estado de MAC (spoof) y ejecuta randomize_mac coordinando settings + mac changer.

pub mod mac_changer;
pub mod service;

pub use mac_changer::MacChangerService;
pub use service::OpSecService;
