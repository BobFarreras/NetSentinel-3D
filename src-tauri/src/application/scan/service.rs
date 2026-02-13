// src-tauri/src/application/scan/service.rs
// Servicio de escaneo: ejecuta scan_network (inventario) y audit_target (puertos) usando el puerto `NetworkScannerPort`.

use crate::domain::{
    entities::{Device, OpenPort},
    ports::NetworkScannerPort,
};
use crate::infrastructure::network::service_dictionary::ServiceDictionary;
use crate::infrastructure::network::port_scanner::PortScanner;
use std::sync::Arc;

pub struct ScannerService {
    scanner_port: Arc<dyn NetworkScannerPort>,
}

impl ScannerService {
    pub fn new(scanner_port: Arc<dyn NetworkScannerPort>) -> Self {
        Self { scanner_port }
    }

    pub async fn run_network_scan(&self, subnet: Option<String>) -> Vec<Device> {
        let raw_target = subnet.unwrap_or("192.168.1".to_string());
        let clean_cidr = raw_target.split('/').next().unwrap_or(&raw_target);

        let parts: Vec<&str> = clean_cidr.split('.').collect();
        let final_base = if parts.len() >= 3 {
            format!("{}.{}.{}", parts[0], parts[1], parts[2])
        } else {
            "192.168.1".to_string()
        };

        println!("🧠 [APP] Escaneando base '{}'", final_base);
        self.scanner_port.scan_network(&final_base).await
    }

    pub async fn audit_ip(&self, ip: String) -> (Vec<OpenPort>, String) {
        println!("🧠 [APP] Auditando puertos de {}", ip);

        // 1. EL CANARI (Detección Global)
        let is_environment_poisoned = PortScanner::scan_service(&ip, 55555).is_some();
        if is_environment_poisoned {
            println!("⚠️ [IDS] INTERFERENCIA DETECTADA en {}", ip);
        }

        // 2. Escaneig Brut
        let raw_ports = self.scanner_port.scan_ports(&ip).await;

        // 3. FILTRATGE HEURÍSTIC (The Great Filter)
        let enriched_ports: Vec<OpenPort> = raw_ports
            .into_iter()
            .filter_map(|mut p| {
                let info = ServiceDictionary::lookup(p.port);
                let banner = p.service.clone(); 
                let is_silent = banner == "Silent" || banner == "Unknown" || banner.is_empty();

                // REGLA 1: Si l'entorn està "Enverinat" i el port és Silent -> FORA.
                if is_environment_poisoned && is_silent {
                    return None;
                }

                // REGLA 2 (NOVA): Protocols "Parladors" que estan Callats -> FORA.
                // SMTP (25, 587), POP3 (110), IMAP (143), FTP (21) SEMPRE han d'enviar banner.
                // Si estan "Silent", és l'Antivirus interceptant.
                let chatty_protocols = [21, 25, 110, 143, 587, 993, 995];
                if is_silent && chatty_protocols.contains(&p.port) {
                     return None; // FALS POSITIU DETECTAT
                }

                // REGLA 3: DNS TCP (53) Silent en Router domèstic -> FORA.
                // Normalment DNS va per UDP. Si TCP 53 està obert i callat, sol ser AV.
                if is_silent && p.port == 53 {
                    return None;
                }

                // LOGICA D'ENRIQUIMENT (Si ha sobreviscut al filtre)
                if is_silent {
                    // Només permetem Silent per HTTP/HTTPS/Custom
                    p.service = format!("{}?", info.name);
                    p.description = Some(format!("[PROBABLE] {}", info.description));
                } else {
                    p.service = format!("{} ✓", info.name);
                    p.description = Some(format!("[BANNER]: {}", banner));
                }

                p.risk_level = info.risk.to_string();
                if p.port == 23 { p.risk_level = "CRITICAL".to_string(); }
                
                Some(p)
            })
            .collect();

        // Càlcul de risc
        let mut global_risk = "SAFE";
        if !enriched_ports.is_empty() { global_risk = "LOW"; }
        
        for p in &enriched_ports {
            if p.service.contains("✓") && p.risk_level == "HIGH" {
                 global_risk = "HIGH";
            }
            if p.risk_level == "CRITICAL" {
                global_risk = "CRITICAL";
                break;
            }
        }

        (enriched_ports, global_risk.to_string())
    }
}
