// src-tauri/src/api/commands/internal_validation.rs

use crate::api::validators::{validate_ipv4_or_cidr, validate_non_empty, validate_usable_host_ipv4};
use crate::api::validators::validate_mac_address;

pub fn validate_scan_range(range: &Option<String>) -> Result<(), String> {
    if let Some(raw) = range {
        validate_ipv4_or_cidr(raw, "range")?;
    }
    Ok(())
}

pub fn validate_router_credentials_input(gateway_ip: &str, user: &str, pass: &str) -> Result<(), String> {
    validate_usable_host_ipv4(gateway_ip, "gateway_ip")?;
    validate_non_empty(user, "user", 64)?;
    validate_non_empty(pass, "pass", 128)?;
    Ok(())
}

pub fn validate_start_jamming_input(ip: &str, mac: &str, gateway_ip: &str) -> Result<(), String> {
    validate_usable_host_ipv4(ip, "ip")?;
    validate_mac_address(mac, "mac")?;
    validate_usable_host_ipv4(gateway_ip, "gateway_ip")?;
    if ip.trim() == gateway_ip.trim() {
        return Err("ip and gateway_ip cannot be the same".to_string());
    }
    Ok(())
}

pub fn validate_stop_jamming_input(ip: &str) -> Result<(), String> {
    validate_usable_host_ipv4(ip, "ip")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn validate_scan_range_accepts_none_and_valid_value() {
        assert!(validate_scan_range(&None).is_ok());
        assert!(validate_scan_range(&Some("192.168.1.0/24".to_string())).is_ok());
    }

    #[test]
    fn validate_scan_range_rejects_invalid_value() {
        assert!(validate_scan_range(&Some("192.168.1.0/99".to_string())).is_err());
    }

    #[test]
    fn validate_router_credentials_rejects_invalid_input() {
        assert!(validate_router_credentials_input("x.y.z.w", "admin", "1234").is_err());
        assert!(validate_router_credentials_input("192.168.1.1", "", "1234").is_err());
        assert!(validate_router_credentials_input("192.168.1.1", "admin", "").is_err());
        assert!(validate_router_credentials_input("127.0.0.1", "admin", "1234").is_err());
    }

    #[test]
    fn validate_start_jamming_input_accepts_valid_values() {
        assert!(validate_start_jamming_input("192.168.1.20", "AA:BB:CC:DD:EE:FF", "192.168.1.1").is_ok());
    }

    #[test]
    fn validate_start_jamming_input_rejects_invalid_values() {
        assert!(validate_start_jamming_input("bad-ip", "AA:BB:CC:DD:EE:FF", "192.168.1.1").is_err());
        assert!(validate_start_jamming_input("192.168.1.20", "BAD-MAC", "192.168.1.1").is_err());
        assert!(validate_start_jamming_input("192.168.1.20", "AA:BB:CC:DD:EE:FF", "bad-ip").is_err());
        assert!(validate_start_jamming_input("192.168.1.1", "AA:BB:CC:DD:EE:FF", "192.168.1.1").is_err());
    }

    #[test]
    fn validate_stop_jamming_input_rejects_invalid_ip() {
        assert!(validate_stop_jamming_input("192.168.1.50").is_ok());
        assert!(validate_stop_jamming_input("not-an-ip").is_err());
        assert!(validate_stop_jamming_input("127.0.0.1").is_err());
    }
}
