// src-tauri/src/infrastructure/system_scanner/ports.rs
// Infraestructura: Lógica de escaneo concurrente de puertos usando el PortScanner de bajo nivel.

use crate::domain::entities::OpenPort;
use crate::infrastructure::network::port_scanner::PortScanner;
use std::thread;

/// Escanea una lista específica de puertos contra una IP objetivo.
/// Utiliza hilos nativos para velocidad máxima (Connect Scan).
pub fn scan_specific_ports(ip: &str, ports: Vec<u16>) -> Vec<OpenPort> {
    let mut open_ports = Vec::new();
    let mut handles = vec![];
    let ip_target = ip.to_string();

    // Lanzamos un hilo por cada puerto para paralelismo agresivo
    for port in ports {
        let target = ip_target.clone();
        handles.push(thread::spawn(move || {
            // Invocamos el escáner de bajo nivel (TCP connect + Banner Grab)
            PortScanner::scan_service(&target, port).map(|banner| (port, banner))
        }));
    }

    // Recolectamos resultados (Join)
    for h in handles {
        if let Ok(Some((port, banner))) = h.join() {
            open_ports.push(OpenPort {
                port,
                status: "Open".to_string(),
                service: banner, // La verdad del servicio (Banner real)
                risk_level: "Unknown".to_string(), // Se decide en capa de Aplicación
                description: None,
                vulnerability: None,
            });
        }
    }

    open_ports
}

/// Implementación legacy para escaneo general (Top 16 puertos comunes).
pub fn scan_common_ports(ip: &str) -> Vec<OpenPort> {
    let common_ports = vec![
        21, 22, 23, 25, 53, 80, 110, 139, 143, 443, 445, 1433, 3306, 3389, 5432, 8080,
    ];
    scan_specific_ports(ip, common_ports)
}