// src-tauri/src/infrastructure/system_scanner.rs

use crate::domain::entities::{Device, OpenPort};
use crate::domain::ports::NetworkScannerPort;
use async_trait::async_trait;

// Submodulos para separar responsabilidades (SOLID) sin cambiar la API publica del adaptador.
#[path = "system_scanner/discover.rs"]
mod discover;
#[path = "system_scanner/enrich.rs"]
mod enrich;
#[path = "system_scanner/ports.rs"]
mod ports;
#[path = "system_scanner/sort.rs"]
mod sort;

pub struct SystemScanner;

#[async_trait]
impl NetworkScannerPort for SystemScanner {
    async fn scan_network(&self, subnet_base: &str) -> Vec<Device> {
        println!("🛠️ [INFRA] Escaneando subnet base: {}.x", subnet_base);

        // 1) Descubrimiento (IP activas).
        let active_ips = discover::discover_active_ips(subnet_base);

        // 2) Enriquecimiento (MAC/vendor/hostname + marca de host/gateway).
        let mut devices = enrich::enrich_ips(&active_ips);

        // 3) Orden estable para UI.
        devices.sort_by(|a, b| sort::human_sort(&a.ip, &b.ip));

        devices
    }

    async fn scan_ports(&self, ip: &str) -> Vec<OpenPort> {
        ports::scan_common_ports(ip)
    }
}

