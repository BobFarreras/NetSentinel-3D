// src-tauri/src/infrastructure/system_scanner/ports.rs

use crate::domain::entities::OpenPort;
use crate::infrastructure::network::port_scanner::PortScanner;
use std::thread;

pub fn scan_common_ports(ip: &str) -> Vec<OpenPort> {
    // Lista ampliada con tus nuevos objetivos
    let common_ports = [21, 22, 23, 25, 53, 80, 110, 139, 143, 443, 445, 1433, 3306, 3389, 5432, 8080];
    
    let mut open_ports = Vec::new();
    let mut handles = vec![];
    let ip_target = ip.to_string();

    for &port in common_ports.iter() {
        let target = ip_target.clone();
        handles.push(thread::spawn(move || {
            // Usamos la nueva funcion scan_service
            if let Some(banner) = PortScanner::scan_service(&target, port) {
                Some((port, banner))
            } else {
                None
            }
        }));
    }

    for h in handles {
        if let Ok(Some((port, banner))) = h.join() {
            open_ports.push(OpenPort {
                port,
                status: "Open".to_string(),
                service: banner, // <--- Aqui guardamos la verdad
                risk_level: "Unknown".to_string(),
                description: None,
                vulnerability: None,
            });
        }
    }

    open_ports
}