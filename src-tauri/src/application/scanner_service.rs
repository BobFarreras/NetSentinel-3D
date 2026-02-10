// src-tauri/src/application/scanner_service.rs

use crate::domain::{
    entities::{Device, OpenPort},
    ports::NetworkScannerPort,
};
use crate::infrastructure::network::service_dictionary::ServiceDictionary;
use std::sync::Arc;

pub struct ScannerService {
    scanner_port: Arc<dyn NetworkScannerPort>,
}

impl ScannerService {
    pub fn new(scanner_port: Arc<dyn NetworkScannerPort>) -> Self {
        Self { scanner_port }
    }

    pub async fn run_network_scan(&self, subnet: Option<String>) -> Vec<Device> {
        // 1) Obtenemos la entrada cruda (ej: "192.168.1.0/24" o "192.168.1").
        let raw_target = subnet.unwrap_or("192.168.1".to_string());

        // 2) Limpieza: quitamos mascara CIDR (/24).
        let clean_cidr = raw_target.split('/').next().unwrap_or(&raw_target);

        // 3) Extraccion: nos quedamos con los 3 primeros octetos (192.168.1).
        let parts: Vec<&str> = clean_cidr.split('.').collect();
        let final_base = if parts.len() >= 3 {
            format!("{}.{}.{}", parts[0], parts[1], parts[2])
        } else {
            "192.168.1".to_string() // Fallback seguro.
        };

        println!("🧠 [APP] Escaneando base '{}' (original: '{}')", final_base, raw_target);

        // El enriquecimiento (MAC/vendor/hostname) ocurre en la infraestructura (`SystemScanner`).
        self.scanner_port.scan_network(&final_base).await
    }

    pub async fn audit_ip(&self, ip: String) -> (Vec<OpenPort>, String) {
        println!("🧠 [APP] Auditando puertos de {}", ip);

        let raw_ports = self.scanner_port.scan_ports(&ip).await;

        // Enriquecemos los datos usando `ServiceDictionary`.
        let enriched_ports: Vec<OpenPort> = raw_ports
            .into_iter()
            .map(|mut p| {
                let info = ServiceDictionary::lookup(p.port);

                p.service = info.name.to_string();
                p.risk_level = info.risk.to_string();
                p.description = Some(info.description.to_string());

                // Si el risc és crític, afegim una "vulnerabilitat" automàtica
                // (Aquí podries connectar amb una BD de CVEs en el futur)
                
                p
            })
            .collect();

        // Calculamos el riesgo global del dispositivo.
        let mut global_risk = "SAFE";
        if !enriched_ports.is_empty() {
            global_risk = "LOW";
        }

        for p in &enriched_ports {
            if p.risk_level == "CRITICAL" {
                global_risk = "CRITICAL";
                break;
            }
            if p.risk_level == "HIGH" && global_risk != "CRITICAL" {
                global_risk = "HIGH";
            }
        }

        (enriched_ports, global_risk.to_string())
    }
}

// --- TESTS ---
#[cfg(test)]
mod tests {
    use super::*; 
    use crate::domain::entities::{Device, OpenPort};
    use async_trait::async_trait;
    use std::sync::Arc;

    // --- MOCK ---
    struct MockScanner;

    #[async_trait]
    impl NetworkScannerPort for MockScanner {
        async fn scan_network(&self, _subnet: &str) -> Vec<Device> {
            vec![
                Device {
                    ip: "192.168.1.1".to_string(),
                    mac: "AA:BB:CC:DD:EE:FF".to_string(),
                    vendor: "MockRouter".to_string(),
                    hostname: Some("gateway".to_string()),
                    name: Some("Router".to_string()),
                    is_gateway: true,
                    ping: Some(2),
                    signal_strength: None,
                    signal_rate: None,
                    wifi_band: None,
                    open_ports: None,
                },
                Device {
                    ip: "192.168.1.50".to_string(),
                    mac: "11:22:33:44:55:66".to_string(),
                    vendor: "MockPC".to_string(),
                    hostname: None,
                    name: None,
                    is_gateway: false,
                    ping: Some(15),
                    signal_strength: None,
                    signal_rate: None,
                    wifi_band: None,
                    open_ports: None,
                },
            ]
        }

        async fn scan_ports(&self, ip: &str) -> Vec<OpenPort> {
            if ip == "192.168.1.1" {
                vec![OpenPort {
                    port: 23,
                    status: "Open".to_string(),
                    service: "Unknown".to_string(),
                    risk_level: "Unknown".to_string(),
                    description: None,
                    vulnerability: None,
                }]
            } else {
                vec![]
            }
        }
    }

    // --- TESTS REALS ---

    #[tokio::test]
    async fn test_scan_network_flow() {
        let mock_infra = Arc::new(MockScanner);
        let service = ScannerService::new(mock_infra);

        let devices = service
            .run_network_scan(Some("192.168.1.0/24".to_string()))
            .await;

        assert_eq!(devices.len(), 2);
        assert_eq!(devices[0].vendor, "MockRouter");
    }

    #[tokio::test]
    async fn test_risk_calculation_logic() {
        let mock_infra = Arc::new(MockScanner);
        let service = ScannerService::new(mock_infra);

        let (ports, risk_global) = service.audit_ip("192.168.1.1".to_string()).await;

        assert_eq!(ports.len(), 1);
        assert_eq!(ports[0].service, "TELNET"); // El diccionari converteix el 23 en TELNET
        assert_eq!(risk_global, "CRITICAL");
    }
}
