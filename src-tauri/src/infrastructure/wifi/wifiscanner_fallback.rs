// src-tauri/src/infrastructure/wifi/wifiscanner_fallback.rs

use crate::domain::entities::WifiScanRecord;

// Fallback cross-platform basado en crate `wifiscanner`.
// Regla: ejecutar en `spawn_blocking` para no bloquear la UI (runtime async).
pub async fn scan_via_wifiscanner() -> Result<Vec<WifiScanRecord>, String> {
    let networks: Vec<wifiscanner::Wifi> =
        tokio::task::spawn_blocking(|| -> Result<Vec<wifiscanner::Wifi>, String> {
            wifiscanner::scan().map_err(|e| format!("{e:?}"))
        })
        .await
        .map_err(|e| e.to_string())??;

    // Si el SO bloquea la consulta (ubicacion/elevacion), algunos wrappers devuelven lista vacia.
    // En ese caso, devolvemos error explicito para que el usuario no lo interprete como "0 redes".
    if networks.is_empty() {
        if let Some(msg) = super::windows_netsh::diagnose_windows_wlan_block() {
            return Err(msg);
        }
    }

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
                is_connected: false,
            }
        })
        .collect();

    Ok(records)
}

