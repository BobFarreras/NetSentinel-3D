// src-tauri/src/api/commands/system.rs

use tauri::{AppHandle, State};

use crate::api::state::{JammerState, TrafficState};
use crate::domain::entities::HostIdentity;
use crate::infrastructure::repositories::local_intelligence;

pub fn get_identity() -> Result<HostIdentity, String> {
    local_intelligence::get_host_identity().map_err(|e| e.to_string())
}

pub fn start_traffic_sniffing(state: State<'_, TrafficState>, app: AppHandle) -> Result<(), String> {
    let service = state.0.lock().map_err(|_| "Failed to lock traffic state".to_string())?;
    service.start_monitoring(app)
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
