// src-tauri/src/lib.rs

// 1. Mòduls
mod api;
mod application;
mod domain;
mod infrastructure;

use std::sync::{Arc, Mutex};
use tauri::{Emitter, Manager, State};

use crate::application::jammer_service::JammerService;
use crate::application::traffic_service::TrafficService;
use crate::application::wifi_service::WifiService;
use crate::application::external_audit_service::ExternalAuditService;
use crate::application::latest_snapshot_service::LatestSnapshotService;
use crate::application::credential_service::CredentialService;
use crate::api::validators::{validate_mac_address, validate_usable_host_ipv4};
use crate::domain::entities::HostIdentity;
use crate::infrastructure::repositories::local_intelligence;

// 2. Imports propis (Infraestructura)
use crate::infrastructure::{
    chrome_auditor::ChromeAuditor, fs_repository::FileHistoryRepository,
    system_scanner::SystemScanner,
};
use crate::infrastructure::latest_snapshot_repository::FileLatestSnapshotRepository;
use crate::infrastructure::credential_store::KeyringCredentialStore;
use crate::infrastructure::wifi::wifi_scanner::SystemWifiScanner;
use crate::infrastructure::network::vendor_resolver::VendorResolver;

// 3. Imports propis (Aplicació)
use crate::application::{
    audit_service::AuditService, history_service::HistoryService, scanner_service::ScannerService,
};

// --- ESTAT GLOBAL PER AL SNIFFER ---
// Necessitem un Mutex perquè diversos fils hi poden accedir, encara que el servei gestiona la seva pròpia concurrència.
struct TrafficState(Mutex<TrafficService>);
struct JammerState(Mutex<JammerService>);
// --- COMANDES SISTEMA (Les deixem aquí o les podem moure a api/commands.rs en el futur) ---

#[tauri::command]
fn get_identity() -> Result<HostIdentity, String> {
    local_intelligence::get_host_identity().map_err(|e| e.to_string())
}

#[tauri::command]
fn start_traffic_sniffing(state: State<TrafficState>, app: tauri::AppHandle) -> Result<(), String> {
    // Recuperem el servei de l'estat i l'arranquem
    let service = state.0.lock().map_err(|_| "Failed to lock traffic state")?;
    service.start_monitoring(app);
    Ok(())
}

#[tauri::command]
fn stop_traffic_sniffing(state: State<TrafficState>) -> Result<(), String> {
    // Recuperem el servei i l'aturem
    let service = state.0.lock().map_err(|_| "Failed to lock traffic state")?;
    service.stop_monitoring();
    Ok(())
}

#[tauri::command]
fn start_jamming(
    state: State<JammerState>,
    ip: String,
    mac: String,
    gateway_ip: String,
) -> Result<(), String> {
    validate_start_jamming_input(&ip, &mac, &gateway_ip)?;

    let service = state.0.lock().map_err(|_| "Failed to lock jammer state")?;
    service.start_jamming(ip, mac, gateway_ip);
    Ok(())
}

#[tauri::command]
fn stop_jamming(state: State<JammerState>, ip: String) -> Result<(), String> {
    validate_stop_jamming_input(&ip)?;

    let service = state.0.lock().map_err(|_| "Failed to lock jammer state")?;
    service.stop_jamming(ip);
    Ok(())
}

fn validate_start_jamming_input(ip: &str, mac: &str, gateway_ip: &str) -> Result<(), String> {
    validate_usable_host_ipv4(ip, "ip")?;
    validate_mac_address(mac, "mac")?;
    validate_usable_host_ipv4(gateway_ip, "gateway_ip")?;
    if ip.trim() == gateway_ip.trim() {
        return Err("ip and gateway_ip cannot be the same".to_string());
    }
    Ok(())
}

fn validate_stop_jamming_input(ip: &str) -> Result<(), String> {
    validate_usable_host_ipv4(ip, "ip")
}
// --- PUNT D'ENTRADA PRINCIPAL ---

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            // =====================================================
            // 1. CAPA D'INFRAESTRUCTURA (Els "Músculs")
            // =====================================================
            let scanner_infra = Arc::new(SystemScanner);
            let wifi_scanner_infra = Arc::new(SystemWifiScanner::new());
            // Seed opcional del OUI para mejorar resolucion de vendors en el primer arranque.
            VendorResolver::ensure_oui_seeded();

            // Auditor amb Logger connectat a Tauri Events
            let handle = app.handle().clone();
            let logger_callback = Arc::new(move |msg: String| {
                let _ = handle.emit("audit-log", msg);
            });
            let auditor_infra = Arc::new(ChromeAuditor::new(logger_callback));

            let history_infra = Arc::new(FileHistoryRepository);
            let latest_snapshot_infra = Arc::new(FileLatestSnapshotRepository);
            let credential_store_infra = Arc::new(KeyringCredentialStore::new("netsentinel"));
            let jammer_service = JammerService::new();
            // =====================================================
            // 2. CAPA D'APLICACIÓ (El "Cervell")
            // =====================================================
            let scanner_service = ScannerService::new(scanner_infra);
            let audit_service = AuditService::new(auditor_infra);
            let history_service = HistoryService::new(history_infra);
            let latest_snapshot_service = LatestSnapshotService::new(latest_snapshot_infra);
            let credential_service = CredentialService::new(credential_store_infra);
            let wifi_service = WifiService::new(wifi_scanner_infra);
            let external_audit_service = ExternalAuditService::new();

            // El Traffic Service no depèn d'infra externa injectada, es crea directe
            let traffic_service = TrafficService::new();

            // =====================================================
            // 3. GESTIÓ D'ESTAT (Registrar a Tauri)
            // =====================================================
            app.manage(scanner_service);
            app.manage(audit_service);
            app.manage(history_service);
            app.manage(latest_snapshot_service);
            app.manage(credential_service);
            app.manage(wifi_service);
            app.manage(external_audit_service);

            // Registrem el TrafficService dins del wrapper TrafficState
            app.manage(TrafficState(Mutex::new(traffic_service)));
            app.manage(JammerState(Mutex::new(jammer_service)));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // API Existent
            api::commands::scan_network,
            api::commands::audit_target,
            api::commands::audit_router,
            api::commands::fetch_router_devices,
            api::commands::save_scan,
            api::commands::get_history,
            api::commands::save_latest_snapshot,
            api::commands::load_latest_snapshot,
            api::commands::save_gateway_credentials,
            api::commands::get_gateway_credentials,
            api::commands::delete_gateway_credentials,
            api::commands::scan_airwaves,
            api::commands::start_external_audit,
            api::commands::cancel_external_audit,
            // Noves comandes registrades a lib.rs
            get_identity,
            start_traffic_sniffing,
            stop_traffic_sniffing,
            start_jamming,
            stop_jamming
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn validate_start_jamming_input_accepts_valid_values() {
        assert!(validate_start_jamming_input("192.168.1.20", "AA:BB:CC:DD:EE:FF", "192.168.1.1").is_ok());
    }

    #[test]
    fn validate_start_jamming_input_rejects_invalid_values() {
        assert!(validate_start_jamming_input("bad-ip", "AA:BB:CC:DD:EE:FF", "192.168.1.1").is_err());
        assert!(validate_start_jamming_input("192.168.1.20", "BAD-MAC", "192.168.1.1").is_err());
        assert!(validate_start_jamming_input("192.168.1.20", "AA:BB:CC:DD:EE:FF", "bad-ip").is_err());
        assert!(validate_start_jamming_input("192.168.1.1", "AA:BB:CC:DD:EE:FF", "192.168.1.1").is_err());
    }

    #[test]
    fn validate_stop_jamming_input_rejects_invalid_ip() {
        assert!(validate_stop_jamming_input("192.168.1.50").is_ok());
        assert!(validate_stop_jamming_input("not-an-ip").is_err());
        assert!(validate_stop_jamming_input("127.0.0.1").is_err());
    }
}
