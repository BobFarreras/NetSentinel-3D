// src-tauri/src/api/dtos.rs
use serde::{Serialize, Deserialize};
use crate::domain::entities::{Device, RouterAuditResult, WifiEntity};

// 1) DISPOSITIVO DTO (queremos `camelCase` para React).
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

// 4. WIFI RADAR DTO
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct WifiNetworkDTO {
    pub bssid: String,
    pub ssid: String,
    pub channel: Option<u16>,
    pub signal_level: i32,
    pub security_type: String,
    pub vendor: String,
    pub distance_mock: f32,
    pub risk_level: String,
    pub is_targetable: bool,
    pub is_connected: bool,
}

impl From<WifiEntity> for WifiNetworkDTO {
    fn from(w: WifiEntity) -> Self {
        Self {
            bssid: w.bssid,
            ssid: w.ssid,
            channel: w.channel,
            signal_level: w.signal_level,
            security_type: w.security_type,
            vendor: w.vendor,
            distance_mock: w.distance_mock,
            risk_level: w.risk_level,
            is_targetable: w.is_targetable,
            is_connected: w.is_connected,
        }
    }
}

// 5. Attack Lab (Wrapper de herramientas CLI)
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct AttackLabEnvVarDTO {
    pub key: String,
    pub value: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct AttackLabRequestDTO {
    pub binary_path: String,
    pub args: Vec<String>,
    pub cwd: Option<String>,
    pub timeout_ms: Option<u64>,
    pub env: Option<Vec<AttackLabEnvVarDTO>>,
}

#[derive(serde::Serialize)]
pub struct MacSecurityStatusDTO {
    pub current_mac: String,
    pub is_spoofed: bool,
    pub risk_level: String, // "HIGH" (Real) o "LOW" (Spoofed)
}
