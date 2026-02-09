use std::net::Ipv4Addr;

pub fn validate_ipv4(value: &str, field: &str) -> Result<(), String> {
    let trimmed = value.trim();
    if trimmed.is_empty() {
        return Err(format!("{field} cannot be empty"));
    }
    if trimmed.parse::<Ipv4Addr>().is_err() {
        return Err(format!("{field} must be a valid IPv4 address"));
    }
    Ok(())
}

pub fn validate_usable_host_ipv4(value: &str, field: &str) -> Result<(), String> {
    validate_ipv4(value, field)?;
    let parsed = value
        .trim()
        .parse::<Ipv4Addr>()
        .map_err(|_| format!("{field} must be a valid IPv4 address"))?;

    if parsed.is_unspecified() {
        return Err(format!("{field} cannot be 0.0.0.0"));
    }
    if parsed.is_loopback() {
        return Err(format!("{field} cannot be a loopback address"));
    }
    if parsed.is_multicast() {
        return Err(format!("{field} cannot be a multicast address"));
    }
    if parsed.octets() == [255, 255, 255, 255] {
        return Err(format!("{field} cannot be a broadcast address"));
    }
    Ok(())
}

pub fn validate_ipv4_or_cidr(value: &str, field: &str) -> Result<(), String> {
    let trimmed = value.trim();
    if trimmed.is_empty() {
        return Err(format!("{field} cannot be empty"));
    }
    if trimmed.len() > 64 {
        return Err(format!("{field} is too long"));
    }

    let mut parts = trimmed.split('/');
    let base_ip = parts.next().unwrap_or_default();
    let prefix = parts.next();
    if parts.next().is_some() {
        return Err(format!("{field} format is invalid"));
    }

    validate_ipv4(base_ip, field)?;

    if let Some(prefix) = prefix {
        let parsed = prefix
            .parse::<u8>()
            .map_err(|_| format!("{field} CIDR prefix is invalid"))?;
        if parsed > 32 {
            return Err(format!("{field} CIDR prefix must be between 0 and 32"));
        }
    }
    Ok(())
}

pub fn validate_non_empty(value: &str, field: &str, max_len: usize) -> Result<(), String> {
    let trimmed = value.trim();
    if trimmed.is_empty() {
        return Err(format!("{field} cannot be empty"));
    }
    if trimmed.len() > max_len {
        return Err(format!("{field} exceeds maximum length ({max_len})"));
    }
    Ok(())
}

pub fn validate_mac_address(value: &str, field: &str) -> Result<(), String> {
    let trimmed = value.trim();
    if trimmed.is_empty() {
        return Err(format!("{field} cannot be empty"));
    }

    let bytes: Vec<&str> = trimmed.split(':').collect();
    if bytes.len() != 6 {
        return Err(format!("{field} must be a valid MAC address"));
    }

    for b in bytes {
        if b.len() != 2 || !b.chars().all(|c| c.is_ascii_hexdigit()) {
            return Err(format!("{field} must be a valid MAC address"));
        }
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn validate_ipv4_or_cidr_accepts_valid_values() {
        assert!(validate_ipv4_or_cidr("192.168.1.10", "range").is_ok());
        assert!(validate_ipv4_or_cidr("192.168.1.0/24", "range").is_ok());
    }

    #[test]
    fn validate_ipv4_or_cidr_rejects_invalid_values() {
        assert!(validate_ipv4_or_cidr("", "range").is_err());
        assert!(validate_ipv4_or_cidr("192.168.1.0/99", "range").is_err());
        assert!(validate_ipv4_or_cidr("192.168.1.0/24/7", "range").is_err());
        assert!(validate_ipv4_or_cidr("abc", "range").is_err());
    }

    #[test]
    fn validate_mac_address_rejects_invalid_mac() {
        assert!(validate_mac_address("AA:BB:CC:DD:EE:FF", "mac").is_ok());
        assert!(validate_mac_address("AA:BB:CC:DD:EE", "mac").is_err());
        assert!(validate_mac_address("AA:BB:CC:DD:EE:GG", "mac").is_err());
    }

    #[test]
    fn validate_usable_host_ipv4_rejects_non_usable_addresses() {
        assert!(validate_usable_host_ipv4("192.168.1.20", "ip").is_ok());
        assert!(validate_usable_host_ipv4("0.0.0.0", "ip").is_err());
        assert!(validate_usable_host_ipv4("127.0.0.1", "ip").is_err());
        assert!(validate_usable_host_ipv4("224.0.0.1", "ip").is_err());
        assert!(validate_usable_host_ipv4("255.255.255.255", "ip").is_err());
    }
}
