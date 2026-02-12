// src-tauri/src/lib.rs

// 1. Modulos
mod api;
mod application;
mod domain;
mod infrastructure;

use std::sync::{Arc, Mutex};
use tauri::{Emitter, Manager};

use crate::application::credential_service::CredentialService;
use crate::application::external_audit_service::ExternalAuditService;
use crate::application::jammer_service::JammerService;
use crate::application::latest_snapshot_service::LatestSnapshotService;
use crate::application::traffic_service::TrafficService;
use crate::application::wifi_service::WifiService;

// 2. Imports propios (Infraestructura)
use crate::infrastructure::credential_store::KeyringCredentialStore;
use crate::infrastructure::latest_snapshot_repository::FileLatestSnapshotRepository;
use crate::infrastructure::network::vendor_lookup::SystemVendorLookup;
use crate::infrastructure::network::vendor_resolver::VendorResolver;
use crate::infrastructure::wifi::wifi_scanner::SystemWifiScanner;
use crate::infrastructure::{
    fs_repository::FileHistoryRepository, router_audit::chrome_auditor::ChromeAuditor,
    system_scanner::SystemScanner,
};

use crate::application::opsec_service::OpSecService;
use crate::application::wordlist_service::WordlistService;
use crate::infrastructure::persistence::wordlist_repository::FileWordlistRepository; // Ajusta la ruta si la cambiaste
// 3. Imports propios (Aplicacion)
use crate::application::{
    audit_service::AuditService, history_service::HistoryService, scanner_service::ScannerService,
};

// --- PUNTO DE ENTRADA PRINCIPAL ---

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            // =====================================================
            // 1. CAPA DE INFRAESTRUCTURA (los "musculos")
            // =====================================================
            let scanner_infra = Arc::new(SystemScanner);
            let wifi_scanner_infra = Arc::new(SystemWifiScanner::new());
            // Seed opcional del OUI para mejorar resolucion de vendors en el primer arranque.
            VendorResolver::ensure_oui_seeded();

            // Auditor con logger conectado a eventos Tauri.
            let handle = app.handle().clone();
            let logger_callback = Arc::new(move |msg: String| {
                let _ = handle.emit("audit-log", msg);
            });
            let auditor_infra = Arc::new(ChromeAuditor::new(logger_callback));

            let history_infra = Arc::new(FileHistoryRepository);
            let latest_snapshot_infra = Arc::new(FileLatestSnapshotRepository);
            let credential_store_infra = Arc::new(KeyringCredentialStore::new("netsentinel"));
            let jammer_service = Arc::new(JammerService::new());
            // =====================================================
            // 2. CAPA DE APLICACION (el "cerebro")
            // =====================================================
            let scanner_service = ScannerService::new(scanner_infra.clone());
            let audit_service = AuditService::new(auditor_infra);
            let history_service = HistoryService::new(history_infra);
            let latest_snapshot_service = LatestSnapshotService::new(latest_snapshot_infra);
            let credential_service = CredentialService::new(credential_store_infra);
            let vendor_lookup_infra = Arc::new(SystemVendorLookup);
            let wifi_service = WifiService::new(wifi_scanner_infra, vendor_lookup_infra);
            let external_audit_service = ExternalAuditService::new();

            // Traffic
            let traffic_service = TrafficService::new();

            // Infra y Wordlist
            let wordlist_repo = FileWordlistRepository::new(app.handle());
            let wordlist_service = WordlistService::new(wordlist_repo);

            // OpSec Service
            // CORRECCIÓN: Ahora podemos usar scanner_infra porque lo clonamos antes
            // (O podemos volver a clonarlo si queremos ser explícitos, pero ya no dará error de 'moved value')
            let opsec_service = OpSecService::new(scanner_infra);
            // =====================================================
            // 3. GESTION DE ESTADO (registrar en Tauri)
            // =====================================================
            app.manage(scanner_service);
            app.manage(audit_service);
            app.manage(history_service);
            app.manage(latest_snapshot_service);
            app.manage(credential_service);
            app.manage(wifi_service);
            app.manage(external_audit_service);

            // Estados runtime: sniffer/jammer.
            app.manage(crate::api::state::TrafficState(Mutex::new(traffic_service)));
            app.manage(crate::api::state::JammerState(jammer_service));

            // Manage State
            app.manage(wordlist_service);

            // Registramos el estado
            app.manage(opsec_service);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // API (comandos) - facade en `src-tauri/src/api/commands.rs`
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
            // Wifi
            api::commands::scan_airwaves,
            api::commands::wifi_connect,
            // External audit
            api::commands::start_external_audit,
            api::commands::cancel_external_audit,
            // System / runtime
            api::commands::get_identity,
            api::commands::start_traffic_sniffing,
            api::commands::stop_traffic_sniffing,
            api::commands::start_jamming,
            api::commands::stop_jamming,
            // WORDLIST COMMANDS
            api::commands::get_dictionary,
            api::commands::add_to_dictionary,
            // OPSEC
            api::commands::check_mac_security
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
