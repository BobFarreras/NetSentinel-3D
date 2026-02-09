use serde::{Deserialize, Serialize};

// 1. DISPOSITIU (Model Unificat)
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct DeviceDTO {
    pub ip: String,
    pub mac: String,
    pub vendor: String,
    pub name: Option<String>,
    pub is_gateway: bool,
    pub hostname: Option<String>,
    pub ping: Option<u16>, 
    
    // Camps opcionals per Wifi (poden ser null)
    pub signal_strength: Option<String>, 
    pub signal_rate: Option<String>,     
    pub wifi_band: Option<String>,       
}

// 2. AUDITORIA ROUTER
#[derive(Serialize, Deserialize, Clone)]
pub struct RouterAuditResult {
    pub vulnerable: bool,
    pub credentials_found: Option<String>,
    pub message: String,
}

// 3. VULNERABILITAT
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Vulnerability {
    pub id: String,
    pub description: String,
    pub severity: String,
    pub recommendation: String,
}

// 4. PORT OBERT
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct OpenPort {
    pub port: u16,
    pub status: String,
    pub service: String,
    pub risk_level: String,
    pub description: Option<String>,
    pub vulnerability: Option<Vulnerability>,
}

// 5. REPORT FINAL
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SecurityReport {
    pub target_ip: String,
    pub open_ports: Vec<OpenPort>,
    pub risk_level: String,
}

// 6. SESSIÓ
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ScanSession {
    pub id: String,       
    pub timestamp: u64,   
    pub devices: Vec<DeviceDTO>, // Usem DeviceDTO aquí també
    pub label: String,    
}