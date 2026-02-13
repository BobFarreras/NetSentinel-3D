// src-tauri/src/infrastructure/system_scanner/mod.rs
// Descripcion: adaptador de infraestructura para escaneo de red/puertos e identidad local (default-net) via `NetworkScannerPort`.

use crate::domain::entities::{Device, OpenPort, HostIdentity};
use crate::domain::ports::NetworkScannerPort;
use async_trait::async_trait;
use default_net;

// Submodulos
mod discover;
mod enrich;
mod ports;
mod sort;

pub struct SystemScanner;

#[async_trait]
impl NetworkScannerPort for SystemScanner {
    async fn scan_network(&self, subnet_base: &str) -> Vec<Device> {
        println!("🛠️ [INFRA] Escaneando subnet base: {}.x", subnet_base);
        let active_ips = discover::discover_active_ips(subnet_base);
        let mut devices = enrich::enrich_ips(&active_ips);
        devices.sort_by(|a, b| sort::human_sort(&a.ip, &b.ip));
        devices
    }

    async fn scan_ports(&self, ip: &str) -> Vec<OpenPort> {
        ports::scan_common_ports(ip)
    }

    fn probe_tcp_banner(&self, ip: &str, port: u16) -> Option<String> {
        crate::infrastructure::network::port_scanner::PortScanner::scan_service(ip, port)
    }

    // 👇 IMPLEMENTACIÓN COMPATIBLE CON DEFAULT-NET v0.22.0
    fn get_host_identity(&self) -> Result<HostIdentity, String> {
        match default_net::get_default_interface() {
            Ok(interface) => {
                // IP: En v0.22 ipv4 es un Vec<Ipv4Network>, cogemos la dirección (.addr)
                let ip = interface.ipv4.get(0)
                    .map(|net| net.addr.to_string())
                    .unwrap_or_else(|| "0.0.0.0".to_string());
                
                // MAC: Es un objeto MacAddr, hay que convertirlo a String
                let mac = interface.mac_addr
                    .map(|m| m.to_string()) 
                    .unwrap_or_else(|| "00:00:00:00:00:00".to_string());
                
                // Gateway: Es un objeto Gateway, cogemos .ip_addr
                let gateway_ip = interface.gateway.as_ref()
                    .map(|g| g.ip_addr.to_string())
                    .unwrap_or_else(|| "0.0.0.0".to_string());

                let dns_servers = vec![]; 

                Ok(HostIdentity {
                    ip,
                    mac,
                    netmask: "255.255.255.0".to_string(),
                    gateway_ip,      
                    interface_name: interface.name, 
                    dns_servers,     
                })
            },
            Err(e) => Err(format!("Error obteniendo interfaz de red: {}", e))
        }
    }
}
