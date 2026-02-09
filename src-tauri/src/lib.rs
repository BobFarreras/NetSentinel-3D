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
use crate::domain::entities::HostIdentity;
use crate::infrastructure::repositories::local_intelligence;

// 2. Imports propis (Infraestructura)
use crate::infrastructure::{
    chrome_auditor::ChromeAuditor, fs_repository::FileHistoryRepository,
    system_scanner::SystemScanner,
};

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
    let service = state.0.lock().map_err(|_| "Failed to lock jammer state")?;
    service.start_jamming(ip, mac, gateway_ip);
    Ok(())
}

#[tauri::command]
fn stop_jamming(state: State<JammerState>, ip: String) -> Result<(), String> {
    let service = state.0.lock().map_err(|_| "Failed to lock jammer state")?;
    service.stop_jamming(ip);
    Ok(())
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

            // Auditor amb Logger connectat a Tauri Events
            let handle = app.handle().clone();
            let logger_callback = Arc::new(move |msg: String| {
                let _ = handle.emit("audit-log", msg);
            });
            let auditor_infra = Arc::new(ChromeAuditor::new(logger_callback));

            let history_infra = Arc::new(FileHistoryRepository);
            let jammer_service = JammerService::new();
            // =====================================================
            // 2. CAPA D'APLICACIÓ (El "Cervell")
            // =====================================================
            let scanner_service = ScannerService::new(scanner_infra);
            let audit_service = AuditService::new(auditor_infra);
            let history_service = HistoryService::new(history_infra);

            // El Traffic Service no depèn d'infra externa injectada, es crea directe
            let traffic_service = TrafficService::new();

            // =====================================================
            // 3. GESTIÓ D'ESTAT (Registrar a Tauri)
            // =====================================================
            app.manage(scanner_service);
            app.manage(audit_service);
            app.manage(history_service);

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
