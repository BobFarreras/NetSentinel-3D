// src-tauri/src/api/commands/scanner.rs

use tauri::State;

use crate::api::dtos::{DeviceDTO, SecurityReportDTO};
use crate::api::validators::validate_usable_host_ipv4;
use crate::application::scan::ScannerService;

use super::internal_validation::validate_scan_range;

// --- NETWORK SCANNER ---
pub async fn scan_network(
    service: State<'_, ScannerService>,
    range: Option<String>,
) -> Result<Vec<DeviceDTO>, String> {
    validate_scan_range(&range)?;

    // 1) Llamamos al caso de uso.
    let devices = service.run_network_scan(range).await;

    // 2) Convertimos a DTO.
    Ok(devices.into_iter().map(DeviceDTO::from).collect())
}

pub async fn audit_target(
    service: State<'_, ScannerService>,
    ip: String,
) -> Result<SecurityReportDTO, String> {
    validate_usable_host_ipv4(&ip, "ip")?;

    let (ports, risk) = service.audit_ip(ip.clone()).await;

    Ok(SecurityReportDTO {
        target_ip: ip,
        open_ports: ports,
        risk_level: risk,
    })
}

pub async fn run_iot_scan(
    service: State<'_, ScannerService>,
    target_ip: String,
) -> Result<SecurityReportDTO, String> {
    validate_usable_host_ipv4(&target_ip, "target_ip")?;
    let (ports, risk) = service.run_iot_profile(target_ip.clone()).await;
    Ok(SecurityReportDTO {
        target_ip,
        open_ports: ports,
        risk_level: risk,
    })
}
