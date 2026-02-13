// src-tauri/src/api/commands.rs

// Este modulo expone comandos Tauri (con `#[tauri::command]`) y delega su implementacion a submodulos
// agrupados por dominio. Esto evita un archivo monolitico sin romper el wiring de `generate_handler!`

// Submodulos (separacion por responsabilidades / SOLID)
#[path = "commands/credentials.rs"]
mod credentials;
#[path = "commands/attack_lab.rs"]
mod attack_lab;
#[path = "commands/external_audit.rs"]
mod external_audit;
#[path = "commands/history.rs"]
mod history;
#[path = "commands/internal_validation.rs"]
mod internal_validation;
#[path = "commands/opsec.rs"]
mod opsec;
#[path = "commands/router_audit.rs"]
mod router_audit;
#[path = "commands/scanner.rs"]
mod scanner;
#[path = "commands/snapshot.rs"]
mod snapshot;
#[path = "commands/system.rs"]
mod system;
#[path = "commands/wifi.rs"]
mod wifi;
#[path = "commands/wordlist.rs"]
mod wordlist;

// --- NETWORK SCANNER ---

#[tauri::command]
pub async fn scan_network(
    service: tauri::State<'_, crate::application::scanner_service::ScannerService>,
    range: Option<String>,
) -> Result<Vec<crate::api::dtos::DeviceDTO>, String> {
    scanner::scan_network(service, range).await
}

#[tauri::command]
pub async fn audit_target(
    service: tauri::State<'_, crate::application::scanner_service::ScannerService>,
    ip: String,
) -> Result<crate::api::dtos::SecurityReportDTO, String> {
    scanner::audit_target(service, ip).await
}

// --- ROUTER AUDIT ---

#[tauri::command]
pub async fn audit_router(
    service: tauri::State<'_, crate::application::audit_service::AuditService>,
    gateway_ip: String,
) -> Result<crate::api::dtos::RouterAuditResultDTO, String> {
    router_audit::audit_router(service, gateway_ip).await
}

#[tauri::command]
pub async fn fetch_router_devices(
    service: tauri::State<'_, crate::application::audit_service::AuditService>,
    gateway_ip: String,
    user: String,
    pass: String,
) -> Result<Vec<crate::api::dtos::DeviceDTO>, String> {
    router_audit::fetch_router_devices(service, gateway_ip, user, pass).await
}

// --- HISTORY ---

#[tauri::command]
pub async fn save_scan(
    service: tauri::State<'_, crate::application::history_service::HistoryService>,
    devices: Vec<crate::domain::entities::Device>,
) -> Result<String, String> {
    history::save_scan(service, devices).await
}

#[tauri::command]
pub async fn get_history(
    service: tauri::State<'_, crate::application::history_service::HistoryService>,
) -> Result<Vec<crate::domain::entities::ScanSession>, String> {
    history::get_history(service).await
}

// --- SNAPSHOT (arranque rapido) ---

#[tauri::command]
pub async fn save_latest_snapshot(
    service: tauri::State<'_, crate::application::latest_snapshot_service::LatestSnapshotService>,
    devices: Vec<crate::domain::entities::Device>,
) -> Result<(), String> {
    snapshot::save_latest_snapshot(service, devices).await
}

#[tauri::command]
pub async fn load_latest_snapshot(
    service: tauri::State<'_, crate::application::latest_snapshot_service::LatestSnapshotService>,
) -> Result<Option<crate::domain::entities::LatestSnapshot>, String> {
    snapshot::load_latest_snapshot(service).await
}

// --- CREDENCIALES (gateway) ---

#[tauri::command]
pub async fn save_gateway_credentials(
    service: tauri::State<'_, crate::application::credential_service::CredentialService>,
    gateway_ip: String,
    user: String,
    pass: String,
) -> Result<(), String> {
    credentials::save_gateway_credentials(service, gateway_ip, user, pass).await
}

#[tauri::command]
pub async fn get_gateway_credentials(
    service: tauri::State<'_, crate::application::credential_service::CredentialService>,
    gateway_ip: String,
) -> Result<Option<crate::domain::entities::GatewayCredentials>, String> {
    credentials::get_gateway_credentials(service, gateway_ip).await
}

#[tauri::command]
pub async fn delete_gateway_credentials(
    service: tauri::State<'_, crate::application::credential_service::CredentialService>,
    gateway_ip: String,
) -> Result<(), String> {
    credentials::delete_gateway_credentials(service, gateway_ip).await
}

// --- WIFI RADAR VIEW ---

#[tauri::command]
pub async fn scan_airwaves(
    service: tauri::State<'_, crate::application::wifi_service::WifiService>,
) -> Result<Vec<crate::api::dtos::WifiNetworkDTO>, String> {
    wifi::scan_airwaves(service).await
}

#[tauri::command]
pub async fn wifi_connect(
    service: tauri::State<'_, crate::application::wifi_service::WifiService>,
    ssid: String,
    password: String,
) -> Result<bool, String> {
    wifi::wifi_connect(service, ssid, password).await
}

// --- ATTACK LAB (WRAPPER CLI) ---

#[tauri::command]
pub async fn start_attack_lab(
    service: tauri::State<'_, crate::application::attack_lab_service::AttackLabService>,
    app: tauri::AppHandle,
    request: crate::api::dtos::AttackLabRequestDTO,
) -> Result<String, String> {
    attack_lab::start_attack_lab(service, app, request).await
}

#[tauri::command]
pub async fn cancel_attack_lab(
    service: tauri::State<'_, crate::application::attack_lab_service::AttackLabService>,
    audit_id: String,
) -> Result<(), String> {
    attack_lab::cancel_attack_lab(service, audit_id).await
}

// --- EXTERNAL AUDIT (LEGACY / alias) ---

#[tauri::command]
pub async fn start_external_audit(
    service: tauri::State<'_, crate::application::external_audit_service::ExternalAuditService>,
    app: tauri::AppHandle,
    request: crate::api::dtos::ExternalAuditRequestDTO,
) -> Result<String, String> {
    external_audit::start_external_audit(service, app, request).await
}

#[tauri::command]
pub async fn cancel_external_audit(
    service: tauri::State<'_, crate::application::external_audit_service::ExternalAuditService>,
    audit_id: String,
) -> Result<(), String> {
    external_audit::cancel_external_audit(service, audit_id).await
}

// --- SYSTEM / RUNTIME ---

#[tauri::command]
pub fn get_identity() -> Result<crate::domain::entities::HostIdentity, String> {
    system::get_identity()
}

#[tauri::command]
pub fn start_traffic_sniffing(
    state: tauri::State<'_, crate::api::state::TrafficState>,
    app: tauri::AppHandle,
) -> Result<(), String> {
    system::start_traffic_sniffing(state, app)
}

#[tauri::command]
pub fn stop_traffic_sniffing(
    state: tauri::State<'_, crate::api::state::TrafficState>,
) -> Result<(), String> {
    system::stop_traffic_sniffing(state)
}

#[tauri::command]
pub fn start_jamming(
    state: tauri::State<'_, crate::api::state::JammerState>,
    ip: String,
    mac: String,
    gateway_ip: String,
) -> Result<(), String> {
    println!(
        "[api][jammer] start_jamming request ip={} mac={} gateway_ip={}",
        ip, mac, gateway_ip
    );
    if let Err(err) = internal_validation::validate_start_jamming_input(&ip, &mac, &gateway_ip) {
        eprintln!("[api][jammer] start_jamming validation error err={}", err);
        return Err(err);
    }
    system::start_jamming(state, ip, mac, gateway_ip)
}

#[tauri::command]
pub fn stop_jamming(
    state: tauri::State<'_, crate::api::state::JammerState>,
    ip: String,
) -> Result<(), String> {
    println!("[api][jammer] stop_jamming request ip={}", ip);
    if let Err(err) = internal_validation::validate_stop_jamming_input(&ip) {
        eprintln!("[api][jammer] stop_jamming validation error err={}", err);
        return Err(err);
    }
    system::stop_jamming(state, ip)
}

// --- WORDLIST (DICCIONARIO) ---

#[tauri::command]
pub async fn get_dictionary(
    service: tauri::State<'_, crate::application::wordlist_service::WordlistService>,
) -> Result<Vec<String>, String> {
    wordlist::get_dictionary(service) // Nota: Delegación directa
}

#[tauri::command]
pub async fn add_to_dictionary(
    service: tauri::State<'_, crate::application::wordlist_service::WordlistService>,
    word: String,
) -> Result<(), String> {
    wordlist::add_to_dictionary(service, word)
}

#[tauri::command]
pub async fn check_mac_security(
    service: tauri::State<'_, crate::application::opsec_service::OpSecService>,
) -> Result<crate::api::dtos::MacSecurityStatusDTO, String> {
    opsec::check_mac_security(service) // Lógica síncrona envuelta en async para Tauri
}

#[tauri::command]
pub async fn remove_from_dictionary(
    service: tauri::State<'_, crate::application::wordlist_service::WordlistService>,
    word: String,
) -> Result<Vec<String>, String> {
    service.remove_word(word)
}

#[tauri::command]
pub async fn update_in_dictionary(
    service: tauri::State<'_, crate::application::wordlist_service::WordlistService>,
    old_word: String,
    new_word: String,
) -> Result<Vec<String>, String> {
    service.update_word(old_word, new_word)
}

#[tauri::command]
pub async fn randomize_mac(
    service: tauri::State<'_, crate::application::opsec_service::OpSecService>,
) -> Result<String, String> {
    opsec::randomize_mac(service).await
}
