// src-tauri/src/infrastructure/network/vendor_resolver/normalize.rs

pub fn normalize_mac(raw: &str) -> String {
    raw.replace(":", "").replace("-", "").trim().to_uppercase()
}

pub fn is_locally_administered(clean_12_hex: &str) -> bool {
    // clean_12_hex debe tener como minimo 2 caracteres hex.
    if clean_12_hex.len() < 2 {
        return false;
    }

    let b0 = &clean_12_hex[0..2];
    match u8::from_str_radix(b0, 16) {
        Ok(v) => (v & 0x02) != 0,
        Err(_) => false,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn normalize_mac_removes_separators() {
        assert_eq!(normalize_mac("aa-bb:cc"), "AABBCC");
    }

    #[test]
    fn locally_administered_detection() {
        assert!(is_locally_administered("021122334455"));
        assert!(!is_locally_administered("001122334455"));
    }
}

