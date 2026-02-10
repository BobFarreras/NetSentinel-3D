// src-tauri/src/api/state.rs

use std::sync::Mutex;

use crate::application::jammer_service::JammerService;
use crate::application::traffic_service::TrafficService;

// Estados gestionados por Tauri (`app.manage(...)`).
// Objetivo: evitar que `src-tauri/src/lib.rs` tenga que definir tipos privados para los comandos.

pub struct TrafficState(pub Mutex<TrafficService>);
pub struct JammerState(pub Mutex<JammerService>);

