use crate::domain::entities::{Device, OpenPort};
use crate::domain::ports::NetworkScannerPort;
use crate::infrastructure::network::{
    arp_client::ArpClient, ping_executor::PingExecutor, port_scanner::PortScanner,
    vendor_resolver::VendorResolver,
    hostname_resolver::HostnameResolver, // 👈 IMPORT IMPORTANT
};
use crate::infrastructure::repositories::local_intelligence;
use async_trait::async_trait;
use std::sync::{Arc, Mutex};
use std::thread;

pub struct SystemScanner;
// ❌ ESBORRA AQUESTA LÍNIA: pub struct HostnameResolver; 

#[async_trait]
impl NetworkScannerPort for SystemScanner {
    
    async fn scan_network(&self, subnet_base: &str) -> Vec<Device> {
        println!("🛠️ INFRA: Scanning subnet {}...", subnet_base);

        let my_identity = local_intelligence::get_host_identity().ok();
        let my_ip = my_identity.as_ref().map(|id| id.ip.clone()).unwrap_or_default();
        let my_mac = my_identity.as_ref().map(|id| id.mac.clone()).unwrap_or_default();

        let detected_ips = Arc::new(Mutex::new(Vec::new()));
        let mut handles = vec![];

        // FASE 1: PING (Paral·lel)
        for i in 1..255 {
            let ip_target = format!("{}.{}", subnet_base, i);
            let ips_clone = Arc::clone(&detected_ips);

            handles.push(thread::spawn(move || {
                if PingExecutor::is_alive(&ip_target) {
                    ips_clone.lock().unwrap().push(ip_target);
                }
            }));
        }

        for handle in handles {
            let _ = handle.join();
        }

        // FASE 2: ARP & VENDOR & HOSTNAME
        let arp_table = ArpClient::get_table();
        let active_ips = detected_ips.lock().unwrap();
        let mut devices = Vec::new();

        for ip in active_ips.iter() {
            let mut mac = arp_table.get(ip).cloned().unwrap_or("00:00:00:00:00:00".to_string());
            let mut vendor = VendorResolver::resolve(&mac); 
            
            // SI ÉS LA MEVA IP
            if *ip == my_ip {
                mac = my_mac.clone();
                vendor = "NETSENTINEL (HOST)".to_string();
            }

            // 🕵️ NIVELL 2: Resolució de Hostname
            let hostname_found = HostnameResolver::resolve(ip);
            
            // LOG DE DEBUG
            if let Some(ref h) = hostname_found {
                println!("🔎 NAME FOUND per {}: {}", ip, h);
            }

            // Preparem els camps opcionals
            let (hostname, name) = if let Some(h) = hostname_found {
                (Some(h.clone()), Some(h))
            } else {
                (None, None)
            };

            devices.push(Device {
                ip: ip.clone(),
                mac,
                vendor: vendor.clone(), // Clone perquè la fem servir al println després
                hostname, // 👈 Passem el resultat real
                name,     // 👈 Passem el resultat real
                is_gateway: ip.ends_with(".1"),
                ping: Some(10),
                signal_strength: None,
                signal_rate: None,
                wifi_band: None,
                open_ports: None,
            });
        }

        // Sort simple
        devices.sort_by(|a, b| human_sort(&a.ip, &b.ip));

        // INFORME FINAL
        println!("--------------------------------------------------");
        println!("📊 [INFORME D'ESCANEIG] RESULTATS DE LA XARXA");
        println!("--------------------------------------------------");
        println!("Hosts Trobats: {}", devices.len());
        for dev in &devices {
            let icon = if dev.is_gateway {
                "⛩️ GATEWAY"
            } else if dev.vendor.contains("Apple") {
                "🍎 APPLE"
            } else {
                "📱 DEVICE"
            };
            
            // Mostrem el hostname si en té
            let name_display = dev.hostname.as_deref().unwrap_or("");
            
            println!(
                "   > {} \tMAC: {} \tVENDOR: {} \tNAME: {} \t{}",
                dev.ip, dev.mac, dev.vendor, name_display, icon
            );
        }
        println!("--------------------------------------------------");

        devices
    }

    async fn scan_ports(&self, ip: &str) -> Vec<OpenPort> {
        let common_ports = [21, 22, 23, 25, 53, 80, 110, 139, 443, 445, 3389, 8080];
        let mut open_ports = Vec::new();
        let mut handles = vec![];
        let ip_target = ip.to_string();

        for &port in common_ports.iter() {
            let target = ip_target.clone();
            handles.push(thread::spawn(move || {
                if PortScanner::check_port(&target, port) {
                    Some(port)
                } else {
                    None
                }
            }));
        }

        for h in handles {
            if let Ok(Some(port)) = h.join() {
                open_ports.push(OpenPort {
                    port,
                    status: "Open".to_string(),
                    service: "Unknown".to_string(),
                    risk_level: "Unknown".to_string(),
                    description: None,
                    vulnerability: None,
                });
            }
        }
        open_ports
    }
}

// Helper petit per ordenar IPs
fn human_sort(ip_a: &str, ip_b: &str) -> std::cmp::Ordering {
    let a_last: u8 = ip_a.split('.').last().unwrap_or("0").parse().unwrap_or(0);
    let b_last: u8 = ip_b.split('.').last().unwrap_or("0").parse().unwrap_or(0);
    a_last.cmp(&b_last)
}
