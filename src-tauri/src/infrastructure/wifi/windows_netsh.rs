// src-tauri/src/infrastructure/wifi/windows_netsh.rs

use crate::domain::entities::WifiScanRecord;
use std::time::Duration;

// Submodulos para separar responsabilidades (SOLID) sin cambiar la API del modulo.
#[path = "windows_netsh/diagnostics.rs"]
mod diagnostics;
#[path = "windows_netsh/ffi_scan_trigger.rs"]
mod ffi_scan_trigger;
#[path = "windows_netsh/netsh_exec.rs"]
mod netsh_exec;
#[path = "windows_netsh/parse_interfaces.rs"]
mod parse_interfaces;
#[path = "windows_netsh/parse_networks.rs"]
mod parse_networks;
#[path = "windows_netsh/pseudo_bssid.rs"]
mod pseudo_bssid;

#[allow(unused_imports)]
pub use diagnostics::diagnose_windows_wlan_block;

// Re-exports: este modulo actua como facade publica. Aunque desde este archivo no se usen
// directamente, otros modulos (y tests) dependen de estas funciones/tipos.
#[allow(unused_imports)]
pub use parse_interfaces::{parse_netsh_interfaces, NetshInterfaceIntel};
#[allow(unused_imports)]
pub use parse_networks::parse_netsh_networks;
#[allow(unused_imports)]
pub use pseudo_bssid::stable_pseudo_bssid;

pub async fn scan_via_netsh() -> Result<Vec<WifiScanRecord>, String> {
    // Windows tiende a cachear resultados. El panel de WiFi del SO fuerza un re-escaneo inmediato.
    // Para evitar el efecto "solo veo mi router hasta que abro Configuracion", forzamos un scan best-effort.
    if cfg!(windows) {
        ffi_scan_trigger::trigger_windows_wlan_scan_best_effort().await;
        tokio::time::sleep(Duration::from_millis(650)).await;
    }

    let text = netsh_exec::netsh_show_networks_mode_bssid().await?;

    // Si netsh ya indica bloqueo, devolvemos error claro.
    if diagnostics::is_windows_wifi_blocked(&text) {
        return Err(diagnostics::blocked_message());
    }

    let mut records = parse_networks::parse_netsh_networks(&text);

    // `show networks` a veces omite BSSID/canal/senal por privacidad/driver, pero `show interfaces`
    // si suele incluir esos datos al menos para la red actualmente conectada.
    if let Ok(iface_text) = netsh_exec::netsh_show_interfaces().await {
        if let Some(iface) = parse_interfaces::parse_netsh_interfaces(&iface_text) {
            if records.is_empty() {
                records.push(WifiScanRecord {
                    bssid: iface.ap_bssid.clone(),
                    ssid: iface.ssid.clone(),
                    channel: iface.channel,
                    signal_level: iface.rssi.unwrap_or(-100),
                    security_type: "OPEN".to_string(),
                    is_connected: iface.is_connected,
                });
            } else {
                for r in records.iter_mut() {
                    if r.ssid == iface.ssid {
                        // Si el BSSID es sintetico o falta info, la sustituimos por datos reales del enlace.
                        if r.signal_level == -100 {
                            if let Some(rssi) = iface.rssi {
                                r.signal_level = rssi;
                            }
                        }
                        if r.channel.is_none() {
                            r.channel = iface.channel;
                        }
                        if r.bssid == pseudo_bssid::stable_pseudo_bssid(&r.ssid, &r.security_type) {
                            r.bssid = iface.ap_bssid.clone();
                        }
                        r.is_connected = iface.is_connected && r.bssid == iface.ap_bssid;
                    }
                }
            }
        }
    }

    Ok(records)
}
