// src-tauri/src/infrastructure/wifi/wifi_scanner.rs

use crate::domain::entities::WifiScanRecord;
use crate::domain::ports::WifiScannerPort;
use async_trait::async_trait;

use super::wifiscanner_fallback;

pub struct SystemWifiScanner;

impl SystemWifiScanner {
    pub fn new() -> Self {
        Self
    }
}

#[async_trait]
impl WifiScannerPort for SystemWifiScanner {
    async fn scan_airwaves(&self) -> Result<Vec<WifiScanRecord>, String> {
        // En Windows, `netsh` suele ser mas fiable que wrappers cross-platform en hardware/driver variados.
        // Si esta disponible, lo preferimos para evitar "NO SE DETECTAN REDES" cuando el sistema SI ve redes.
        if cfg!(windows) {
            if let Ok(records) = super::windows_netsh::scan_via_netsh().await {
                if !records.is_empty() {
                    return Ok(records);
                }
            }
        }

        // Fallback cross-platform (blocking => spawn_blocking).
        wifiscanner_fallback::scan_via_wifiscanner().await
    }
}

