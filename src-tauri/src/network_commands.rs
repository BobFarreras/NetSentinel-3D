use crate::models::{Device, SecurityReport, OpenPort};
use crate::intel; // 👈 IMPRESCINDIBLE: Ha d'existir intel.rs i estar declarat a lib.rs
use std::net::{TcpStream, ToSocketAddrs};
use std::time::Duration;
use std::sync::{Arc, Mutex};
use std::thread;
use std::process::Command; // 👈 CORREGIT: Import necessari
use std::collections::HashMap;

const COMMON_PORTS: [u16; 12] = [21, 22, 23, 25, 53, 80, 110, 139, 443, 445, 3389, 8080];

// --- COMANDA 1: SCAN NETWORK ---
#[tauri::command]
pub async fn scan_network(_range: Option<String>) -> Vec<Device> {
    println!("🦀 RUST: Scan Network (Ping Sweep + Intel)...");

    let detected_ips = Arc::new(Mutex::new(Vec::new()));
    let mut handles = vec![];
    let base_ip = "192.168.1";

    // 1. FASE DE PING
    for i in 1..255 {
        let ip_target = format!("{}.{}", base_ip, i);
        let ips_clone = Arc::clone(&detected_ips);

        let handle = thread::spawn(move || {
            #[cfg(target_os = "windows")]
            let output = Command::new("ping").args(["-n", "1", "-w", "200", &ip_target]).output();
            
            #[cfg(not(target_os = "windows"))]
            let output = Command::new("ping").args(["-c", "1", "-W", "1", &ip_target]).output();
            
            if let Ok(result) = output {
                let stdout = String::from_utf8_lossy(&result.stdout);
                // Si respon i no és "Unreachable"
                if result.status.success() && !stdout.contains("Unreachable") && !stdout.contains("inaccesible") {
                    ips_clone.lock().unwrap().push(ip_target);
                }
            }
        });
        handles.push(handle);
    }
    for handle in handles { let _ = handle.join(); }

    // 2. FASE ARP + INTEL
    let arp_table = get_arp_table();
    let active_ips = detected_ips.lock().unwrap();
    let mut final_devices = Vec::new();

    for ip in active_ips.iter() {
        // Busquem la MAC a la taula ARP. Si no hi és, posem 00:00...
        let mac = arp_table.get(ip).cloned().unwrap_or("00:00:00:00:00:00".to_string());
        
        // ✨ INTEL VENDOR i HOSTNAME
        let mut vendor = intel::resolve_vendor(&mac); 
        let hostname = intel::resolve_hostname(ip);

        // Lògica de noms
        let mut name = hostname.or_else(|| Some(format!("Host {}", ip.split('.').last().unwrap())));
        let mut is_gateway = false;

        // 🚨 AUTO-DETECCIÓ: Si la MAC és buida, ETS TU
        if mac == "00:00:00:00:00:00" {
            vendor = "NETSENTINEL HOST (ME)".to_string();
            name = Some("My Computer".to_string());
        }

        if ip.ends_with(".1") {
            name = Some("GATEWAY / ROUTER".to_string());
            vendor = "Network Infrastructure".to_string(); // Opcional, queda millor
            is_gateway = true;
        }

        final_devices.push(Device {
            ip: ip.clone(),
            mac,
            vendor,
            name,
            is_gateway,
            ping: Some(5), // Ping fictici ràpid
        });
    }

    // Ordenem per IP perquè la llista es vegi ordenada (1, 2, ... 131)
    final_devices.sort_by(|a, b| {
        let a_last: u8 = a.ip.split('.').last().unwrap_or("0").parse().unwrap_or(0);
        let b_last: u8 = b.ip.split('.').last().unwrap_or("0").parse().unwrap_or(0);
        a_last.cmp(&b_last)
    });

    final_devices
}

// Helper: ARP Table
fn get_arp_table() -> HashMap<String, String> {
    let mut map = HashMap::new();
    let output = Command::new("arp").arg("-a").output();
    if let Ok(result) = output {
        let stdout = String::from_utf8_lossy(&result.stdout);
        for line in stdout.lines() {
            let parts: Vec<&str> = line.split_whitespace().collect();
            if parts.len() >= 2 {
                let ip = parts[0];
                let mac = parts[1].replace("-", ":").to_uppercase();
                if ip.starts_with("192.168.") {
                    map.insert(ip.to_string(), mac);
                }
            }
        }
    }
    map
}

// --- COMANDA 2: AUDIT TARGET ---
#[tauri::command]
pub async fn audit_target(ip: String) -> SecurityReport {
    println!("🦀 RUST: Audit {}...", ip);
    let open_ports = Arc::new(Mutex::new(Vec::new()));
    let mut handles = vec![];

    for &port in COMMON_PORTS.iter() {
        let ip_c = ip.clone();
        let res_c = Arc::clone(&open_ports);

        handles.push(thread::spawn(move || {
            let addr = format!("{}:{}", ip_c, port);
            if let Ok(socket_addrs) = addr.to_socket_addrs() {
                for sa in socket_addrs {
                    if TcpStream::connect_timeout(&sa, Duration::from_millis(400)).is_ok() {
                        
                        // ✨ US DE INTEL PER PORTS
                        let (service, risk, desc, vuln) = intel::get_port_intel(port);

                        res_c.lock().unwrap().push(OpenPort {
                            port,
                            status: "Open".to_string(),
                            service,
                            risk_level: risk,
                            description: Some(desc),
                            vulnerability: vuln,
                        });
                        break;
                    }
                }
            }
        }));
    }

    for h in handles { let _ = h.join(); }
    let final_ports = Arc::try_unwrap(open_ports).unwrap().into_inner().unwrap();
    
    let mut risk_level = "SAFE";
    if !final_ports.is_empty() { risk_level = "LOW"; } 
    for p in &final_ports {
        if p.risk_level == "CRITICAL" { risk_level = "CRITICAL"; break; }
        if p.risk_level == "HIGH" { risk_level = "HIGH"; }
    }

    SecurityReport { target_ip: ip, open_ports: final_ports, risk_level: risk_level.to_string() }
}