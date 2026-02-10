// src-tauri/src/infrastructure/router_audit/enrichment.rs

use std::collections::HashMap;

use crate::domain::entities::Device;
use crate::infrastructure::network::{arp_client::ArpClient, vendor_resolver::VendorResolver};

use super::dom_parser::ParsedRouterDevice;

// Enriquecimiento local:
// - Si el router no expone MAC en su UI, intentamos resolverla via tabla ARP local.
// - Resolvemos vendor por OUI en una fase posterior al parseo.
pub fn enrich_router_devices(parsed: Vec<ParsedRouterDevice>) -> Vec<Device> {
    let arp_table = ArpClient::get_table();
    enrich_router_devices_with_arp(parsed, &arp_table)
}

fn enrich_router_devices_with_arp(
    parsed: Vec<ParsedRouterDevice>,
    arp_table: &HashMap<String, String>,
) -> Vec<Device> {
    parsed
        .into_iter()
        .map(|p| {
            let mac_from_dom = p.mac.unwrap_or_else(|| "00:00:00:00:00:00".to_string());
            let mut mac = mac_from_dom;
            if mac == "00:00:00:00:00:00" {
                if let Some(m) = arp_table.get(&p.ip) {
                    mac = m.replace('-', ":").to_uppercase();
                }
            }

            let vendor = VendorResolver::resolve(&mac);
            let name = p.name.clone();

            Device {
                ip: p.ip,
                mac,
                vendor,
                hostname: name.clone(),
                name,
                is_gateway: false,
                ping: None,
                signal_strength: p.signal_strength,
                signal_rate: p.signal_rate,
                wifi_band: p.wifi_band,
                open_ports: None,
            }
        })
        .collect()
}

