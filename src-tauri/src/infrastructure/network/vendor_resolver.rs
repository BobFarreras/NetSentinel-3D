// src-tauri/src/infrastructure/network/vendor_resolver.rs

use std::collections::HashMap;
use std::sync::OnceLock;

// Submodulos para separar responsabilidades (SOLID) sin cambiar la API publica del modulo.
#[path = "vendor_resolver/normalize.rs"]
mod normalize;
#[path = "vendor_resolver/store.rs"]
mod store;

// Resolver de fabricante a partir de MAC/BSSID.
//
// Objetivos:
// - Resolver rapido para UI (sin red).
// - Deteccion de MAC aleatoria (privacy / locally administered).
// - Permitir una base OUI ampliable via fichero en AppData (oui.json) con seed embebido.
pub struct VendorResolver;

static OUI_CACHE: OnceLock<HashMap<String, String>> = OnceLock::new();

impl VendorResolver {
    pub fn resolve(mac: &str) -> String {
        let raw = mac.trim();
        if raw.is_empty() || raw == "00:00:00:00:00:00" {
            return "Unknown".to_string();
        }

        let clean = normalize::normalize_mac(raw);
        if clean.len() < 12 {
            return "Invalid MAC".to_string();
        }

        // Si es 1, suele ser direccion aleatoria por privacidad o virtualizada.
        if normalize::is_locally_administered(&clean) {
            return "Private Device (Random MAC)".to_string();
        }

        let oui = &clean[0..6];
        Self::oui_map()
            .get(oui)
            .cloned()
            .unwrap_or_else(|| "Generic / Unknown Device".to_string())
    }

    fn oui_map() -> &'static HashMap<String, String> {
        OUI_CACHE.get_or_init(store::load_merged_oui_map)
    }

    // Seed opcional: si no existe `oui.json` en AppData, crea uno con una base minima.
    // Esto mejora el onboarding sin inflar el binario con un dataset completo.
    pub fn ensure_oui_seeded() {
        store::ensure_seeded();
    }
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
    fn resolve_uses_embedded_seed_map_for_known_ouis() {
        assert_eq!(VendorResolver::resolve("0C:47:C9:00:00:01"), "Amazon");
        assert_eq!(VendorResolver::resolve("B8:27:EB:00:00:01"), "Raspberry Pi");
    }

    #[test]
    fn resolve_rejects_invalid() {
        assert_eq!(VendorResolver::resolve(""), "Unknown");
        assert_eq!(VendorResolver::resolve("00:00:00:00:00:00"), "Unknown");
        assert_eq!(VendorResolver::resolve("AA:BB"), "Invalid MAC");
    }
}

