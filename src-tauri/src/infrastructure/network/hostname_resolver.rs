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
                    // Filtro defensivo: algunos entornos devuelven "localhost" para hosts remotos.
                    // Solo aceptamos "localhost" si la IP es loopback.
                    if hostname.eq_ignore_ascii_case("localhost") && !ip_addr.is_loopback() {
                        return None;
                    }
                    return Some(hostname);
                }
            }
        }
        None
    }
}
