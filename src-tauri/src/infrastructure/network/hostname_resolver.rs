use dns_lookup::lookup_addr;
use std::net::IpAddr;
use std::str::FromStr;

pub struct HostnameResolver;

impl HostnameResolver {
    pub fn resolve(ip: &str) -> Option<String> {
        if let Ok(ip_addr) = IpAddr::from_str(ip) {
            // Intentem fer la resolució inversa (IP -> Nom)
            if let Ok(hostname) = lookup_addr(&ip_addr) {
                // De vegades retorna la mateixa IP si falla, ho filtrem
                if hostname != ip {
                    return Some(hostname);
                }
            }
        }
        None
    }
}