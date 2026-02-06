use serde::{Serialize, Deserialize};

// 1. DISPOSITIU (El que es veu al mapa 3D)
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Device {
    pub ip: String,
    pub mac: String,
    pub vendor: String,
    pub name: Option<String>,
    pub is_gateway: bool,
    pub ping: Option<u16>, 
}

// 2. VULNERABILITAT (La fitxa d'intel·ligència)
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Vulnerability {
    pub id: String,
    pub description: String,
    pub severity: String, // 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
    pub recommendation: String,
}

// 3. PORT OBERT (El resultat de l'escaneig)
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct OpenPort {
    pub port: u16,
    pub status: String,
    pub service: String,
    pub risk_level: String,
    pub description: Option<String>,
    pub vulnerability: Option<Vulnerability>, // Pot contenir la info de seguretat
}

// 4. INFORME FINAL (El que rep el panell lateral)
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SecurityReport {
    pub target_ip: String,
    pub open_ports: Vec<OpenPort>,
    pub risk_level: String,
}


#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ScanSession {
    pub id: String,       // UUID
    pub timestamp: u64,   // Data en format Unix
    pub devices: Vec<Device>,
    pub label: String,    // Nom automàtic "Scan 12:00..."
}