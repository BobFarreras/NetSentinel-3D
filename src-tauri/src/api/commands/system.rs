// src-tauri/src/api/commands/system.rs
// Descripcion: comandos runtime (identidad, sniffer, jammer). Mantiene esta capa como "facade" sobre application.

use tauri::{AppHandle, Emitter, State};

use crate::api::state::{JammerState, TrafficState};
use crate::application::opsec::OpSecService;
use crate::domain::entities::HostIdentity;

use super::internal_validation;

#[tauri::command]
pub fn get_identity(service: State<'_, OpSecService>) -> Result<HostIdentity, String> {
    service.get_identity()
}

#[tauri::command]
pub fn start_traffic_sniffing(
    state: State<'_, TrafficState>,
    app: AppHandle,
) -> Result<(), String> {
    let service = state
        .0
        .lock()
        .map_err(|_| "Failed to lock traffic state".to_string())?;
    let app_handle = app.clone();
    service.start_monitoring(move |packet| {
        let _ = app_handle.emit("traffic-event", packet);
    })
}

#[tauri::command]
pub fn stop_traffic_sniffing(state: State<'_, TrafficState>) -> Result<(), String> {
    let service = state
        .0
        .lock()
        .map_err(|_| "Failed to lock traffic state".to_string())?;
    service.stop_monitoring();
    Ok(())
}

#[tauri::command]
pub fn start_jamming(
    state: State<'_, JammerState>,
    ip: String,
    mac: String,
    gateway_ip: String,
) -> Result<(), String> {
    println!("[api][jammer] start_jamming request ip={} mac={} gateway_ip={}", ip, mac, gateway_ip);
    if let Err(err) = internal_validation::validate_start_jamming_input(&ip, &mac, &gateway_ip) {
        eprintln!("[api][jammer] start_jamming validation error err={}", err);
        return Err(err);
    }

    // Dependencia Windows: Npcap (Packet.dll/wpcap.dll) para inyeccion (pnet).
    // Si falta, devolvemos un error claro en vez de reventar al intentar abrir datalink.
    crate::infrastructure::dependencies::npcap::require_npcap("Kill Net")?;

    state.0.start_jamming(ip, mac, gateway_ip);
    println!("[api][jammer] start_jamming accepted");
    Ok(())
}

#[tauri::command]
pub fn stop_jamming(state: State<'_, JammerState>, ip: String) -> Result<(), String> {
    println!("[api][jammer] stop_jamming request ip={}", ip);
    if let Err(err) = internal_validation::validate_stop_jamming_input(&ip) {
        eprintln!("[api][jammer] stop_jamming validation error err={}", err);
        return Err(err);
    }
    // El servicio consume `String`; si queremos reusarlo en logs, logueamos antes.
    state.0.stop_jamming(ip);
    println!("[api][jammer] stop_jamming accepted");
    Ok(())
}
