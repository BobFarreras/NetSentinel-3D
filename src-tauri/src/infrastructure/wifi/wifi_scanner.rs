use crate::domain::entities::WifiScanRecord;
use crate::domain::ports::WifiScannerPort;
use async_trait::async_trait;

pub struct SystemWifiScanner;

impl SystemWifiScanner {
    pub fn new() -> Self {
        Self
    }
}

#[async_trait]
impl WifiScannerPort for SystemWifiScanner {
    async fn scan_airwaves(&self) -> Result<Vec<WifiScanRecord>, String> {
        // `wifiscanner::scan` es blocking; se ejecuta fuera del hilo async para no congelar UI.
        let networks: Vec<wifiscanner::Wifi> = tokio::task::spawn_blocking(
            || -> Result<Vec<wifiscanner::Wifi>, String> { wifiscanner::scan().map_err(|e| format!("{e:?}")) },
        )
            .await
            .map_err(|e| e.to_string())??;

        let records = networks
            .into_iter()
            .map(|net| {
                let signal_level = net.signal_level.parse::<i32>().unwrap_or(-100);
                let channel = net.channel.parse::<u16>().ok();
                WifiScanRecord {
                    bssid: net.mac,
                    ssid: net.ssid,
                    channel,
                    signal_level,
                    security_type: net.security,
                }
            })
            .collect();

        Ok(records)
    }
}
