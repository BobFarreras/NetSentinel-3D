use crate::domain::entities::WifiScanRecord;
use crate::domain::ports::WifiScannerPort;
use async_trait::async_trait;
use std::process::Command;
use std::time::Duration;

#[cfg(windows)]
use windows::Win32::Foundation::{ERROR_SUCCESS, HANDLE};
#[cfg(windows)]
use windows::Win32::NetworkManagement::WiFi::{
    WlanCloseHandle, WlanEnumInterfaces, WlanFreeMemory, WlanOpenHandle, WlanScan,
    WLAN_INTERFACE_INFO_LIST,
};

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
            if let Ok(records) = scan_via_netsh().await {
                if !records.is_empty() {
                    return Ok(records);
                }
            }
        }

        // `wifiscanner::scan` es blocking; se ejecuta fuera del hilo async para no congelar UI.
        let networks: Vec<wifiscanner::Wifi> = tokio::task::spawn_blocking(|| -> Result<Vec<wifiscanner::Wifi>, String> {
            wifiscanner::scan().map_err(|e| format!("{e:?}"))
        })
        .await
        .map_err(|e| e.to_string())??;

        // Si el SO bloquea la consulta (ubicacion/elevacion), algunos wrappers devuelven lista vacia.
        // En ese caso, devolvemos error explicito para que el usuario no lo interprete como "0 redes".
        if networks.is_empty() {
            if let Some(msg) = diagnose_windows_wlan_block() {
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
}

async fn scan_via_netsh() -> Result<Vec<WifiScanRecord>, String> {
    // Windows tiende a cachear resultados. El panel de WiFi del SO fuerza un re-escaneo inmediato.
    // Para evitar el efecto "solo veo mi router hasta que abro Configuracion", forzamos un scan best-effort.
    if cfg!(windows) {
        trigger_windows_wlan_scan_best_effort().await;
        tokio::time::sleep(Duration::from_millis(650)).await;
    }

    let output = tokio::task::spawn_blocking(|| {
        Command::new("netsh")
            .args(["wlan", "show", "networks", "mode=bssid"])
            .output()
    })
    .await
    .map_err(|e| e.to_string())?
    .map_err(|e| e.to_string())?;

    let mut text = String::new();
    text.push_str(&String::from_utf8_lossy(&output.stdout));
    text.push_str(&String::from_utf8_lossy(&output.stderr));

    // Si netsh ya indica bloqueo, devolvemos error claro.
    let lower = text.to_lowercase();
    let mentions_location = lower.contains("permiso de ubic")
        || lower.contains("privacy-location")
        || lower.contains("ms-settings:privacy-location")
        || lower.contains("location permission");
    let mentions_elevation = lower.contains("requiere elev")
        || lower.contains("requires elevation")
        || lower.contains("error 5");

    if mentions_location || mentions_elevation {
        return Err(
            "Windows esta bloqueando el escaneo WiFi. Activa los servicios de ubicacion (Configuracion > Privacidad y seguridad > Ubicacion) y, si aplica, ejecuta la app con permisos elevados. Luego reintenta SCAN AIRWAVES.".to_string()
        );
    }

    let mut records = parse_netsh_networks(&text);

    // `show networks` a veces omite BSSID/canal/senal por privacidad/driver, pero `show interfaces`
    // si suele incluir esos datos al menos para la red actualmente conectada. Enriquecemos para dar
    // una experiencia coherente en el Radar (RSSI real, canal real, BSSID real).
    if let Ok(iface_text) = fetch_netsh_interfaces().await {
        if let Some(iface) = parse_netsh_interfaces(&iface_text) {
            if records.is_empty() {
                records.push(WifiScanRecord {
                    bssid: iface.ap_bssid.clone(),
                    ssid: iface.ssid.clone(),
                    channel: iface.channel,
                    signal_level: iface.rssi.unwrap_or(-100),
                    security_type: "OPEN".to_string(),
                    is_connected: true,
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
                        if r.bssid == stable_pseudo_bssid(&r.ssid, &r.security_type) {
                            r.bssid = iface.ap_bssid.clone();
                        }
                        r.is_connected = r.bssid == iface.ap_bssid;
                    }
                }
            }
        }
    }

    Ok(records)
}

#[cfg(windows)]
async fn trigger_windows_wlan_scan_best_effort() {
    // Ejecutamos el FFI en un hilo blocking para evitar bloquear el runtime async.
    let _ = tokio::task::spawn_blocking(|| unsafe {
        let mut negotiated_version: u32 = 0;
        let mut client_handle: HANDLE = HANDLE::default();

        let open_status = WlanOpenHandle(2, None, &mut negotiated_version, &mut client_handle);
        if open_status != ERROR_SUCCESS.0 {
            return;
        }

        let mut if_list_ptr: *mut WLAN_INTERFACE_INFO_LIST = std::ptr::null_mut();
        let enum_status = WlanEnumInterfaces(client_handle, None, &mut if_list_ptr);
        if enum_status != ERROR_SUCCESS.0 || if_list_ptr.is_null() {
            let _ = WlanCloseHandle(client_handle, None);
            return;
        }

        // WLAN_INTERFACE_INFO_LIST contiene un array inline de longitud variable.
        let list = &*if_list_ptr;
        let infos = std::slice::from_raw_parts(list.InterfaceInfo.as_ptr(), list.dwNumberOfItems as usize);
        for info in infos {
            // Scan asíncrono: solicita al driver que refresque el cache de redes.
            let _ = WlanScan(client_handle, &info.InterfaceGuid, None, None, None);
        }

        WlanFreeMemory(if_list_ptr as _);
        let _ = WlanCloseHandle(client_handle, None);
    })
    .await;
}

#[cfg(not(windows))]
async fn trigger_windows_wlan_scan_best_effort() {
    // No-op fuera de Windows.
}

fn parse_netsh_networks(text: &str) -> Vec<WifiScanRecord> {
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

        let Some((left, right)) = line.split_once(':') else { continue; };
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
            current_ssid = if ssid.is_empty() { "<hidden>".to_string() } else { ssid.to_string() };
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

fn percent_to_rssi(percent: i32) -> i32 {
    // Aproximacion defensiva:
    // 0% ~ -100 dBm, 100% ~ -30 dBm
    let p = percent.clamp(0, 100);
    -100 + (p * 70 / 100)
}

#[derive(Clone, Debug)]
struct NetshInterfaceIntel {
    ssid: String,
    ap_bssid: String,
    channel: Option<u16>,
    rssi: Option<i32>,
}

async fn fetch_netsh_interfaces() -> Result<String, String> {
    let output = tokio::task::spawn_blocking(|| {
        Command::new("netsh").args(["wlan", "show", "interfaces"]).output()
    })
    .await
    .map_err(|e| e.to_string())?
    .map_err(|e| e.to_string())?;

    let mut text = String::new();
    text.push_str(&String::from_utf8_lossy(&output.stdout));
    text.push_str(&String::from_utf8_lossy(&output.stderr));
    Ok(text)
}

fn parse_netsh_interfaces(text: &str) -> Option<NetshInterfaceIntel> {
    let mut ssid: Option<String> = None;
    let mut ap_bssid: Option<String> = None;
    let mut channel: Option<u16> = None;
    let mut rssi: Option<i32> = None;

    for raw_line in text.lines() {
        let line = raw_line.trim();
        if line.is_empty() {
            continue;
        }

        let Some((left, right)) = line.split_once(':') else { continue; };
        let key = left.to_lowercase().replace(' ', "");
        let value = right.trim();

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
    })
}

fn stable_pseudo_bssid(ssid: &str, auth: &str) -> String {
    // Cuando Windows oculta BSSID, necesitamos un id estable para que el frontend pueda
    // posicionar nodos sin jitter y permitir seleccion/filtros.
    // No es un MAC real; su objetivo es estabilidad (misma entrada => misma salida).
    //
    // FNV-1a 64-bit (implementacion simple, sin crates).
    let mut h: u64 = 14695981039346656037;
    for b in ssid.as_bytes().iter().chain([0u8].iter()).chain(auth.as_bytes().iter()) {
        h ^= *b as u64;
        h = h.wrapping_mul(1099511628211);
    }
    // Convertimos a un formato tipo MAC para reusar el pipeline actual.
    // Usamos 48 bits bajos del hash.
    let v = h & 0x0000_FFFF_FFFF_FFFF;
    let bytes = [
        ((v >> 40) & 0xFF) as u8,
        ((v >> 32) & 0xFF) as u8,
        ((v >> 24) & 0xFF) as u8,
        ((v >> 16) & 0xFF) as u8,
        ((v >> 8) & 0xFF) as u8,
        (v & 0xFF) as u8,
    ];
    format!(
        "{:02x}:{:02x}:{:02x}:{:02x}:{:02x}:{:02x}",
        bytes[0], bytes[1], bytes[2], bytes[3], bytes[4], bytes[5]
    )
}

fn diagnose_windows_wlan_block() -> Option<String> {
    // Diagnostico best-effort. No requiere exito del comando; precisamente queremos el texto de error.
    // Esto evita que el usuario piense que el radar "no detecta nada" cuando en realidad es un bloqueo del SO.
    if !cfg!(windows) {
        return None;
    }

    let output = Command::new("netsh")
        .args(["wlan", "show", "networks", "mode=bssid"])
        .output()
        .ok()?;

    let mut text = String::new();
    text.push_str(&String::from_utf8_lossy(&output.stdout));
    text.push_str(&String::from_utf8_lossy(&output.stderr));
    let lower = text.to_lowercase();

    let mentions_location = lower.contains("permiso de ubicación")
        || lower.contains("location permission")
        || lower.contains("privacy-location")
        || lower.contains("ms-settings:privacy-location");
    let mentions_elevation = lower.contains("requiere elevación")
        || lower.contains("requires elevation")
        || lower.contains("error 5");

    if !mentions_location && !mentions_elevation {
        return None;
    }

    Some(
        "Windows esta bloqueando el escaneo WiFi. Activa los servicios de ubicacion (Configuracion > Privacidad y seguridad > Ubicacion) y, si aplica, ejecuta la app con permisos elevados. Luego reintenta SCAN AIRWAVES.".to_string()
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn diagnose_keywords_detection_is_stable() {
        // No ejecutamos netsh en tests. Solo validamos que la funcion existe y compila.
        // La logica real depende de cfg(windows) y del entorno del usuario.
        let _ = diagnose_windows_wlan_block();
    }

    #[test]
    fn parse_netsh_networks_extracts_bssid_signal_channel_and_auth() {
        let sample = r#"
Nombre de interfaz : Wi-Fi
Actualmente hay 2 redes visibles.

SSID 1 : LAB_OPEN
    Autenticación           : Abierta
    BSSID 1                 : 4c:b9:ea:e4:4c:f0
         Señal             : 39%
         Canal            : 6

SSID 2 : LAB_WPA2
    Autenticación           : WPA2-Personal
    BSSID 1                 : 3c:58:5d:d3:68:e5
         Señal             : 85%
         Canal            : 100
"#;

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
        // En algunos Windows/drivers, `netsh wlan show networks mode=bssid` lista SSID/auth
        // pero no incluye BSSID/canal/senal por privacidad. No debemos devolver 0 redes.
        let sample = r#"
Nombre de interfaz : Wi-Fi
Actualmente hay 1 redes visibles.

SSID 1 : MIWIFI_UHeX
    Tipo de red             : Infraestructura
    Autenticación           : WPA2-Personal
    Cifrado                 : CCMP
"#;

        let parsed = parse_netsh_networks(sample);
        assert_eq!(parsed.len(), 1);
        assert_eq!(parsed[0].ssid, "MIWIFI_UHeX");
        assert_eq!(parsed[0].security_type, "WPA2-Personal");
        assert_eq!(parsed[0].signal_level, -100);
        assert_eq!(parsed[0].channel, None);
        assert_eq!(parsed[0].bssid.len(), "00:00:00:00:00:00".len());
        assert!(!parsed[0].is_connected);
    }

    #[test]
    fn parse_netsh_interfaces_extracts_connected_link_intel() {
        let sample = r#"
Hay 1 interfaz en el sistema:

    Nombre                   : Wi-Fi
    Estado                  : conectado
    SSID                   : MIWIFI_UHeX
    AP BSSID               : 3c:58:5d:d3:68:e5
    Banda                 : 5 GHz
    Canal: 100
    Señal                           : 85%
    Rssi           : -44
"#;

        let parsed = parse_netsh_interfaces(sample).expect("must parse");
        assert_eq!(parsed.ssid, "MIWIFI_UHeX");
        assert_eq!(parsed.ap_bssid, "3c:58:5d:d3:68:e5");
        assert_eq!(parsed.channel, Some(100));
        assert_eq!(parsed.rssi, Some(-44));
    }
}
