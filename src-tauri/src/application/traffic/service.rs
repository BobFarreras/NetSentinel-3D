// src-tauri/src/application/traffic/service.rs
// Descripcion: caso de uso de trafico. Arranca/detiene el sniffer y expone un callback de paquetes (la UI decide como consumirlos).

use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;

use crate::domain::entities::TrafficPacket;
use crate::domain::ports::{NetworkScannerPort, TrafficSnifferPort};

pub struct TrafficService {
    is_running: Arc<AtomicBool>,
    scanner: Arc<dyn NetworkScannerPort>,
    sniffer: Arc<dyn TrafficSnifferPort>,
}

impl TrafficService {
    pub fn new(scanner: Arc<dyn NetworkScannerPort>, sniffer: Arc<dyn TrafficSnifferPort>) -> Self {
        Self {
            is_running: Arc::new(AtomicBool::new(false)),
            scanner,
            sniffer,
        }
    }

    pub fn start_monitoring<F>(&self, on_packet: F) -> Result<(), String>
    where
        F: Fn(TrafficPacket) + Send + Sync + 'static,
    {
        if self.is_running.load(Ordering::Relaxed) {
            return Err("El monitor ya esta en marcha".to_string());
        }

        // 1) Obtener la IP real (para no conectarnos a Hyper-V).
        let identity = self.scanner.get_host_identity()?;
        let target_ip = identity.ip;

        // Preflight: valida que podemos abrir el canal antes de marcar como "running".
        self.sniffer.preflight("auto", &target_ip)?;

        println!("🚀 [APP] Iniciando monitor de trafico sobre IP: {}...", target_ip);

        self.is_running.store(true, Ordering::Relaxed);
        let running_clone = self.is_running.clone();

        let callback: Arc<dyn Fn(TrafficPacket) + Send + Sync + 'static> = Arc::new(on_packet);

        // Pasamos la IP al sniffer.
        self.sniffer
            .start_capture("auto".to_string(), target_ip, running_clone, callback);
        Ok(())
    }

    pub fn stop_monitoring(&self) {
        println!("🛑 [APP] Deteniendo monitor...");
        self.is_running.store(false, Ordering::Relaxed);
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use async_trait::async_trait;

    struct MockScanner;

    #[async_trait]
    impl NetworkScannerPort for MockScanner {
        async fn scan_network(&self, _subnet: &str) -> Vec<crate::domain::entities::Device> {
            vec![]
        }

        async fn scan_ports(&self, _ip: &str) -> Vec<crate::domain::entities::OpenPort> {
            vec![]
        }

        fn probe_tcp_banner(&self, _ip: &str, _port: u16) -> Option<String> {
            None
        }

        fn get_host_identity(&self) -> Result<crate::domain::entities::HostIdentity, String> {
            Ok(crate::domain::entities::HostIdentity {
                ip: "192.168.1.10".to_string(),
                mac: "AA:BB:CC:DD:EE:FF".to_string(),
                netmask: "255.255.255.0".to_string(),
                gateway_ip: "192.168.1.1".to_string(),
                interface_name: "Mock".to_string(),
                dns_servers: vec![],
            })
        }
    }

    struct MockSniffer;

    impl TrafficSnifferPort for MockSniffer {
        fn preflight(&self, _interface_hint: &str, _target_ip: &str) -> Result<(), String> {
            Ok(())
        }

        fn start_capture(
            &self,
            _interface_hint: String,
            _target_ip: String,
            _running: Arc<AtomicBool>,
            _callback: Arc<dyn Fn(TrafficPacket) + Send + Sync + 'static>,
        ) {
        }
    }

    #[test]
    fn stop_monitoring_sets_running_false() {
        let service = TrafficService::new(Arc::new(MockScanner), Arc::new(MockSniffer));
        service.is_running.store(true, Ordering::Relaxed);

        service.stop_monitoring();

        assert!(!service.is_running.load(Ordering::Relaxed));
    }

    #[test]
    fn service_starts_in_stopped_state() {
        let service = TrafficService::new(Arc::new(MockScanner), Arc::new(MockSniffer));
        assert!(!service.is_running.load(Ordering::Relaxed));
    }
}
