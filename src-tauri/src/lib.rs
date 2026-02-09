// src-tauri/src/lib.rs

// 1. Mòduls
mod domain;
mod infrastructure;
mod application;
mod api;

use std::sync::Arc;
use tauri::Emitter; 
use tauri::Manager; // 👈 AQUESTA ÉS LA CLAU QUE FALTAVA!

// 2. Imports propis
use crate::infrastructure::{
    system_scanner::SystemScanner,
    chrome_auditor::ChromeAuditor,
    fs_repository::FileHistoryRepository,
};
use crate::application::{
    scanner_service::ScannerService,
    audit_service::AuditService,
    history_service::HistoryService,
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            // --- 1. CAPA D'INFRAESTRUCTURA ---
            let scanner_infra = Arc::new(SystemScanner);
            
            // Auditor amb Logger connectat a Tauri Events
            let handle = app.handle().clone();
            let logger_callback = Arc::new(move |msg: String| {
                let _ = handle.emit("audit-log", msg);
            });
            let auditor_infra = Arc::new(ChromeAuditor::new(logger_callback));
            
            let history_infra = Arc::new(FileHistoryRepository);

            // --- 2. CAPA D'APLICACIÓ ---
            let scanner_service = ScannerService::new(scanner_infra);
            let audit_service = AuditService::new(auditor_infra);
            let history_service = HistoryService::new(history_infra);

            // --- 3. GESTIÓ D'ESTAT ---
            // Ara funcionarà perquè hem importat tauri::Manager
            app.manage(scanner_service);
            app.manage(audit_service);
            app.manage(history_service);

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            api::commands::scan_network,
            api::commands::audit_target,
            api::commands::audit_router,
            api::commands::fetch_router_devices,
            api::commands::save_scan,
            api::commands::get_history
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}