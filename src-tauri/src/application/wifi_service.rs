// src-tauri/src/application/wifi_service.rs

use std::sync::Arc;

use crate::domain::entities::{WifiEntity, WifiScanRecord};
use crate::domain::ports::{VendorLookupPort, WifiScannerPort};
use crate::application::wifi_normalizer;
// Importamos la infraestructura
use crate::infrastructure::wifi::wifi_connector::WifiConnector;

pub struct WifiService {
    scanner: Arc<dyn WifiScannerPort>,
    vendor_lookup: Arc<dyn VendorLookupPort>,
}

impl WifiService {
    pub fn new(scanner: Arc<dyn WifiScannerPort>, vendor_lookup: Arc<dyn VendorLookupPort>) -> Self {
        Self {
            scanner,
            vendor_lookup,
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
        wifi_normalizer::normalize_record(record, vendor)
    }

    // --- NUEVO MÉTODO ---
    pub async fn connect_to_network(&self, ssid: String, password: String) -> Result<bool, String> {
        if password.len() < 8 { return Ok(false); }

        // CLONAMOS las variables para pasarlas al hilo (SOLUCIONA EL ERROR DE MOVED VALUE)
        let ssid_clone = ssid.clone();
        let pass_clone = password.clone();

        let result = tauri::async_runtime::spawn_blocking(move || {
            WifiConnector::connect(&ssid_clone, &pass_clone)
        }).await.map_err(|e| e.to_string())?;

        Ok(result)
    }
}