// src-tauri/src/infrastructure/system_scanner/enrich.rs

use crate::domain::entities::Device;
use crate::infrastructure::network::{arp_client::ArpClient, hostname_resolver::HostnameResolver, vendor_resolver::VendorResolver};
use crate::infrastructure::repositories::local_intelligence;

pub fn enrich_ips(active_ips: &[String]) -> Vec<Device> {
    let my_identity = local_intelligence::get_host_identity().ok();
    let my_ip = my_identity.as_ref().map(|id| id.ip.clone()).unwrap_or_default();
    let my_mac = my_identity.as_ref().map(|id| id.mac.clone()).unwrap_or_default();

    let arp_table = ArpClient::get_table();

    let mut devices = Vec::with_capacity(active_ips.len());
    for ip in active_ips {
        let (mac, vendor) = resolve_mac_vendor(ip, &my_ip, &my_mac, &arp_table);

        let hostname = resolve_hostname(ip, &my_ip);
        let name = hostname.clone();

        devices.push(Device {
            ip: ip.clone(),
            mac,
            vendor,
            hostname,
            name,
            is_gateway: is_gateway_ip(ip),
            ping: Some(10),
            signal_strength: None,
            signal_rate: None,
            wifi_band: None,
            open_ports: None,
        });
    }

    devices
}

fn is_gateway_ip(ip: &str) -> bool {
    // Regla pragmatica: en redes /24 tipicas, el gateway suele ser el .1.
    ip.ends_with(".1")
}

fn resolve_mac_vendor(
    ip: &str,
    my_ip: &str,
    my_mac: &str,
    arp_table: &std::collections::HashMap<String, String>,
) -> (String, String) {
    if ip == my_ip {
        return (my_mac.to_string(), "NETSENTINEL (HOST)".to_string());
    }

    let mac = arp_table
        .get(ip)
        .cloned()
        .unwrap_or_else(|| "00:00:00:00:00:00".to_string());

    let vendor = VendorResolver::resolve(&mac);
    (mac, vendor)
}

fn resolve_hostname(ip: &str, my_ip: &str) -> Option<String> {
    let mut hostname = HostnameResolver::resolve(ip);

    // Filtro adicional: algunos entornos devuelven "localhost" para hosts remotos.
    if hostname
        .as_deref()
        .map(|s| s.eq_ignore_ascii_case("localhost"))
        .unwrap_or(false)
    {
        if ip != my_ip && ip != "127.0.0.1" {
            hostname = None;
        }
    }

    hostname
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn gateway_heuristic() {
        assert!(is_gateway_ip("192.168.1.1"));
        assert!(!is_gateway_ip("192.168.1.2"));
    }
}

