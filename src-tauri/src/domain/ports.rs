// src-tauri/src/domain/ports.rs
// Descripcion: definicion de puertos (traits) que `application/` consume y `infrastructure/` implementa (arquitectura hexagonal).

use async_trait::async_trait;
use crate::domain::entities::{
    Device, RouterAuditResult, ScanSession, OpenPort, LatestSnapshot, GatewayCredentials, HostIdentity
}; 
use crate::domain::entities::{AttackLabRequest, AttackLabLogEvent, AttackLabExitEvent};
use crate::domain::entities::TrafficPacket;
use crate::domain::entities::AppSettings;
use std::sync::atomic::AtomicBool;
use std::sync::Arc;
use tokio::sync::oneshot;

// PORT 1: ESCANER DE RED (Ahora incluye identidad propia)
#[async_trait]
pub trait NetworkScannerPort: Send + Sync {
    // Escanea un rango y retorna dispositivos.
    async fn scan_network(&self, subnet: &str) -> Vec<Device>;

    // Metodo integrado en el mismo puerto para evitar duplicar adaptadores.
    async fn scan_ports(&self, ip: &str) -> Vec<OpenPort>;

    // Sonda puntual TCP (banner/best-effort). Se usa como "canario" anti-interferencia/AV.
    fn probe_tcp_banner(&self, ip: &str, port: u16) -> Option<String>;

    // 👇 NUEVO: Necesario para OpSecService
    fn get_host_identity(&self) -> Result<HostIdentity, String>;
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

// PORT 3b: REPOSITORIO DE ULTIMO SNAPSHOT
#[async_trait]
pub trait LatestSnapshotRepositoryPort: Send + Sync {
    async fn save_latest(&self, snapshot: LatestSnapshot) -> Result<(), String>;
    async fn load_latest(&self) -> Result<Option<LatestSnapshot>, String>;
}

// PORT 3c: ALMACENAMIENTO DE CREDENCIALES
#[async_trait]
pub trait CredentialStorePort: Send + Sync {
    async fn save_gateway_credentials(&self, creds: GatewayCredentials) -> Result<(), String>;
    async fn get_gateway_credentials(&self, gateway_ip: &str) -> Result<Option<GatewayCredentials>, String>;
    async fn delete_gateway_credentials(&self, gateway_ip: &str) -> Result<(), String>;
}

// PORT 4: ESCANER WIFI
#[async_trait]
pub trait WifiScannerPort: Send + Sync {
    async fn scan_airwaves(&self) -> Result<Vec<crate::domain::entities::WifiScanRecord>, String>;
}

// PORT 5: RESOLUCION DE VENDOR
pub trait VendorLookupPort: Send + Sync {
    fn resolve_vendor(&self, mac_or_bssid: &str) -> String;
}

// PORT 6: WORDLIST (diccionario local)
//
// Nota: es sync porque es filesystem local y se usa desde comandos Tauri sync/async.
// La implementacion concreta puede hacer IO (y mapear a Result) pero el contrato se mantiene simple.
pub trait WordlistRepositoryPort: Send + Sync {
    fn load(&self) -> Result<Vec<String>, String>;
    fn save(&self, words: &[String]) -> Result<(), String>;
    fn append(&self, word: &str) -> Result<(), String>;
}

// PORT 7: SNIFFER DE TRAFICO (captura de paquetes para HUD)
//
// Nota: sync porque la captura vive en un thread dedicado y el "stop" es un flag compartido.
pub trait TrafficSnifferPort: Send + Sync {
    fn preflight(&self, interface_hint: &str, target_ip: &str) -> Result<(), String>;
    fn start_capture(
        &self,
        interface_hint: String,
        target_ip: String,
        running: Arc<AtomicBool>,
        callback: Arc<dyn Fn(TrafficPacket) + Send + Sync + 'static>,
    );
}

// PORT 8: CONECTOR WIFI (acciones activas controladas)
pub trait WifiConnectorPort: Send + Sync {
    fn connect(&self, ssid: &str, password: &str) -> Result<bool, String>;
}

// PORT 9: JAMMER (contramedida activa controlada)
pub trait JammerPort: Send + Sync {
    fn start_jamming(&self, target_ip: String, target_mac: String, gateway_ip: String);
    fn stop_jamming(&self, target_ip: String);
}

// PORT 10: ATTACK LAB (runner de procesos externos)
//
// Nota: la implementacion real hace IO (spawn, pipes) y vive en infraestructura.
pub trait AttackLabEventSinkPort: Send + Sync + 'static {
    fn on_log(&self, evt: AttackLabLogEvent);
    fn on_exit(&self, evt: AttackLabExitEvent);
}

#[async_trait]
pub trait AttackLabRunnerPort: Send + Sync {
    async fn run(
        &self,
        audit_id: String,
        request: AttackLabRequest,
        cancel_rx: oneshot::Receiver<()>,
        sink: Arc<dyn AttackLabEventSinkPort>,
    );
}

// PORT 11: SETTINGS STORE (persistencia local de configuracion)
pub trait SettingsStorePort: Send + Sync {
    fn load(&self) -> Result<AppSettings, String>;
    fn save(&self, settings: &AppSettings) -> Result<(), String>;
}
