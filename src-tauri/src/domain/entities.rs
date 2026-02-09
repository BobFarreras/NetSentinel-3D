use serde::{Serialize, Deserialize};

// 1. DISPOSITIU
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")] // 👈 AQUESTA LÍNIA ÉS CLAU!
pub struct Device {
    pub ip: String,
    pub mac: String,
    pub vendor: String,
    pub hostname: Option<String>,
    pub name: Option<String>,
    pub is_gateway: bool,
    pub ping: Option<u16>, 
    pub signal_strength: Option<String>, 
    pub signal_rate: Option<String>,     
    pub wifi_band: Option<String>,       
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