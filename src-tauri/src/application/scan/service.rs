// src-tauri/src/application/scan/service.rs
// Servicio de escaneo: Ejecuta lógica de negocio para inventario, auditoría y perfiles de ataque.

use crate::domain::{
    entities::{Device, OpenPort},
    knowledge::service_dictionary::ServiceDictionary,
    ports::NetworkScannerPort,
};
use crate::infrastructure::system_scanner::ports::scan_specific_ports; 
use std::sync::Arc;

pub struct ScannerService {
    scanner_port: Arc<dyn NetworkScannerPort>,
}

impl ScannerService {
    pub fn new(scanner_port: Arc<dyn NetworkScannerPort>) -> Self {
        Self { scanner_port }
    }

    /// Ejecuta un barrido de descubrimiento de hosts (ARP/Ping).
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

    /// Ejecuta el perfil de ataque "IoT Kill Chain".
    /// Identifica vectores de entrada en dispositivos inteligentes (Cámaras, Routers, ESP32).
    pub async fn run_iot_profile(&self, ip: String) -> (Vec<OpenPort>, String) {
        println!("⚔️ [ATTACK_LAB] Ejecutando IoT Kill Chain Profile contra {}", ip);
        
        // 1. Superficie de Ataque IoT (Lista Táctica)
        let iot_ports = vec![
            80, 443, 8080, 8081, // Interfaces Web Admin
            554, 8000, 8001,     // RTSP (Cámaras IP / Streaming)
            1883, 8883,          // MQTT (Bus de mensajes IoT)
            23, 2323,            // Telnet (Legacy / Mirai Botnet Vector)
            5000, 5001,          // UPnP / Flask Apps
            37777, 34567         // DVRs (Dahua/Hikvision)
        ];

        // 2. Ejecución Nativa (Threads)
        let mut open_ports = scan_specific_ports(&ip, iot_ports);

        // 3. Análisis de Riesgo Contextual (Heurística)
        let mut verdict = "SAFE";
        
        for p in &mut open_ports {
            if p.port == 23 || p.port == 2323 {
                p.risk_level = "CRITICAL".to_string();
                p.description = Some("Telnet abierto: Risc extrem de Botnet (Mirai)".to_string());
                verdict = "CRITICAL";
            } else if p.port == 554 {
                p.risk_level = "HIGH".to_string();
                p.description = Some("RTSP Streaming: Verificar auth per defecte".to_string());
                if verdict != "CRITICAL" { verdict = "HIGH"; }
            } else if p.port == 1883 {
                p.risk_level = "HIGH".to_string();
                p.description = Some("MQTT Broker. Verificar suscripción anónima (#)".to_string());
                 if verdict != "CRITICAL" { verdict = "HIGH"; }
            } else if [80, 443, 8080].contains(&p.port) {
                p.risk_level = "MEDIUM".to_string();
                p.description = Some("Panel Admin Web".to_string());
                 if verdict != "CRITICAL" && verdict != "HIGH" { verdict = "WARN"; }
            }
        }

        // Si no detectamos nada, puede ser un falso negativo o firewall activo
        if open_ports.is_empty() {
             verdict = "SAFE"; 
        }

        (open_ports, verdict.to_string())
    }

    /// Auditoría estándar (Puertos comunes generales).
    pub async fn audit_ip(&self, ip: String) -> (Vec<OpenPort>, String) {
        println!("🧠 [APP] Auditando puertos de {}", ip);

        // 1. EL CANARI (Detección Global de interferencia)
        let is_environment_poisoned = self.scanner_port.probe_tcp_banner(&ip, 55555).is_some();
        if is_environment_poisoned {
            println!("⚠️ [IDS] INTERFERENCIA DETECTADA en {}", ip);
        }

        // 2. Escaneo Bruto
        let raw_ports = self.scanner_port.scan_ports(&ip).await;

        // 3. Filtrado Heurístico (The Great Filter)
        let enriched_ports: Vec<OpenPort> = raw_ports
            .into_iter()
            .filter_map(|mut p| {
                let info = ServiceDictionary::lookup(p.port);
                let banner = p.service.clone();
                let is_silent = banner == "Silent" || banner == "Unknown" || banner.is_empty();

                // REGLA 1: Antivirus interceptando todo
                if is_environment_poisoned && is_silent {
                    return None;
                }

                // REGLA 2: Protocolos "parlanchines" callados (Falso positivo)
                let chatty_protocols = [21, 25, 110, 143, 587, 993, 995];
                if is_silent && chatty_protocols.contains(&p.port) {
                    return None; 
                }

                // REGLA 3: DNS TCP Silent (Raro en LAN doméstica)
                if is_silent && p.port == 53 {
                    return None;
                }

                // Enriquecimiento final
                if is_silent {
                    p.service = format!("{}?", info.name);
                    p.description = Some(format!("[PROBABLE] {}", info.description));
                } else {
                    p.service = format!("{} ✓", info.name);
                    p.description = Some(format!("[BANNER]: {}", banner));
                }

                p.risk_level = info.risk.to_string();
                if p.port == 23 {
                    p.risk_level = "CRITICAL".to_string();
                }

                Some(p)
            })
            .collect();

        // Cálculo de riesgo global
        let mut global_risk = "SAFE";
        if !enriched_ports.is_empty() {
            global_risk = "LOW";
        }

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