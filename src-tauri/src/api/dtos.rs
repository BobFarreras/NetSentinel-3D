use serde::{Serialize, Deserialize};
use crate::domain::entities::{Device, RouterAuditResult};

// 1. DISPOSITIU DTO (Aquest SÍ que volem camelCase per React)
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct DeviceDTO {
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

impl From<Device> for DeviceDTO {
    fn from(d: Device) -> Self {
        Self {
            ip: d.ip,
            mac: d.mac,
            vendor: d.vendor,
            hostname: d.hostname,
            name: d.name,
            is_gateway: d.is_gateway,
            ping: d.ping,
            signal_strength: d.signal_strength,
            signal_rate: d.signal_rate,
            wifi_band: d.wifi_band,
        }
    }
}

// 2. REPORT DE SEGURETAT DTO
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SecurityReportDTO {
    pub target_ip: String,
    pub open_ports: Vec<crate::domain::entities::OpenPort>, 
    pub risk_level: String,
}

// 3. RESULTAT AUDITORIA DTO
// ⚠️ FIX: Eliminem 'rename_all' perquè el frontend espera 'credentials_found' (snake_case)
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct RouterAuditResultDTO {
    pub vulnerable: bool,
    pub credentials_found: Option<String>, // React ho llegirà com result.credentials_found
    pub message: String,
}

impl From<RouterAuditResult> for RouterAuditResultDTO {
    fn from(r: RouterAuditResult) -> Self {
        Self {
            vulnerable: r.vulnerable,
            credentials_found: r.credentials_found,
            message: r.message,
        }
    }
}