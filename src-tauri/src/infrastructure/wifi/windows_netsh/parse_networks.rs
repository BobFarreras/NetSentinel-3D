// src-tauri/src/infrastructure/wifi/windows_netsh/parse_networks.rs

use crate::domain::entities::WifiScanRecord;

use super::pseudo_bssid::{percent_to_rssi, stable_pseudo_bssid};

pub fn parse_netsh_networks(text: &str) -> Vec<WifiScanRecord> {
    let mut records: Vec<WifiScanRecord> = Vec::new();
    let mut current_ssid: String = "<hidden>".to_string();
    let mut current_auth: String = "OPEN".to_string();
    let mut last_record_idx: Option<usize> = None;
    let mut current_ssid_has_bssid = false;

    for raw_line in text.lines() {
        let line = raw_line.trim();
        if line.is_empty() {
            continue;
        }

        let Some((left, right)) = line.split_once(':') else {
            continue;
        };
        let key = left.to_lowercase().replace(' ', "");
        let value = right.trim();

        if key.starts_with("ssid") {
            // Ej: "SSID 1 : MIWIFI"
            // Si el SSID anterior no tenia BSSID (Windows puede ocultarlo por privacidad),
            // generamos un registro sintetico para no devolver lista vacia.
            if !current_ssid.is_empty() && !current_ssid_has_bssid && current_ssid != "<hidden>" {
                records.push(WifiScanRecord {
                    bssid: stable_pseudo_bssid(&current_ssid, &current_auth),
                    ssid: current_ssid.clone(),
                    channel: None,
                    signal_level: -100,
                    security_type: current_auth.clone(),
                    is_connected: false,
                });
            }

            let ssid = value.trim();
            current_ssid = if ssid.is_empty() {
                "<hidden>".to_string()
            } else {
                ssid.to_string()
            };
            // Al cambiar SSID, reseteamos el "last" para no aplicar canal/senal cruzados.
            last_record_idx = None;
            current_ssid_has_bssid = false;
            continue;
        }

        if key.contains("autentic") || key.contains("auth") {
            current_auth = normalize_netsh_security(value);
            continue;
        }

        if key.starts_with("bssid") {
            let bssid = value.to_string();
            records.push(WifiScanRecord {
                bssid,
                ssid: current_ssid.clone(),
                channel: None,
                signal_level: -100,
                security_type: current_auth.clone(),
                is_connected: false,
            });
            last_record_idx = Some(records.len().saturating_sub(1));
            current_ssid_has_bssid = true;
            continue;
        }

        // "Señal" puede aparecer como "Señal" o "Senal" dependiendo de locale.
        if key.starts_with("señal") || key.starts_with("senal") || key.starts_with("signal") {
            if let Some(idx) = last_record_idx {
                let percent = value
                    .split('%')
                    .next()
                    .unwrap_or("")
                    .trim()
                    .parse::<i32>()
                    .unwrap_or(0);
                records[idx].signal_level = percent_to_rssi(percent);
            }
            continue;
        }

        if key.starts_with("canal") || key.starts_with("channel") {
            if let Some(idx) = last_record_idx {
                let ch = value.parse::<u16>().ok();
                records[idx].channel = ch;
            }
            continue;
        }
    }

    // Si el ultimo SSID no tenia BSSID, tambien generamos un registro sintetico.
    if !current_ssid.is_empty() && !current_ssid_has_bssid && current_ssid != "<hidden>" {
        records.push(WifiScanRecord {
            bssid: stable_pseudo_bssid(&current_ssid, &current_auth),
            ssid: current_ssid,
            channel: None,
            signal_level: -100,
            security_type: current_auth,
            is_connected: false,
        });
    }

    records
}

fn normalize_netsh_security(raw: &str) -> String {
    let s = raw.trim();
    if s.is_empty() {
        return "OPEN".to_string();
    }
    let lower = s.to_lowercase();
    if lower.contains("abierta") || lower.contains("open") {
        return "OPEN".to_string();
    }
    s.to_string()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parse_netsh_networks_extracts_bssid_signal_channel_and_auth() {
        let sample = include_str!("../fixtures/netsh_show_networks_es_with_bssid.txt");
        let parsed = parse_netsh_networks(sample);
        assert_eq!(parsed.len(), 2);
        assert_eq!(parsed[0].ssid, "LAB_OPEN");
        assert_eq!(parsed[0].bssid, "4c:b9:ea:e4:4c:f0");
        assert_eq!(parsed[0].channel, Some(6));
        assert_eq!(parsed[0].security_type, "OPEN");
        assert!(parsed[0].signal_level <= -30 && parsed[0].signal_level >= -100);

        assert_eq!(parsed[1].ssid, "LAB_WPA2");
        assert_eq!(parsed[1].channel, Some(100));
        assert_eq!(parsed[1].security_type, "WPA2-Personal");
    }

    #[test]
    fn parse_netsh_networks_falls_back_to_pseudo_bssid_when_hidden() {
        let sample = include_str!("../fixtures/netsh_show_networks_es_hidden.txt");
        let parsed = parse_netsh_networks(sample);
        assert_eq!(parsed.len(), 1);
        assert_eq!(parsed[0].ssid, "MIWIFI_UHeX");
        assert_eq!(parsed[0].security_type, "WPA2-Personal");
        assert_eq!(parsed[0].signal_level, -100);
        assert_eq!(parsed[0].channel, None);
        assert_eq!(parsed[0].bssid.len(), "00:00:00:00:00:00".len());
        assert!(!parsed[0].is_connected);
    }
}

