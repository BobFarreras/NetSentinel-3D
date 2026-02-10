// src-tauri/src/infrastructure/system_scanner/ports.rs

use crate::domain::entities::OpenPort;
use crate::infrastructure::network::port_scanner::PortScanner;
use std::thread;

pub fn scan_common_ports(ip: &str) -> Vec<OpenPort> {
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

