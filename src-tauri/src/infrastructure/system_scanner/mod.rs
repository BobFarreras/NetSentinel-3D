// src-tauri/src/infrastructure/system_scanner/mod.rs
// Descripcion: adaptador de infraestructura para escaneo de red/puertos e identidad local.

use crate::domain::entities::{Device, HostIdentity, OpenPort};
use crate::domain::ports::NetworkScannerPort;
use async_trait::async_trait;
use default_net;

// --- CORRECCIÓ AQUÍ ---
// Fem 'pub' el mòdul ports perquè service.rs pugui importar 'scan_specific_ports'
mod discover;
mod enrich;
pub mod ports; // <--- AQUESTA ÉS LA CLAU (abans era 'mod ports;')
mod sort;

pub struct SystemScanner;

#[async_trait]
impl NetworkScannerPort for SystemScanner {
    // ... (resta del codi igual) ...
    async fn scan_network(&self, subnet_base: &str) -> Vec<Device> {
        println!("🛠️ [INFRA] Escaneando subnet base: {}.x", subnet_base);
        let active_ips = discover::discover_active_ips(subnet_base);
        let my_identity = self.get_host_identity().ok();
        let mut devices = enrich::enrich_ips(&active_ips, my_identity.as_ref());
        devices.sort_by(|a, b| sort::human_sort(&a.ip, &b.ip));
        devices
    }

    async fn scan_ports(&self, ip: &str) -> Vec<OpenPort> {
        ports::scan_common_ports(ip)
    }

    fn probe_tcp_banner(&self, ip: &str, port: u16) -> Option<String> {
        crate::infrastructure::network::port_scanner::PortScanner::scan_service(ip, port)
    }
    
    // ... (resta d'implementació get_host_identity igual) ...
    fn get_host_identity(&self) -> Result<HostIdentity, String> {
        match default_net::get_default_interface() {
            Ok(interface) => {
                let ip = interface.ipv4.first().map(|n| n.addr.to_string()).unwrap_or("0.0.0.0".to_string());
                let mac = interface.mac_addr.map(|m| m.to_string()).unwrap_or("00:00:00:00:00:00".to_string());
                let gateway_ip = interface.gateway.as_ref().map(|g| g.ip_addr.to_string()).unwrap_or("0.0.0.0".to_string());
                
                Ok(HostIdentity {
                    ip,
                    mac,
                    netmask: "255.255.255.0".to_string(),
                    gateway_ip,
                    interface_name: interface.name,
                    dns_servers: vec![],
                })
            }
            Err(e) => Err(format!("Error: {}", e)),
        }
    }
}