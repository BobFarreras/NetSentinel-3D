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
