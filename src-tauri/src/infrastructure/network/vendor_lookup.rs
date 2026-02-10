// src-tauri/src/infrastructure/network/vendor_lookup.rs

use crate::domain::ports::VendorLookupPort;

use super::vendor_resolver::VendorResolver;

// Adaptador simple para inyectar resolucion de vendor (OUI) via puertos del dominio.
pub struct SystemVendorLookup;

impl VendorLookupPort for SystemVendorLookup {
    fn resolve_vendor(&self, mac_or_bssid: &str) -> String {
        VendorResolver::resolve(mac_or_bssid)
    }
}

