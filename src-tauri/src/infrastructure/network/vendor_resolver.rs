use directories::ProjectDirs;
use std::collections::HashMap;
use std::fs;
use std::sync::OnceLock;

// Resolver de fabricante a partir de MAC/BSSID.
//
// Objetivos:
// - Resolver rapido para UI (sin red).
// - Deteccion de MAC aleatoria (privacy / locally administered).
// - Permitir una base OUI ampliable via fichero en AppData (oui.json).
//
// Formato oui.json (ejemplo):
// {
//   "B827EB": "Raspberry Pi",
//   "2462AB": "Espressif"
// }
pub struct VendorResolver;

static OUI_CACHE: OnceLock<HashMap<String, String>> = OnceLock::new();
const OUI_SEED_JSON: &str = include_str!("oui_seed.json");

impl VendorResolver {
    pub fn resolve(mac: &str) -> String {
        if mac.trim().is_empty() {
            return "Unknown".to_string();
        }
        if mac.trim() == "00:00:00:00:00:00" {
            return "Unknown".to_string();
        }

        let clean = normalize_mac(mac);
        if clean.len() < 12 {
            return "Invalid MAC".to_string();
        }

        // Detecta MAC "locally administered" (bit U/L del primer octeto).
        // Si es 1, suele ser direccion aleatoria por privacidad o virtualizada.
        if is_locally_administered(&clean) {
            return "Private Device (Random MAC)".to_string();
        }

        let oui = &clean[0..6];

        // 1) Lookup via fichero ampliable (AppData).
        if let Some(v) = Self::oui_map().get(oui) {
            return v.clone();
        }

        // 2) Fallback embebido (minimo razonable).
        match oui {
            // Apple
            "B06EBF" | "D8305F" | "ACBC32" | "A4D18C" | "28CFE9" | "0017F2" | "001C4D" | "002332" => {
                "Apple".to_string()
            }
            // Samsung
            "E47DBD" | "80E650" | "7C04D0" | "24F5AA" | "BC20A4" | "C4731E" => "Samsung".to_string(),
            // Xiaomi / Redmi / Poco
            "ACF7F3" | "146B9C" | "28D0EA" | "342E81" | "50EC50" | "6490C1" | "FC64B9" => "Xiaomi".to_string(),
            // Amazon (Alexa/FireTV)
            "0C47C9" | "34D270" | "38F73D" | "40B4CD" | "50325F" | "7475F7" | "8871E5" | "FCA667" => {
                "Amazon".to_string()
            }
            // Espressif IoT
            "2462AB" | "246F28" | "24A160" | "30AEA4" | "540F57" | "600194" | "7CDFA1" | "84F3EB" | "F008D1" => {
                "Espressif (IoT)".to_string()
            }
            // Raspberry Pi
            "B827EB" | "E45F01" | "28CDC1" => "Raspberry Pi".to_string(),
            // Intel / Realtek (NICs comunes)
            "8086F2" | "F4CE46" => "Intel".to_string(),
            "00E04C" | "E4F042" => "Realtek".to_string(),
            // TP-Link (routers/iot)
            "B04E26" | "D807B6" | "1CC64B" | "E894F6" | "F81A67" => "TP-Link".to_string(),
            _ => "Generic / Unknown Device".to_string(),
        }
    }

    fn oui_map() -> &'static HashMap<String, String> {
        OUI_CACHE.get_or_init(load_oui_map_from_appdata)
    }

    // Seed opcional: si no existe `oui.json` en AppData, crea uno con una base minima.
    // Esto mejora el onboarding sin inflar el binario con un dataset completo.
    pub fn ensure_oui_seeded() {
        let Some(proj_dirs) = ProjectDirs::from("com", "netsentinel", "app") else {
            return;
        };
        let path = proj_dirs.data_dir().join("oui.json");
        if path.exists() {
            return;
        }
        let _ = fs::create_dir_all(proj_dirs.data_dir());
        // Solo escribimos si el JSON embedded parece valido.
        if serde_json::from_str::<HashMap<String, String>>(OUI_SEED_JSON).is_ok() {
            let _ = fs::write(path, OUI_SEED_JSON);
        }
    }
}

fn normalize_mac(raw: &str) -> String {
    raw.replace(":", "")
        .replace("-", "")
        .trim()
        .to_uppercase()
}

fn is_locally_administered(clean_12_hex: &str) -> bool {
    // clean_12_hex debe tener como minimo 2 caracteres hex.
    let b0 = &clean_12_hex[0..2];
    if let Ok(v) = u8::from_str_radix(b0, 16) {
        return (v & 0x02) != 0;
    }
    false
}

fn load_oui_map_from_appdata() -> HashMap<String, String> {
    // Si existe un fichero en AppData, lo usamos como "fuente de verdad" para OUI.
    // Si falla, devolvemos mapa vacio y se usara el fallback embebido.
    let Some(proj_dirs) = ProjectDirs::from("com", "netsentinel", "app") else {
        return HashMap::new();
    };
    let path = proj_dirs.data_dir().join("oui.json");
    if !path.exists() {
        return HashMap::new();
    }
    let Ok(content) = fs::read_to_string(path) else {
        return HashMap::new();
    };
    let Ok(map) = serde_json::from_str::<HashMap<String, String>>(&content) else {
        return HashMap::new();
    };

    // Normalizamos keys a 6 hex sin separadores.
    map.into_iter()
        .filter_map(|(k, v)| {
            let key = normalize_mac(&k);
            if key.len() >= 6 {
                Some((key[0..6].to_string(), v))
            } else {
                None
            }
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn resolve_detects_locally_administered_mac() {
        // 02:xx... => bit U/L activo.
        assert_eq!(
            VendorResolver::resolve("02:11:22:33:44:55"),
            "Private Device (Random MAC)"
        );
    }

    #[test]
    fn normalize_mac_removes_separators() {
        assert_eq!(normalize_mac("aa-bb:cc"), "AABBCC");
    }
}
