// src-tauri/src/infrastructure/network/vendor_resolver/store.rs

use directories::ProjectDirs;
use std::collections::HashMap;
use std::fs;

use super::normalize::normalize_mac;

const OUI_SEED_JSON: &str = include_str!("../oui_seed.json");

pub fn load_merged_oui_map() -> HashMap<String, String> {
    let seed = seed_map();

    // AppData es opcional y puede variar por maquina. En tests evitamos usarlo para mantener determinismo.
    #[cfg(test)]
    {
        return seed;
    }

    #[cfg(not(test))]
    {
        let mut merged = seed;
        for (k, v) in appdata_map().into_iter() {
            merged.insert(k, v);
        }
        merged
    }
}

pub fn ensure_seeded() {
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

fn seed_map() -> HashMap<String, String> {
    let Ok(map) = serde_json::from_str::<HashMap<String, String>>(OUI_SEED_JSON) else {
        return HashMap::new();
    };
    normalize_map_keys(map)
}

#[cfg(not(test))]
fn appdata_map() -> HashMap<String, String> {
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
    normalize_map_keys(map)
}

fn normalize_map_keys(map: HashMap<String, String>) -> HashMap<String, String> {
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
    fn seed_map_parses_and_contains_known_vendor() {
        let map = seed_map();
        assert_eq!(map.get("0C47C9").map(|s| s.as_str()), Some("Amazon"));
    }

    #[test]
    fn normalize_map_keys_accepts_separators() {
        let mut raw = HashMap::new();
        raw.insert("0c:47:c9".to_string(), "Amazon".to_string());
        let map = normalize_map_keys(raw);
        assert_eq!(map.get("0C47C9").map(|s| s.as_str()), Some("Amazon"));
    }
}
