// src-tauri/src/domain/security/mac_validator.rs

pub struct MacValidator;

impl MacValidator {
    /// Determina si una MAC es "Locally Administered" (Spoofed/Random)
    /// Basado en el bit LAA (Locally Administered Address).
    /// x2:.., x6:.., xA:.., xE:.. indican dirección local.
    pub fn is_spoofed(mac: &str) -> bool {
        let clean_mac = mac.replace(":", "").replace("-", "");
        
        if clean_mac.len() < 2 {
            return false;
        }

        // Cogemos el segundo carácter (índice 1)
        if let Some(second_char) = clean_mac.chars().nth(1) {
            match second_char.to_ascii_uppercase() {
                '2' | '6' | 'A' | 'E' => true,
                _ => false,
            }
        } else {
            false
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_spoofed_macs() {
        assert!(MacValidator::is_spoofed("02:00:00:00:00:00")); // 2 -> Spoofed
        assert!(MacValidator::is_spoofed("06:1A:2B:3C:4D:5E")); // 6 -> Spoofed
        assert!(MacValidator::is_spoofed("0A:AA:BB:CC:DD:EE")); // A -> Spoofed
        assert!(MacValidator::is_spoofed("0E:12:34:56:78:90")); // E -> Spoofed
    }

    #[test]
    fn test_real_macs() {
        assert!(!MacValidator::is_spoofed("00:00:00:00:00:00")); // 0 -> Real (Intel, etc)
        assert!(!MacValidator::is_spoofed("14:F2:33:44:55:66")); // 4 -> Real
        assert!(!MacValidator::is_spoofed("AC:BC:32:11:22:33")); // C -> Real
    }
}