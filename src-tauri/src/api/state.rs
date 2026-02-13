// src-tauri/src/api/state.rs

use std::sync::{Arc, Mutex};

use crate::application::jammer::JammerService;
use crate::application::traffic::TrafficService;

// Estados gestionados por Tauri (`app.manage(...)`).
// Objetivo: evitar que `src-tauri/src/lib.rs` tenga que definir tipos privados para los comandos.

pub struct TrafficState(pub Mutex<TrafficService>);
pub struct JammerState(pub Arc<JammerService>);
