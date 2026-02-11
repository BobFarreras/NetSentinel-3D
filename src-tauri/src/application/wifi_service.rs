// src-tauri/src/application/wifi_service.rs

use std::sync::Arc;

use crate::domain::entities::{WifiEntity, WifiScanRecord};
use crate::domain::ports::{VendorLookupPort, WifiScannerPort};

use crate::application::wifi_normalizer;

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
}

#[cfg(test)]
mod tests {
    use super::*;
    use async_trait::async_trait;

    struct MockWifiScanner;

    #[async_trait]
    impl WifiScannerPort for MockWifiScanner {
        async fn scan_airwaves(&self) -> Result<Vec<WifiScanRecord>, String> {
            Ok(vec![WifiScanRecord {
                bssid: "0C:47:C9:00:00:01".to_string(),
                ssid: "TEST".to_string(),
                channel: Some(1),
                signal_level: -40,
                security_type: "wpa2".to_string(),
                is_connected: false,
            }])
        }
    }

    struct MockVendorLookup;

    impl VendorLookupPort for MockVendorLookup {
        fn resolve_vendor(&self, _mac_or_bssid: &str) -> String {
            "Amazon".to_string()
        }
    }

    #[tokio::test]
    async fn wifi_service_uses_vendor_lookup_and_normalizes() {
        let service = WifiService::new(Arc::new(MockWifiScanner), Arc::new(MockVendorLookup));
        let out = service.scan_airwaves().await.unwrap();
        assert_eq!(out.len(), 1);
        assert_eq!(out[0].vendor, "Amazon");
        assert_eq!(out[0].risk_level, "STANDARD");
    }
}

