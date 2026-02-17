// src-tauri/src/infrastructure/wifi/windows_netsh/parse_interfaces.rs

use super::pseudo_bssid::stable_pseudo_bssid;

#[derive(Clone, Debug)]
pub struct NetshInterfaceIntel {
    pub ssid: String,
    pub ap_bssid: String,
    pub channel: Option<u16>,
    pub rssi: Option<i32>,
    pub is_connected: bool,
}

pub fn parse_netsh_interfaces(text: &str) -> Option<NetshInterfaceIntel> {
    let normalized_text = text.replace("\r\n", "\n");
    let mut parsed: Vec<NetshInterfaceIntel> = normalized_text
        .split("\n\n")
        .filter_map(parse_interface_block)
        .collect();

    // Priorizamos bloque conectado; fallback a primer bloque con SSID.
    if let Some(idx) = parsed.iter().position(|i| i.is_connected) {
        return Some(parsed.swap_remove(idx));
    }
    parsed.into_iter().next()
}

fn parse_interface_block(block: &str) -> Option<NetshInterfaceIntel> {
    let mut is_connected = false;
    let mut ssid: Option<String> = None;
    let mut ap_bssid: Option<String> = None;
    let mut channel: Option<u16> = None;
    let mut rssi: Option<i32> = None;

    for raw_line in block.lines() {
        let line = raw_line.trim();
        if line.is_empty() {
            continue;
        }

        let Some((left, right)) = line.split_once(':') else {
            continue;
        };
        let key = left.to_lowercase().replace(' ', "");
        let value = right.trim();

        if key == "estado" || key == "state" {
            let normalized_state = value.to_lowercase();
            is_connected = normalized_state == "conectado" || normalized_state == "connected";
            continue;
        }

        if key == "ssid" {
            if !value.is_empty() {
                ssid = Some(value.to_string());
            }
            continue;
        }

        // "AP BSSID" puede aparecer como "AP BSSID" o similar.
        if key == "apbssid" || key.ends_with("bssid") && key.contains("ap") {
            if !value.is_empty() {
                ap_bssid = Some(value.to_string());
            }
            continue;
        }

        if key.starts_with("canal") || key.starts_with("channel") {
            channel = value.parse::<u16>().ok();
            continue;
        }

        if key == "rssi" {
            rssi = value.parse::<i32>().ok();
            continue;
        }
    }

    let ssid_value = ssid?;
    let ap_bssid_value = ap_bssid.unwrap_or_else(|| stable_pseudo_bssid(&ssid_value, "OPEN"));

    Some(NetshInterfaceIntel {
        ssid: ssid_value,
        ap_bssid: ap_bssid_value,
        channel,
        rssi,
        is_connected,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parse_netsh_interfaces_extracts_connected_link_intel() {
        let sample = include_str!("../fixtures/netsh_show_interfaces_es.txt");
        let intel = parse_netsh_interfaces(sample).expect("intel");
        assert_eq!(intel.ssid, "MIWIFI_UHeX");
        assert_eq!(intel.ap_bssid, "3c:58:5d:d3:68:e5");
        assert_eq!(intel.channel, Some(100));
        assert_eq!(intel.rssi, Some(-40));
        assert!(intel.is_connected);
    }

    #[test]
    fn parse_netsh_interfaces_prioritizes_connected_block_when_multiple_interfaces() {
        let sample = r#"
Hay 2 interfaces en el sistema:

    Nombre                   : Wi-Fi
    Estado                  : conectado
    SSID                   : MIWIFI_UHeX
    AP BSSID               : 3c:58:5d:d3:68:e5
    Canal                  : 100
    RSSI                   : -40

    Nombre                   : Wi-Fi 2
    Estado                  : desconectado
"#;

        let intel = parse_netsh_interfaces(sample).expect("intel");
        assert_eq!(intel.ssid, "MIWIFI_UHeX");
        assert!(intel.is_connected);
    }
}
