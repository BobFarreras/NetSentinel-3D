// src-tauri/src/api/commands/system.rs
// Descripcion: comandos runtime (identidad, sniffer, jammer). Mantiene esta capa como "facade" sobre application.

use tauri::{AppHandle, State, Emitter};

use crate::api::state::{JammerState, TrafficState};
use crate::domain::entities::HostIdentity;
use crate::application::opsec::OpSecService;

pub fn get_identity(service: State<'_, OpSecService>) -> Result<HostIdentity, String> {
    service.get_identity()
}

pub fn start_traffic_sniffing(state: State<'_, TrafficState>, app: AppHandle) -> Result<(), String> {
    let service = state.0.lock().map_err(|_| "Failed to lock traffic state".to_string())?;
    let app_handle = app.clone();
    service.start_monitoring(move |packet| {
        let _ = app_handle.emit("traffic-event", packet);
    })
}

pub fn stop_traffic_sniffing(state: State<'_, TrafficState>) -> Result<(), String> {
    let service = state.0.lock().map_err(|_| "Failed to lock traffic state".to_string())?;
    service.stop_monitoring();
    Ok(())
}

pub fn start_jamming(state: State<'_, JammerState>, ip: String, mac: String, gateway_ip: String) -> Result<(), String> {
    println!(
        "[system][jammer] start_jamming dispatch ip={} mac={} gateway_ip={}",
        ip, mac, gateway_ip
    );
    state.0.start_jamming(ip, mac, gateway_ip);
    println!("[system][jammer] start_jamming accepted");
    Ok(())
}

pub fn stop_jamming(state: State<'_, JammerState>, ip: String) -> Result<(), String> {
    println!("[system][jammer] stop_jamming dispatch ip={}", ip);
    println!("[system][jammer] stop_jamming accepted ip={}", ip);
    state.0.stop_jamming(ip);
    Ok(())
}
