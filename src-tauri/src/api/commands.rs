use tauri::State;
use crate::application::scanner_service::ScannerService;
use crate::application::audit_service::AuditService;
use crate::application::history_service::HistoryService;
use crate::api::dtos::{DeviceDTO, SecurityReportDTO, RouterAuditResultDTO};
use crate::domain::entities::ScanSession;

// --- NETWORK SCANNER ---

#[tauri::command]
pub async fn scan_network(service: State<'_, ScannerService>, _range: Option<String>) -> Result<Vec<DeviceDTO>, String> {
    // 1. Cridem al cas d'ús
    let devices = service.run_network_scan(_range).await;
    
    // 2. Convertim a DTO
    let dtos = devices.into_iter().map(DeviceDTO::from).collect();
    
    Ok(dtos)
}

#[tauri::command]
pub async fn audit_target(service: State<'_, ScannerService>, ip: String) -> Result<SecurityReportDTO, String> {
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
    // Nota: El logging es fa via event global definit al wiring del lib.rs
    let result = service.brute_force_gateway(gateway_ip).await;
    Ok(RouterAuditResultDTO::from(result))
}

#[tauri::command]
pub async fn fetch_router_devices(service: State<'_, AuditService>, gateway_ip: String, user: String, pass: String) -> Result<Vec<DeviceDTO>, String> {
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