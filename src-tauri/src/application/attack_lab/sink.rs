// src-tauri/src/application/attack_lab/sink.rs
// Sinks de eventos del Attack Lab: emision via Tauri y sink en memoria para tests.

use super::types::{AttackLabExitEvent, AttackLabLogEvent};

pub trait AttackLabEventSink: Send + Sync + 'static {
    fn on_log(&self, evt: AttackLabLogEvent);
    fn on_exit(&self, evt: AttackLabExitEvent);
}

pub struct TauriAttackLabSink {
    app: tauri::AppHandle,
}

impl TauriAttackLabSink {
    pub fn new(app: tauri::AppHandle) -> Self {
        Self { app }
    }
}

impl AttackLabEventSink for TauriAttackLabSink {
    fn on_log(&self, evt: AttackLabLogEvent) {
        use tauri::Emitter;

        // Best-effort: el UI puede estar cerrado o no escuchar eventos aun.
        let _ = self.app.emit("attack-lab-log", evt.clone());
        let _ = self.app.emit("external-audit-log", evt); // legacy
    }

    fn on_exit(&self, evt: AttackLabExitEvent) {
        use tauri::Emitter;

        let _ = self.app.emit("attack-lab-exit", evt.clone());
        let _ = self.app.emit("external-audit-exit", evt); // legacy
    }
}

#[cfg(test)]
#[derive(Clone, Default)]
pub struct MemoryAttackLabSink {
    // Arc+Mutex: util de tests para inspeccionar eventos sin Tauri.
    logs: std::sync::Arc<std::sync::Mutex<Vec<AttackLabLogEvent>>>,
    exits: std::sync::Arc<std::sync::Mutex<Vec<AttackLabExitEvent>>>,
}

#[cfg(test)]
impl MemoryAttackLabSink {
    pub fn take_logs(&self) -> Vec<AttackLabLogEvent> {
        std::mem::take(&mut self.logs.lock().unwrap())
    }

    pub fn take_exits(&self) -> Vec<AttackLabExitEvent> {
        std::mem::take(&mut self.exits.lock().unwrap())
    }
}

#[cfg(test)]
impl AttackLabEventSink for MemoryAttackLabSink {
    fn on_log(&self, evt: AttackLabLogEvent) {
        self.logs.lock().unwrap().push(evt);
    }

    fn on_exit(&self, evt: AttackLabExitEvent) {
        self.exits.lock().unwrap().push(evt);
    }
}

// Alias legacy (compat) para tests antiguos.
#[cfg(test)]
pub type MemoryExternalAuditSink = MemoryAttackLabSink;
