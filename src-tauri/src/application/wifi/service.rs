// src-tauri/src/application/wifi/service.rs
// Servicio WiFi: escanea redes cercanas y normaliza registros (vendor/risk), y permite conectar a una red (Windows).

use std::sync::Arc;

use crate::domain::entities::{WifiEntity, WifiScanRecord};
use crate::domain::ports::{VendorLookupPort, WifiScannerPort, WifiConnectorPort};
use super::normalizer;

pub struct WifiService {
    scanner: Arc<dyn WifiScannerPort>,
    vendor_lookup: Arc<dyn VendorLookupPort>,
    connector: Arc<dyn WifiConnectorPort>,
}

impl WifiService {
    pub fn new(
        scanner: Arc<dyn WifiScannerPort>,
        vendor_lookup: Arc<dyn VendorLookupPort>,
        connector: Arc<dyn WifiConnectorPort>,
    ) -> Self {
        Self {
            scanner,
            vendor_lookup,
            connector,
        }
    }

    pub async fn scan_airwaves(&self) -> Result<Vec<WifiEntity>, String> {
        let records = self.scanner.scan_airwaves().await?;
        Ok(records
            .into_iter()
            .map(|r| self.normalize_record(r))
            .collect())
    }

    fn normalize_record(&self, record: WifiScanRecord) -> WifiEntity {
        let bssid = record.bssid.trim().to_string();
        let vendor = self.vendor_lookup.resolve_vendor(&bssid);
        normalizer::normalize_record(record, vendor)
    }

    // --- NUEVO MÉTODO ---
    pub async fn connect_to_network(&self, ssid: String, password: String) -> Result<bool, String> {
        if password.len() < 8 { return Ok(false); }

        // Clonamos las variables para pasarlas al hilo.
        let ssid_clone = ssid.clone();
        let pass_clone = password.clone();
        let connector = self.connector.clone();

        let result = tauri::async_runtime::spawn_blocking(move || {
            connector.connect(&ssid_clone, &pass_clone)
        })
        .await
        .map_err(|e| e.to_string())??;

        Ok(result)
    }
}
