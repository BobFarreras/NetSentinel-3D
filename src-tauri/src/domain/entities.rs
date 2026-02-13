// src-tauri/src/domain/entities.rs

use serde::{Serialize, Deserialize};

// 1. DISPOSITIU
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")] // Linea clave: alinea el JSON con el frontend TypeScript.
pub struct Device {
    pub ip: String,
    pub mac: String,
    pub vendor: String,
    pub hostname: Option<String>,
    pub name: Option<String>,
    pub is_gateway: bool,
    pub ping: Option<u16>, 
    // Compat: el frontend historico usa snake_case en algunos campos.
    #[serde(alias = "signal_strength")]
    pub signal_strength: Option<String>,
    #[serde(alias = "signal_rate")]
    pub signal_rate: Option<String>,
    #[serde(alias = "wifi_band")]
    pub wifi_band: Option<String>,
    pub open_ports: Option<Vec<OpenPort>>,
}

// 2. VULNERABILITAT
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Vulnerability {
    pub id: String,
    pub description: String,
    pub severity: String,
    pub recommendation: String,
}

// 3. PORT OBERT
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OpenPort {
    pub port: u16,
    pub status: String,
    pub service: String,
    pub risk_level: String,
    pub description: Option<String>,
    pub vulnerability: Option<Vulnerability>,
}

// 4. RESULTAT D'AUDITORIA
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RouterAuditResult {
    pub target_ip: String,
    pub vulnerable: bool,
    pub credentials_found: Option<String>,
    pub message: String,
}

// 5. SESSIÓ D'ESCANEIG
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ScanSession {
    pub id: String,       
    pub timestamp: u64,   
    pub devices: Vec<Device>, 
    pub label: String,    
}

// 5b. ULTIMA FOTO (snapshot) - Persistencia rapida para arranque
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LatestSnapshot {
    pub timestamp: u64,
    pub devices: Vec<Device>,
}

// 5c. CREDENCIALES (gateway) - Solo almacenamiento local en el equipo del auditor
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GatewayCredentials {
    pub gateway_ip: String,
    pub user: String,
    pub pass: String,
    pub saved_at: u64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct HostIdentity {
    pub ip: String,
    pub mac: String,
    pub netmask: String,
    pub gateway_ip: String,
    pub interface_name: String, // Ex: "Wi-Fi" o "Ethernet"
    pub dns_servers: Vec<String>,
}

// Estado de seguridad OpSec (MAC spoofing) calculado en application.
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct MacSecurityStatus {
    pub current_mac: String,
    pub is_spoofed: bool,
    pub risk_level: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TrafficPacket {
    pub id: usize, // ID secuencial para listas React (key).
    pub timestamp: u64,
    pub source_ip: String,
    pub destination_ip: String,
    pub protocol: String, // TCP, UDP, ICMP
    pub length: usize,
    pub info: String,     // Ex: "HTTPS Traffic" o "DNS Query"
    pub is_intercepted: bool,
}

// 6. WIFI (Radar View)
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WifiScanRecord {
    // Identificador del AP (BSSID). Se trata como entrada no confiable.
    pub bssid: String,
    // SSID puede estar vacio en redes ocultas. Se sanea en application antes de exponerlo a UI.
    pub ssid: String,
    pub channel: Option<u16>,
    // RSSI aproximado (ej: -40 fuerte, -90 debil). Si no hay dato fiable, usar -100.
    pub signal_level: i32,
    // Cadena de seguridad reportada por el sistema (WPA2/WPA3/WEP/OPEN/etc.).
    pub security_type: String,
    // Marca si el registro corresponde al AP al que el host esta conectado actualmente.
    // Solo puede inferirse en plataformas donde el sistema expone el enlace activo (ej: Windows via netsh).
    pub is_connected: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WifiEntity {
    pub bssid: String,
    pub ssid: String,
    pub channel: Option<u16>,
    pub signal_level: i32,
    pub security_type: String,
    pub vendor: String,
    pub distance_mock: f32,
    pub risk_level: String,     // HARDENED | STANDARD | LEGACY | OPEN
    pub is_targetable: bool,    // true si la configuracion es debil (legacy/open) en modo educativo
    pub is_connected: bool,     // true si es el AP actual del host
}
