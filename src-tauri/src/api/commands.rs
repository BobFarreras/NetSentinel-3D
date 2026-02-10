use tauri::State;
use crate::application::scanner_service::ScannerService;
use crate::application::audit_service::AuditService;
use crate::application::history_service::HistoryService;
use crate::application::wifi_service::WifiService;
use crate::application::external_audit_service::{ExternalAuditRequest, ExternalAuditService};
use crate::application::latest_snapshot_service::LatestSnapshotService;
use crate::application::credential_service::CredentialService;
use crate::api::dtos::{DeviceDTO, SecurityReportDTO, RouterAuditResultDTO};
use crate::api::dtos::WifiNetworkDTO;
use crate::api::dtos::ExternalAuditRequestDTO;
use crate::api::validators::{validate_ipv4_or_cidr, validate_non_empty, validate_usable_host_ipv4};
use crate::domain::entities::{ScanSession, LatestSnapshot, GatewayCredentials};
use std::time::{SystemTime, UNIX_EPOCH};

// --- NETWORK SCANNER ---

#[tauri::command]
pub async fn scan_network(service: State<'_, ScannerService>, _range: Option<String>) -> Result<Vec<DeviceDTO>, String> {
    validate_scan_range(&_range)?;

    // 1. Cridem al cas d'ús
    let devices = service.run_network_scan(_range).await;
    
    // 2. Convertim a DTO
    let dtos = devices.into_iter().map(DeviceDTO::from).collect();
    
    Ok(dtos)
}

#[tauri::command]
pub async fn audit_target(service: State<'_, ScannerService>, ip: String) -> Result<SecurityReportDTO, String> {
    validate_usable_host_ipv4(&ip, "ip")?;

    let (ports, risk) = service.audit_ip(ip.clone()).await;
    
    Ok(SecurityReportDTO {
        target_ip: ip,
        open_ports: ports,
        risk_level: risk,
    })
}

// --- ROUTER AUDIT ---

#[tauri::command]
pub async fn audit_router(service: State<'_, AuditService>, gateway_ip: String) -> Result<RouterAuditResultDTO, String> {
    validate_usable_host_ipv4(&gateway_ip, "gateway_ip")?;

    // Nota: El logging es fa via event global definit al wiring del lib.rs
    let result = service.brute_force_gateway(gateway_ip).await;
    Ok(RouterAuditResultDTO::from(result))
}

#[tauri::command]
pub async fn fetch_router_devices(service: State<'_, AuditService>, gateway_ip: String, user: String, pass: String) -> Result<Vec<DeviceDTO>, String> {
    validate_router_credentials_input(&gateway_ip, &user, &pass)?;

    let devices = service.extract_router_data(gateway_ip, user, pass).await;
    let dtos = devices.into_iter().map(DeviceDTO::from).collect();
    Ok(dtos)
}

// --- HISTORY ---

#[tauri::command]
pub async fn save_scan(service: State<'_, HistoryService>, devices: Vec<crate::domain::entities::Device>) -> Result<String, String> {
    // Nota: El frontend envia JSON que coincideix amb l'estructura de Device.
    // Tauri fa el parsing automàtic a l'entitat gràcies al Deserialize de 'entities.rs'.
    service.save_session(devices).await
}

#[tauri::command]
pub async fn get_history(service: State<'_, HistoryService>) -> Result<Vec<ScanSession>, String> {
    Ok(service.get_history().await)
}

// --- SNAPSHOT (arranque rapido) ---

#[tauri::command]
pub async fn save_latest_snapshot(
    service: State<'_, LatestSnapshotService>,
    devices: Vec<crate::domain::entities::Device>,
) -> Result<(), String> {
    service.save_devices(devices).await
}

#[tauri::command]
pub async fn load_latest_snapshot(service: State<'_, LatestSnapshotService>) -> Result<Option<LatestSnapshot>, String> {
    service.load_snapshot().await
}

// --- CREDENCIALES (gateway) ---

#[tauri::command]
pub async fn save_gateway_credentials(
    service: State<'_, CredentialService>,
    gateway_ip: String,
    user: String,
    pass: String,
) -> Result<(), String> {
    validate_router_credentials_input(&gateway_ip, &user, &pass)?;

    let saved_at = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as u64;

    service
        .save_gateway_credentials(GatewayCredentials {
            gateway_ip,
            user,
            pass,
            saved_at,
        })
        .await
}

#[tauri::command]
pub async fn get_gateway_credentials(
    service: State<'_, CredentialService>,
    gateway_ip: String,
) -> Result<Option<GatewayCredentials>, String> {
    validate_usable_host_ipv4(&gateway_ip, "gateway_ip")?;
    service.get_gateway_credentials(&gateway_ip).await
}

#[tauri::command]
pub async fn delete_gateway_credentials(
    service: State<'_, CredentialService>,
    gateway_ip: String,
) -> Result<(), String> {
    validate_usable_host_ipv4(&gateway_ip, "gateway_ip")?;
    service.delete_gateway_credentials(&gateway_ip).await
}

// --- WIFI RADAR VIEW ---

#[tauri::command]
pub async fn scan_airwaves(service: State<'_, WifiService>) -> Result<Vec<WifiNetworkDTO>, String> {
    let networks = service.scan_airwaves().await?;
    Ok(networks.into_iter().map(WifiNetworkDTO::from).collect())
}

// --- EXTERNAL AUDIT (WRAPPER CLI) ---

#[tauri::command]
pub async fn start_external_audit(
    service: State<'_, ExternalAuditService>,
    app: tauri::AppHandle,
    request: ExternalAuditRequestDTO,
) -> Result<String, String> {
    let env_pairs = request
        .env
        .unwrap_or_default()
        .into_iter()
        .map(|e| (e.key, e.value))
        .collect();

    service
        .start_audit(
            app,
            ExternalAuditRequest {
                binary_path: request.binary_path,
                args: request.args,
                cwd: request.cwd,
                timeout_ms: request.timeout_ms,
                env: env_pairs,
            },
        )
        .await
}

#[tauri::command]
pub async fn cancel_external_audit(service: State<'_, ExternalAuditService>, audit_id: String) -> Result<(), String> {
    service.cancel_audit(&audit_id).await
}

fn validate_scan_range(range: &Option<String>) -> Result<(), String> {
    if let Some(raw) = range {
        validate_ipv4_or_cidr(raw, "range")?;
    }
    Ok(())
}

fn validate_router_credentials_input(gateway_ip: &str, user: &str, pass: &str) -> Result<(), String> {
    validate_usable_host_ipv4(gateway_ip, "gateway_ip")?;
    validate_non_empty(user, "user", 64)?;
    validate_non_empty(pass, "pass", 128)?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn validate_scan_range_accepts_none_and_valid_value() {
        assert!(validate_scan_range(&None).is_ok());
        assert!(validate_scan_range(&Some("192.168.1.0/24".to_string())).is_ok());
    }

    #[test]
    fn validate_scan_range_rejects_invalid_value() {
        assert!(validate_scan_range(&Some("192.168.1.0/99".to_string())).is_err());
    }

    #[test]
    fn validate_router_credentials_rejects_invalid_input() {
        assert!(validate_router_credentials_input("x.y.z.w", "admin", "1234").is_err());
        assert!(validate_router_credentials_input("192.168.1.1", "", "1234").is_err());
        assert!(validate_router_credentials_input("192.168.1.1", "admin", "").is_err());
        assert!(validate_router_credentials_input("127.0.0.1", "admin", "1234").is_err());
    }
}
