// src-tauri/src/application/external_audit/sink.rs

use super::types::{ExternalAuditExitEvent, ExternalAuditLogEvent};

pub trait ExternalAuditEventSink: Send + Sync + 'static {
    fn on_log(&self, evt: ExternalAuditLogEvent);
    fn on_exit(&self, evt: ExternalAuditExitEvent);
}

pub struct TauriExternalAuditSink {
    app: tauri::AppHandle,
}

impl TauriExternalAuditSink {
    pub fn new(app: tauri::AppHandle) -> Self {
        Self { app }
    }
}

impl ExternalAuditEventSink for TauriExternalAuditSink {
    fn on_log(&self, evt: ExternalAuditLogEvent) {
        use tauri::Emitter;

        // Best-effort: el UI puede estar cerrado o no escuchar eventos aun.
        let _ = self.app.emit("external-audit-log", evt);
    }

    fn on_exit(&self, evt: ExternalAuditExitEvent) {
        use tauri::Emitter;

        let _ = self.app.emit("external-audit-exit", evt);
    }
}

#[cfg(test)]
#[derive(Clone, Default)]
pub struct MemoryExternalAuditSink {
    // Arc+Mutex: util de tests para inspeccionar eventos sin Tauri.
    logs: std::sync::Arc<std::sync::Mutex<Vec<ExternalAuditLogEvent>>>,
    exits: std::sync::Arc<std::sync::Mutex<Vec<ExternalAuditExitEvent>>>,
}

#[cfg(test)]
impl MemoryExternalAuditSink {
    pub fn take_logs(&self) -> Vec<ExternalAuditLogEvent> {
        std::mem::take(&mut self.logs.lock().unwrap())
    }

    pub fn take_exits(&self) -> Vec<ExternalAuditExitEvent> {
        std::mem::take(&mut self.exits.lock().unwrap())
    }
}

#[cfg(test)]
impl ExternalAuditEventSink for MemoryExternalAuditSink {
    fn on_log(&self, evt: ExternalAuditLogEvent) {
        self.logs.lock().unwrap().push(evt);
    }

    fn on_exit(&self, evt: ExternalAuditExitEvent) {
        self.exits.lock().unwrap().push(evt);
    }
}
