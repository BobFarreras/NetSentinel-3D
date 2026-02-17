// src-tauri/src/lib.rs
// Entry point Tauri: wiring de infraestructura/aplicacion, registro de comandos y eventos globales.

// 1. Modulos
mod api;
mod application;
mod domain;
mod infrastructure;

use std::sync::{Arc, Mutex};
use tauri::{Emitter, Manager};

use crate::application::attack_lab::AttackLabService;
use crate::application::audit::AuditService;
use crate::application::credentials::CredentialService;
use crate::application::gateway_credential_presets::GatewayCredentialPresetService;
use crate::application::history::HistoryService;
use crate::application::http_fingerprint::HttpFingerprintService;
use crate::application::jammer::JammerService;
use crate::application::opsec::{MacChangerService, OpSecService};
use crate::application::scan::ScannerService;
use crate::application::settings::SettingsService;
use crate::application::snapshot::LatestSnapshotService;
use crate::application::traffic::TrafficService;
use crate::application::wifi::WifiService;
use crate::application::wordlist::WordlistService;

// 2. Imports propios (Infraestructura)
use crate::infrastructure::attack_lab::runner::TokioProcessAttackLabRunner;
use crate::infrastructure::network::jammer_engine::PnetJammerEngine;
use crate::infrastructure::network::traffic_sniffer::TrafficSniffer;
use crate::infrastructure::network::vendor_lookup::SystemVendorLookup;
use crate::infrastructure::network::vendor_resolver::VendorResolver;
use crate::infrastructure::persistence::credential_store::KeyringCredentialStore;
use crate::infrastructure::persistence::gateway_credential_preset_repository::FileGatewayCredentialPresetRepository;
use crate::infrastructure::persistence::history_repository::FileHistoryRepository;
use crate::infrastructure::persistence::latest_snapshot_repository::FileLatestSnapshotRepository;
use crate::infrastructure::router_audit::chrome_auditor::ChromeAuditor;
use crate::infrastructure::system_scanner::SystemScanner;
use crate::infrastructure::wifi::wifi_connector::WifiConnector;
use crate::infrastructure::wifi::wifi_scanner::SystemWifiScanner;

use crate::infrastructure::persistence::settings_store::FileSettingsStore;
use crate::infrastructure::persistence::wordlist_repository::FileWordlistRepository; // Ajusta la ruta si la cambiaste
use crate::infrastructure::repositories::host_identity_provider::LocalIntelligenceHostIdentityProvider;
// 3. Imports propios (Aplicacion)

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
            let traffic_sniffer_infra = Arc::new(TrafficSniffer);
            let wifi_scanner_infra = Arc::new(SystemWifiScanner::new());
            let wifi_connector_infra = Arc::new(WifiConnector);
            // Seed opcional del OUI para mejorar resolucion de vendors en el primer arranque.
            VendorResolver::ensure_oui_seeded();

            // Presets de credenciales (user/pass) para gateways: JSON local en app_config_dir
            // Nota: se construye temprano porque el auditor infra lo consume via callback (no hardcode).
            let gateway_preset_repo =
                Arc::new(FileGatewayCredentialPresetRepository::new(app.handle()));
            let gateway_preset_service =
                GatewayCredentialPresetService::new(gateway_preset_repo.clone());

            // Auditor con logger conectado a eventos Tauri.
            let handle = app.handle().clone();
            let logger_callback = Arc::new(move |msg: String| {
                let _ = handle.emit("audit-log", msg);
            });

            // Inyectamos el diccionario de presets en el auditor (configurable por UI).
            // Usamos una instancia dedicada del servicio para evitar acoplar Tauri State al callback.
            let preset_service_for_auditor =
                Arc::new(GatewayCredentialPresetService::new(gateway_preset_repo));
            let credential_provider = Arc::new(move |gateway_ip: &str| {
                preset_service_for_auditor
                    .list(gateway_ip)
                    .unwrap_or_default()
                    .into_iter()
                    .map(|p| (p.user, p.pass))
                    .collect::<Vec<(String, String)>>()
            });
            let auditor_infra = Arc::new(ChromeAuditor::new(logger_callback, credential_provider));

            let history_infra = Arc::new(FileHistoryRepository);
            let latest_snapshot_infra = Arc::new(FileLatestSnapshotRepository);
            let credential_store_infra = Arc::new(KeyringCredentialStore::new("netsentinel"));
            let host_identity_infra = Arc::new(LocalIntelligenceHostIdentityProvider);
            let jammer_engine = Arc::new(PnetJammerEngine::new(host_identity_infra));
            let jammer_service = Arc::new(JammerService::new(jammer_engine));
            // =====================================================
            // 2. CAPA DE APLICACION (el "cerebro")
            // =====================================================
            let scanner_service = ScannerService::new(scanner_infra.clone());
            let audit_service = AuditService::new(auditor_infra);
            let history_service = HistoryService::new(history_infra);
            let latest_snapshot_service = LatestSnapshotService::new(latest_snapshot_infra);
            let credential_service = CredentialService::new(credential_store_infra);
            let vendor_lookup_infra = Arc::new(SystemVendorLookup);
            let wifi_service = WifiService::new(
                wifi_scanner_infra,
                vendor_lookup_infra,
                wifi_connector_infra,
            );
            let attack_lab_runner_infra = Arc::new(TokioProcessAttackLabRunner);
            let attack_lab_service = AttackLabService::new(attack_lab_runner_infra);
            let http_fingerprint_service = HttpFingerprintService::new()?;

            // Traffic
            let traffic_service = TrafficService::new(scanner_infra.clone(), traffic_sniffer_infra);

            // Infra y Wordlist
            let wordlist_repo = Arc::new(FileWordlistRepository::new(app.handle()));
            let wordlist_service = WordlistService::new(wordlist_repo);
            // gateway_preset_service ya esta creado arriba.
            //
            let settings_store_infra = Arc::new(FileSettingsStore::new(app.handle()));
            let settings_service = Arc::new(SettingsService::new(settings_store_infra));
            let mac_changer_service = Arc::new(MacChangerService::new());
            // OpSec (ahora recibe 3 argumentos)
            let opsec_service = OpSecService::new(
                scanner_infra.clone(),
                settings_service.clone(),
                mac_changer_service.clone(),
            );
            // =====================================================
            // 3. GESTION DE ESTADO (registrar en Tauri)
            // =====================================================
            app.manage(scanner_service);
            app.manage(audit_service);
            app.manage(history_service);
            app.manage(latest_snapshot_service);
            app.manage(credential_service);
            app.manage(wifi_service);
            app.manage(attack_lab_service);
            app.manage(http_fingerprint_service);

            // Estados runtime: sniffer/jammer.
            app.manage(crate::api::state::TrafficState(Mutex::new(traffic_service)));
            app.manage(crate::api::state::JammerState(jammer_service));

            // Manage State
            app.manage(wordlist_service);
            app.manage(gateway_preset_service);

            // Registramos el estado
            app.manage(settings_service);
            app.manage(opsec_service);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // API (comandos) - facade en `src-tauri/src/api/commands/mod.rs`
            api::commands::scanner::scan_network,
            api::commands::scanner::audit_target,
            
            api::commands::router_audit::audit_router,
            api::commands::router_audit::fetch_router_devices,
            api::commands::history::save_scan,
            api::commands::history::get_history,
            api::commands::snapshot::save_latest_snapshot,
            api::commands::snapshot::load_latest_snapshot,
            // Settings
            api::commands::settings::get_app_settings,
            api::commands::settings::save_app_settings,
            api::commands::settings::set_ui_language,
            api::commands::credentials::save_gateway_credentials,
            api::commands::credentials::get_gateway_credentials,
            api::commands::credentials::delete_gateway_credentials,
            api::commands::gateway_credential_presets::list_gateway_credential_presets,
            api::commands::gateway_credential_presets::add_gateway_credential_preset,
            api::commands::gateway_credential_presets::remove_gateway_credential_preset,
            api::commands::gateway_credential_presets::update_gateway_credential_preset,
            // Wifi
            api::commands::wifi::scan_airwaves,
            api::commands::wifi::wifi_connect,
            // HTTP Fingerprint
            api::commands::http_fingerprint::fingerprint_http_headers,
            // External audit
            api::commands::attack_lab::start_attack_lab,
            api::commands::attack_lab::cancel_attack_lab,

            api::commands::scanner::run_iot_scan,
            // System / runtime
            api::commands::system::get_identity,
            api::commands::system::start_traffic_sniffing,
            api::commands::system::stop_traffic_sniffing,
            api::commands::system::start_jamming,
            api::commands::system::stop_jamming,
            // WORDLIST COMMANDS
            api::commands::wordlist::get_dictionary,
            api::commands::wordlist::add_to_dictionary,
            api::commands::wordlist::remove_from_dictionary,
            api::commands::wordlist::update_in_dictionary,
            // OPSEC
            api::commands::opsec::check_mac_security,
            api::commands::opsec::randomize_mac,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
