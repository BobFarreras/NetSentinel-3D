use crate::domain::entities::{Device, OpenPort}; // 👈 Imports nets i sense duplicats
use crate::domain::ports::NetworkScannerPort;
use async_trait::async_trait;
use std::process::Command;
use std::sync::{Arc, Mutex};
use std::thread;
use std::net::{TcpStream, ToSocketAddrs}; // 👈 Ara farem servir TcpStream directament
use std::time::Duration;
use std::collections::HashMap;

#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;

const CREATE_NO_WINDOW: u32 = 0x08000000;

pub struct SystemScanner;

impl SystemScanner {
    // Helper privat per obtenir la taula ARP
    fn get_arp_table() -> HashMap<String, String> {
        let mut map = HashMap::new();
        let mut cmd = Command::new("arp");
        cmd.arg("-a");
        #[cfg(target_os = "windows")]
        cmd.creation_flags(CREATE_NO_WINDOW);

        if let Ok(result) = cmd.output() {
            let stdout = String::from_utf8_lossy(&result.stdout);
            for line in stdout.lines() {
                let parts: Vec<&str> = line.split_whitespace().collect();
                if parts.len() >= 2 {
                    let ip = parts[0];
                    let mac = parts[1].replace("-", ":").to_uppercase();
                    if ip.starts_with("192.168.") || ip.starts_with("10.") {
                        map.insert(ip.to_string(), mac);
                    }
                }
            }
        }
        map
    }

    // Helper privat per resoldre noms
    fn resolve_hostname_os(ip: &str) -> Option<String> {
        let mut cmd = Command::new("nslookup");
        cmd.arg(ip);
        #[cfg(target_os = "windows")]
        cmd.creation_flags(CREATE_NO_WINDOW);

        if let Ok(output) = cmd.output() {
            if output.status.success() {
                let stdout = String::from_utf8_lossy(&output.stdout);
                for line in stdout.lines() {
                    if line.trim().starts_with("Name:") {
                        let parts: Vec<&str> = line.split(':').collect();
                        if parts.len() > 1 {
                            return Some(parts[1].trim().to_string());
                        }
                    }
                }
            }
        }
        None
    }
}

#[async_trait]
impl NetworkScannerPort for SystemScanner {
    // 1. ESCANEIG DE XARXA (PING + ARP)
    async fn scan_network(&self, subnet_base: &str) -> Vec<Device> {
        println!("🛠️ INFRA: Scanning subnet {}...", subnet_base);
        
        let detected_ips = Arc::new(Mutex::new(Vec::new()));
        let mut handles = vec![];

        // Ping Sweep
        for i in 1..255 {
            let ip_target = format!("{}.{}", subnet_base, i);
            let ips_clone = Arc::clone(&detected_ips);

            let handle = thread::spawn(move || {
                let mut cmd = Command::new("ping");
                
                #[cfg(target_os = "windows")]
                cmd.args(["-n", "1", "-w", "200", &ip_target]);
                
                #[cfg(not(target_os = "windows"))]
                cmd.args(["-c", "1", "-W", "1", &ip_target]);

                #[cfg(target_os = "windows")]
                cmd.creation_flags(CREATE_NO_WINDOW);

                if let Ok(output) = cmd.output() {
                    let stdout = String::from_utf8_lossy(&output.stdout);
                    if output.status.success() && !stdout.contains("Unreachable") && !stdout.contains("inaccesible") {
                        ips_clone.lock().unwrap().push(ip_target);
                    }
                }
            });
            handles.push(handle);
        }

        for handle in handles { let _ = handle.join(); }

        // ARP Match
        let arp_table = Self::get_arp_table();
        let active_ips = detected_ips.lock().unwrap();
        let mut devices = Vec::new();

        for ip in active_ips.iter() {
            let mac = arp_table.get(ip).cloned().unwrap_or("00:00:00:00:00:00".to_string());
            let vendor = self.resolve_vendor(&mac);
            let hostname = Self::resolve_hostname_os(ip);
            
            let is_gateway = ip.ends_with(".1");
            let name = hostname.clone().or_else(|| {
                if is_gateway { Some("GATEWAY".to_string()) } else { None }
            });

            devices.push(Device {
                ip: ip.clone(),
                mac,
                vendor,
                hostname,
                name,
                is_gateway,
                ping: Some(10),
                signal_strength: None,
                signal_rate: None,
                wifi_band: None,
            });
        }

        devices.sort_by(|a, b| {
            let a_last: u8 = a.ip.split('.').last().unwrap_or("0").parse().unwrap_or(0);
            let b_last: u8 = b.ip.split('.').last().unwrap_or("0").parse().unwrap_or(0);
            a_last.cmp(&b_last)
        });

        devices
    }

    // 2. MAC VENDOR RESOLVER
    fn resolve_vendor(&self, mac: &str) -> String {
        if mac == "00:00:00:00:00:00" { return "Unknown".to_string(); }
        let clean = mac.replace(":", "").replace("-", "").to_uppercase();
        
        if clean.starts_with("ACF7") { return "Xiaomi".to_string(); }
        if clean.starts_with("B06E") || clean.starts_with("F018") { return "Apple".to_string(); }
        if clean.starts_with("00E0") { return "Intel".to_string(); }
        
        "Generic Device".to_string()
    }

    // 3. PORT SCANNER (Multithreaded Socket Connect)
    async fn scan_ports(&self, ip: &str) -> Vec<OpenPort> {
        let mut open_ports = Vec::new();
        let common_ports = [21, 22, 23, 25, 53, 80, 110, 139, 443, 445, 3389, 8080];
        
        let mut handles = vec![];
        let ip_target = ip.to_string();

        for &port in common_ports.iter() {
            let target = format!("{}:{}", ip_target, port);
            handles.push(thread::spawn(move || {
                // Utilitzem TcpStream importat a dalt, codi més net
                if let Ok(mut addrs) = target.to_socket_addrs() {
                    if let Some(addr) = addrs.next() {
                        if TcpStream::connect_timeout(&addr, Duration::from_millis(400)).is_ok() {
                            return Some(port);
                        }
                    }
                }
                None
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