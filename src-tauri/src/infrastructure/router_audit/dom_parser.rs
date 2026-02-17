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
    let re_ip_word = Regex::new(r"(?i)\bip\b").unwrap();
    // Captura IP aunque el firmware cambie el formato del label:
    // - "IP: 192.168.1.10"
    // - "IP ADDR: 192.168.1.10"
    // - "IP address: 192.168.1.10"
    // - "Dirección IP: 192.168.1.10"
    //
    // Nota: hacemos match sobre `\bip\b` para evitar falsos positivos con "BSSID".
    let re_ip_line = Regex::new(r"(?i)\bip\b[^0-9]*((?:\d{1,3}\.){3}\d{1,3})").unwrap();
    let re_mac = Regex::new(r"(?i)([0-9a-f]{2}[:-]){5}[0-9a-f]{2}").unwrap();

    let is_zero_mac = |mac: &str| -> bool {
        mac.trim().eq_ignore_ascii_case("00:00:00:00:00:00")
            || mac.trim().eq_ignore_ascii_case("00-00-00-00-00-00")
    };

    let is_ip_label_only = |raw: &str| -> bool {
        let s = raw.trim();
        if s.is_empty() {
            return false;
        }
        let lower = s.to_lowercase();
        if lower.contains("bssid") {
            return false;
        }
        // Debe contener la palabra "ip" pero NO debe incluir ya una IP numerica.
        if !re_ip_word.is_match(s) {
            return false;
        }
        if re_ip_line.is_match(s) {
            return false;
        }
        // Evita labels "IP123" o casos con numeros pegados.
        if s.chars().any(|c| c.is_ascii_digit()) {
            return false;
        }
        true
    };

    let mut i = 0;
    while i < lines.len() {
        let line = lines[i].trim();
        if line.contains("5 GHz") {
            current_band = "5 GHz".to_string();
        }
        if line.contains("2.4 GHz") {
            current_band = "2.4 GHz".to_string();
        }

        let ip_from_inline = re_ip_line.captures(line).and_then(|caps| {
            caps.get(1).map(|m| m.as_str().trim().to_string())
        });

        // Algunos firmwares pintan el label y el valor en lineas separadas:
        //   "IP ADDR:"
        //   "192.168.1.140"
        let ip_from_next_line = if ip_from_inline.is_none()
            && re_ip.is_match(line)
            && i > 0
            && is_ip_label_only(lines[i - 1])
        {
            Some(line.to_string())
        } else {
            None
        };

        let is_ip_from_next_line = ip_from_next_line.is_some();

        if let Some(ip) = ip_from_inline.or(ip_from_next_line) {
            if ip.is_empty() {
                i += 1;
                continue;
            }

            // Si el firmware pinta "IP ADDR:" en una linea y el valor en la siguiente,
            // la linea de label (i-1) pertenece AL MISMO bloque. No debe cortar el back-scan del nombre.
            let current_ip_label_idx = if is_ip_from_next_line { i.checked_sub(1) } else { None };

            // Nombre/alias del dispositivo (si existe).
            let mut name_found: Option<String> = None;
            let mut k = 1usize;
            while i >= k {
                let candidate = lines[i - k].trim();

                // Borde duro entre bloques: si al retroceder tocamos una linea que ya contiene otra IP,
                // significa que hemos entrado en el dispositivo anterior. En ese caso, este dispositivo
                // NO tiene nombre (o no se ha podido extraer) y no debemos reutilizar el nombre previo.
                if re_ip_line.is_match(candidate) {
                    break;
                }
                // Variante firmware: el valor de IP puede estar en linea separada (solo "192.168.x.x").
                // Si encontramos una IP distinta a la actual, hemos cruzado al bloque anterior.
                if re_ip.is_match(candidate) && candidate != ip {
                    break;
                }
                // Variante firmware: el label "IP ..." puede estar en una linea sin el valor.
                // Si lo encontramos al retroceder, estamos entrando en el bloque anterior.
                if is_ip_label_only(candidate) {
                    // Caso especial: el label inmediatamente anterior es del MISMO device (ip en linea separada).
                    if current_ip_label_idx == Some(i - k) {
                        k += 1;
                        continue;
                    }
                    break;
                }

                if candidate.is_empty()
                    || candidate.starts_with("Signal")
                    || candidate.contains("GHz")
                    || candidate.contains("connected devices")
                    || candidate.to_lowercase().starts_with("ip:")
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
            for txt in lines.iter().take(end + 1).skip(i) {
                if let Some(m) = re_mac.find(txt) {
                    let normalized = m.as_str().replace('-', ":").to_uppercase();
                    // Algunos firmwares pintan "00:00:00:00:00:00" como placeholder. Si existe una MAC real
                    // en el bloque, no debemos quedarnos con el placeholder.
                    if is_zero_mac(&normalized) {
                        continue;
                    }
                    mac_found = Some(normalized);
                    break;
                }
            }

            // Fallback defensivo: algunos firmwares muestran la MAC inmediatamente antes del "IP:".
            if mac_found.is_none() {
                let start = i.saturating_sub(3);
                for txt in lines.iter().take(i).skip(start) {
                    if let Some(m) = re_mac.find(txt) {
                        let normalized = m.as_str().replace('-', ":").to_uppercase();
                        if is_zero_mac(&normalized) {
                            continue;
                        }
                        mac_found = Some(normalized);
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
                        signal = next.replace("Signal strength:", "").trim().to_string();
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

    #[test]
    fn parse_router_text_ignora_mac_placeholder_ceros_si_hay_otra_mac_en_bloque() {
        let sample = r#"
MiRouter
IP: 192.168.1.40
MAC: 00:00:00:00:00:00
MAC address: 48-E7-DA-F5-7D-0F
"#;
        let d = parse_router_text(sample);
        assert_eq!(d.len(), 1);
        assert_eq!(d[0].ip, "192.168.1.40");
        assert_eq!(d[0].mac.as_deref(), Some("48:E7:DA:F5:7D:0F"));
    }

    #[test]
    fn parse_router_text_no_reutiliza_nombre_si_el_bloque_siguiente_no_tiene_nombre() {
        // Reproduce un caso real: el segundo bloque solo trae `IP:` (sin "Device name" arriba)
        // y antes el parser tomaba el nombre del dispositivo anterior.
        let sample = r#"
M2004J19C
IP: 192.168.1.139
Signal strength: -53 dBm
Signal rate: 6 Mbps
IP: 192.168.1.140
Signal strength: -29 dBm
Signal rate: 6 Mbps
"#;

        let d = parse_router_text(sample);
        assert_eq!(d.len(), 2);
        assert_eq!(d[0].ip, "192.168.1.139");
        assert_eq!(d[0].name.as_deref(), Some("M2004J19C"));
        assert_eq!(d[1].ip, "192.168.1.140");
        assert_eq!(d[1].name, None);
    }

    #[test]
    fn parse_router_text_soporta_ip_label_y_valor_en_lineas_separadas_y_no_roba_nombre() {
        // Firmware: "IP ADDR:" y el valor en la siguiente linea.
        let sample = r#"
M2004J19C
IP ADDR:
192.168.1.139
Signal strength: -53 dBm
Signal rate: 6 Mbps
IP ADDR:
192.168.1.140
Signal strength: -29 dBm
Signal rate: 6 Mbps
"#;

        let d = parse_router_text(sample);
        assert_eq!(d.len(), 2);
        assert_eq!(d[0].ip, "192.168.1.139");
        assert_eq!(d[0].name.as_deref(), Some("M2004J19C"));
        assert_eq!(d[1].ip, "192.168.1.140");
        assert_eq!(d[1].name, None);
    }
}
