use std::sync::Arc;

use crate::domain::entities::{WifiEntity, WifiScanRecord};
use crate::domain::ports::WifiScannerPort;
use crate::infrastructure::network::vendor_resolver::VendorResolver;

pub struct WifiService {
    scanner: Arc<dyn WifiScannerPort>,
}

impl WifiService {
    pub fn new(scanner: Arc<dyn WifiScannerPort>) -> Self {
        Self { scanner }
    }

    pub async fn scan_airwaves(&self) -> Result<Vec<WifiEntity>, String> {
        let records = self.scanner.scan_airwaves().await?;
        Ok(records.into_iter().map(Self::normalize_record).collect())
    }

    fn normalize_record(record: WifiScanRecord) -> WifiEntity {
        let bssid = record.bssid.trim().to_string();
        let vendor = VendorResolver::resolve(&bssid);

        let ssid = sanitize_ssid(&record.ssid);
        let security_type = normalize_security(&record.security_type);
        let signal_level = clamp_signal(record.signal_level);
        let distance_mock = distance_from_signal(signal_level);
        let risk_level = classify_risk_level(&security_type);
        let is_targetable = matches!(risk_level.as_str(), "LEGACY" | "OPEN");

        WifiEntity {
            bssid,
            ssid,
            channel: record.channel,
            signal_level,
            security_type,
            vendor,
            distance_mock,
            risk_level,
            is_targetable,
            is_connected: record.is_connected,
        }
    }
}

fn clamp_signal(value: i32) -> i32 {
    // RSSI tipico: -30 (muy fuerte) ... -90 (muy debil). Usamos -100 como fallback.
    if value > -1 {
        return -1;
    }
    if value < -100 {
        return -100;
    }
    value
}

fn sanitize_ssid(raw: &str) -> String {
    // Sanitizacion defensiva: elimina caracteres de control y limita longitud.
    let filtered: String = raw
        .chars()
        .filter(|c| !c.is_control())
        .collect::<String>()
        .trim()
        .to_string();

    if filtered.is_empty() {
        return "<hidden>".to_string();
    }
    filtered.chars().take(64).collect()
}

fn normalize_security(raw: &str) -> String {
    let s = raw.trim();
    if s.is_empty() {
        return "OPEN".to_string();
    }
    s.to_uppercase()
}

fn classify_risk_level(security: &str) -> String {
    let s = security.to_uppercase();
    if s.contains("WPA3") || s.contains("ENTERPRISE") {
        return "HARDENED".to_string();
    }
    if s.contains("WPA2") {
        return "STANDARD".to_string();
    }
    if s.contains("WEP") {
        return "LEGACY".to_string();
    }
    if s.contains("OPEN") {
        return "OPEN".to_string();
    }
    "STANDARD".to_string()
}

fn distance_from_signal(signal_level: i32) -> f32 {
    // Mapa simple para visualizacion:
    // -30dBm => cerca (dist ~ 10), -90dBm => lejos (dist ~ 60)
    let abs = signal_level.abs() as f32;
    let raw = abs - 20.0;
    raw.clamp(5.0, 60.0)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn sanitize_ssid_hides_empty_and_removes_control_chars() {
        assert_eq!(sanitize_ssid(""), "<hidden>");
        assert_eq!(sanitize_ssid("   "), "<hidden>");
        assert_eq!(sanitize_ssid("abc\u{0000}\u{0007}def"), "abcdef");
    }

    #[test]
    fn normalize_security_defaults_to_open() {
        assert_eq!(normalize_security(""), "OPEN");
        assert_eq!(normalize_security("  wpa2-psk  "), "WPA2-PSK");
    }

    #[test]
    fn classify_risk_level_handles_common_cases() {
        assert_eq!(classify_risk_level("WPA3"), "HARDENED");
        assert_eq!(classify_risk_level("WPA2-PSK"), "STANDARD");
        assert_eq!(classify_risk_level("WEP"), "LEGACY");
        assert_eq!(classify_risk_level("OPEN"), "OPEN");
    }

    #[test]
    fn distance_from_signal_is_clamped() {
        assert_eq!(distance_from_signal(-30.0 as i32), 10.0);
        assert_eq!(distance_from_signal(-90.0 as i32), 60.0);
        assert_eq!(distance_from_signal(-100.0 as i32), 60.0);
    }

    #[test]
    fn normalize_record_sets_vendor_and_targetable_flag() {
        let record = WifiScanRecord {
            bssid: "B8:27:EB:AA:BB:CC".to_string(),
            ssid: "".to_string(),
            channel: Some(6),
            signal_level: -55,
            security_type: "open".to_string(),
            is_connected: false,
        };

        let entity = WifiService::normalize_record(record);
        assert_eq!(entity.ssid, "<hidden>");
        assert_eq!(entity.channel, Some(6));
        assert_eq!(entity.risk_level, "OPEN");
        assert!(entity.is_targetable);
        assert!(!entity.vendor.is_empty());
    }
}
