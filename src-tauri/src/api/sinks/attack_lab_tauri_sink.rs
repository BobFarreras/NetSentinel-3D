// src-tauri/src/api/sinks/attack_lab_tauri_sink.rs
// Descripcion: sink de Attack Lab que emite eventos Tauri hacia la UI.

use crate::domain::entities::{AttackLabExitEvent, AttackLabLogEvent};
use crate::domain::ports::AttackLabEventSinkPort;

pub struct TauriAttackLabSink {
    app: tauri::AppHandle,
}

impl TauriAttackLabSink {
    pub fn new(app: tauri::AppHandle) -> Self {
        Self { app }
    }
}

impl AttackLabEventSinkPort for TauriAttackLabSink {
    fn on_log(&self, evt: AttackLabLogEvent) {
        use tauri::Emitter;

        let _ = self.app.emit("attack-lab-log", evt);
    }

    fn on_exit(&self, evt: AttackLabExitEvent) {
        use tauri::Emitter;

        let _ = self.app.emit("attack-lab-exit", evt);
    }
}
