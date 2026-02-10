// src-tauri/src/domain/ports.rs
use async_trait::async_trait;
use crate::domain::entities::{Device, RouterAuditResult, ScanSession, OpenPort}; 

// PORT 1: ESCÀNER DE XARXA
#[async_trait]
pub trait NetworkScannerPort: Send + Sync {
    // Escaneja un rang i retorna dispositius
    async fn scan_network(&self, subnet: &str) -> Vec<Device>;

    // 👇 Aquest és el mètode que faltava, integrat en la mateixa definició
    async fn scan_ports(&self, ip: &str) -> Vec<OpenPort>;
}

// PORT 2: AUDITOR DE ROUTER
#[async_trait]
pub trait RouterAuditorPort: Send + Sync {
    async fn audit_gateway(&self, ip: &str) -> RouterAuditResult;
    async fn fetch_connected_devices(&self, ip: &str, creds: &str) -> Vec<Device>;
}

// PORT 3: REPOSITORI D'HISTORIAL
#[async_trait]
pub trait HistoryRepositoryPort: Send + Sync {
    async fn save_session(&self, session: ScanSession) -> Result<(), String>;
    async fn get_all_sessions(&self) -> Result<Vec<ScanSession>, String>;
}

// PORT 4: ESCANER WIFI (RECONOCIMIENTO DE INFRAESTRUCTURA)
#[async_trait]
pub trait WifiScannerPort: Send + Sync {
    async fn scan_airwaves(&self) -> Result<Vec<crate::domain::entities::WifiScanRecord>, String>;
}
