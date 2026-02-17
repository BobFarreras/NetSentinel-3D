// src-tauri/src/application/http_fingerprint/mod.rs
// Caso de uso HTTP fingerprint: HEAD a HTTP/HTTPS y veredicto basico (headers, redirects y cookies).

pub mod service;

pub use service::{HttpFingerprintResult, HttpFingerprintService, HttpProbeResult};

