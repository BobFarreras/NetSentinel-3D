// src-tauri/src/domain/ports.rs
use async_trait::async_trait;
use crate::domain::entities::{Device, RouterAuditResult, ScanSession, OpenPort, LatestSnapshot, GatewayCredentials}; 

// PORT 1: ESCANER DE RED
#[async_trait]
pub trait NetworkScannerPort: Send + Sync {
    // Escanea un rango y retorna dispositivos.
    async fn scan_network(&self, subnet: &str) -> Vec<Device>;

    // Metodo integrado en el mismo puerto para evitar duplicar adaptadores.
    async fn scan_ports(&self, ip: &str) -> Vec<OpenPort>;
}

// PORT 2: AUDITOR DE ROUTER
#[async_trait]
pub trait RouterAuditorPort: Send + Sync {
    async fn audit_gateway(&self, ip: &str) -> RouterAuditResult;
    async fn fetch_connected_devices(&self, ip: &str, creds: &str) -> Vec<Device>;
}

// PORT 3: REPOSITORIO DE HISTORIAL
#[async_trait]
pub trait HistoryRepositoryPort: Send + Sync {
    async fn save_session(&self, session: ScanSession) -> Result<(), String>;
    async fn get_all_sessions(&self) -> Result<Vec<ScanSession>, String>;
}

// PORT 3b: REPOSITORIO DE ULTIMO SNAPSHOT (arranque rapido)
#[async_trait]
pub trait LatestSnapshotRepositoryPort: Send + Sync {
    async fn save_latest(&self, snapshot: LatestSnapshot) -> Result<(), String>;
    async fn load_latest(&self) -> Result<Option<LatestSnapshot>, String>;
}

// PORT 3c: ALMACENAMIENTO DE CREDENCIALES (gateway) en el equipo local
#[async_trait]
pub trait CredentialStorePort: Send + Sync {
    async fn save_gateway_credentials(&self, creds: GatewayCredentials) -> Result<(), String>;
    async fn get_gateway_credentials(&self, gateway_ip: &str) -> Result<Option<GatewayCredentials>, String>;
    async fn delete_gateway_credentials(&self, gateway_ip: &str) -> Result<(), String>;
}

// PORT 4: ESCANER WIFI (RECONOCIMIENTO DE INFRAESTRUCTURA)
#[async_trait]
pub trait WifiScannerPort: Send + Sync {
    async fn scan_airwaves(&self) -> Result<Vec<crate::domain::entities::WifiScanRecord>, String>;
}

// PORT 5: RESOLUCION DE VENDOR (OUI)
// Se usa tanto para dispositivos (MAC) como para BSSID (WiFi).
pub trait VendorLookupPort: Send + Sync {
    fn resolve_vendor(&self, mac_or_bssid: &str) -> String;
}
