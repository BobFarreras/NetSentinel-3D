// src-tauri/src/infrastructure/router_audit/dom_parser.rs

use regex::Regex;

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct ParsedRouterDevice {
    pub ip: String,
    pub name: Option<String>,
    pub mac: Option<String>,
    pub signal_strength: Option<String>,
    pub signal_rate: Option<String>,
    pub wifi_band: Option<String>,
}

// Parser puro del texto de DOM extraido del panel del router.
// Debe ser tolerante a:
// - idiomas/firmwares distintos
// - campos ausentes
// - ruido (lineas vacias, encabezados)
//
// Regla: NO resolver vendor ni ARP aqui. Eso es enrichment (otra responsabilidad).
pub fn parse_router_text(text: &str) -> Vec<ParsedRouterDevice> {
    let mut devices = Vec::new();
    let lines: Vec<&str> = text.split('\n').collect();
    let mut current_band = "2.4 GHz".to_string();

    let re_ip = Regex::new(r"^(?:\d{1,3}\.){3}\d{1,3}$").unwrap();
    let re_mac = Regex::new(r"(?i)([0-9a-f]{2}[:-]){5}[0-9a-f]{2}").unwrap();

    let mut i = 0;
    while i < lines.len() {
        let line = lines[i].trim();
        if line.contains("5 GHz") {
            current_band = "5 GHz".to_string();
        }
        if line.contains("2.4 GHz") {
            current_band = "2.4 GHz".to_string();
        }

        if line.starts_with("IP:") {
            let ip = line.replace("IP:", "").trim().to_string();

            // Nombre/alias del dispositivo (si existe).
            let mut name_found: Option<String> = None;
            let mut k = 1usize;
            while i >= k {
                let candidate = lines[i - k].trim();
                if candidate.is_empty()
                    || candidate.starts_with("Signal")
                    || candidate.contains("GHz")
                    || candidate.contains("connected devices")
                    || re_ip.is_match(candidate)
                {
                    k += 1;
                    if k > 10 {
                        break;
                    }
                    continue;
                }
                name_found = Some(candidate.to_string());
                break;
            }

            // Si el nombre acaba siendo la IP, lo descartamos.
            if let Some(n) = &name_found {
                if n.trim() == ip {
                    name_found = None;
                }
            }

            // MAC (si aparece en el bloque del dispositivo).
            let mut mac_found: Option<String> = None;
            // Buscamos primero hacia delante para evitar capturar la MAC del dispositivo anterior.
            // Muchos firmwares colocan la MAC debajo del bloque (despues de "IP:").
            let end = (i + 12).min(lines.len().saturating_sub(1));
            for idx in i..=end {
                let txt = lines[idx];
                if let Some(m) = re_mac.find(txt) {
                    mac_found = Some(m.as_str().replace('-', ":").to_uppercase());
                    break;
                }
            }

            // Fallback defensivo: algunos firmwares muestran la MAC inmediatamente antes del "IP:".
            if mac_found.is_none() {
                let start = i.saturating_sub(3);
                for idx in start..i {
                    let txt = lines[idx];
                    if let Some(m) = re_mac.find(txt) {
                        mac_found = Some(m.as_str().replace('-', ":").to_uppercase());
                        break;
                    }
                }
            }

            let mut signal = "-".to_string();
            let mut rate = "-".to_string();
            for j in 1..6 {
                if i + j < lines.len() {
                    let next = lines[i + j].trim();
                    if next.starts_with("Signal strength:") {
                        signal = next
                            .replace("Signal strength:", "")
                            .trim()
                            .to_string();
                    }
                    if next.starts_with("Signal rate:") {
                        rate = next.replace("Signal rate:", "").trim().to_string();
                    }
                }
            }

            devices.push(ParsedRouterDevice {
                ip,
                name: name_found,
                mac: mac_found,
                signal_strength: Some(signal),
                signal_rate: Some(rate),
                wifi_band: Some(current_band.clone()),
            });
        }

        i += 1;
    }

    devices
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parse_router_text_detecta_ip_nombre_y_mac() {
        let sample = r#"
Redmi-15
IP: 192.168.1.130
Signal strength: -83 dBm
Signal rate: 6 Mbps
MAC address DE:95:77:0F:09:71
"#;

        let d = parse_router_text(sample);
        assert_eq!(d.len(), 1);
        assert_eq!(d[0].ip, "192.168.1.130");
        assert_eq!(d[0].name.as_deref(), Some("Redmi-15"));
        assert_eq!(d[0].mac.as_deref(), Some("DE:95:77:0F:09:71"));
        assert_eq!(d[0].signal_strength.as_deref(), Some("-83 dBm"));
        assert_eq!(d[0].signal_rate.as_deref(), Some("6 Mbps"));
        assert_eq!(d[0].wifi_band.as_deref(), Some("2.4 GHz"));
    }

    #[test]
    fn parse_router_text_cambia_banda_segun_contexto() {
        let sample = r#"
5 GHz
Laptop
IP: 192.168.1.10
Signal strength: -40 dBm
Signal rate: 390 Mbps
"#;
        let d = parse_router_text(sample);
        assert_eq!(d.len(), 1);
        assert_eq!(d[0].wifi_band.as_deref(), Some("5 GHz"));
    }

    #[test]
    fn parse_router_text_fixture_basic_es() {
        let sample = include_str!("./fixtures/router_dom_basic_es.txt");
        let d = parse_router_text(sample);
        assert_eq!(d.len(), 2);
        assert_eq!(d[0].ip, "192.168.1.130");
        assert_eq!(d[0].name.as_deref(), Some("Redmi-15"));
        assert_eq!(d[0].mac.as_deref(), Some("DE:95:77:0F:09:71"));
        // Normaliza '-' a ':' y uppercase
        assert_eq!(d[1].mac.as_deref(), Some("48:E7:DA:F5:7D:0F"));
    }

    #[test]
    fn parse_router_text_fixture_noise_descarta_nombre_si_es_ip_y_acepta_missing_mac() {
        let sample = include_str!("./fixtures/router_dom_noise_missing_mac.txt");
        let d = parse_router_text(sample);
        assert_eq!(d.len(), 2);
        // La primera entrada tiene "nombre" que es una IP (linea previa), debe descartarse.
        assert_eq!(d[0].ip, "192.168.1.40");
        assert_eq!(d[0].name, None);
        assert_eq!(d[0].mac, None);
        assert_eq!(d[0].wifi_band.as_deref(), Some("5 GHz"));

        assert_eq!(d[1].ip, "192.168.1.10");
        assert_eq!(d[1].name.as_deref(), Some("Laptop-Office"));
        assert_eq!(d[1].mac, None);
    }
}
