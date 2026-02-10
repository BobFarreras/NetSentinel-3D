// src-tauri/src/application/external_audit/service.rs

use std::collections::HashMap;
use std::sync::{
    atomic::{AtomicU64, Ordering},
    Arc,
};
use std::time::{Duration, SystemTime, UNIX_EPOCH};

use tauri::AppHandle;
use tokio::sync::{oneshot, Mutex};

use super::runner::run_external_tool;
use super::sink::{ExternalAuditEventSink, TauriExternalAuditSink};
use super::types::ExternalAuditRequest;
use super::validation::validate_request;

pub struct RunningAudit {
    pub cancel: oneshot::Sender<()>,
}

pub struct ExternalAuditService {
    running: Arc<Mutex<HashMap<String, RunningAudit>>>,
}

impl ExternalAuditService {
    pub fn new() -> Self {
        Self {
            running: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    pub async fn start_audit(&self, app: AppHandle, request: ExternalAuditRequest) -> Result<String, String> {
        validate_request(&request)?;

        let audit_id = new_audit_id();
        let (cancel_tx, cancel_rx) = oneshot::channel::<()>();

        {
            let mut guard = self.running.lock().await;
            guard.insert(audit_id.clone(), RunningAudit { cancel: cancel_tx });
        }

        let running_map = Arc::clone(&self.running);
        let audit_id_for_task = audit_id.clone();
        let sink: Arc<dyn ExternalAuditEventSink> = Arc::new(TauriExternalAuditSink::new(app.clone()));
        tokio::spawn(async move {
            run_external_tool(audit_id_for_task, request, cancel_rx, running_map, sink).await;
        });

        Ok(audit_id)
    }

    pub async fn cancel_audit(&self, audit_id: &str) -> Result<(), String> {
        let cancel = {
            let mut guard = self.running.lock().await;
            guard.remove(audit_id).map(|r| r.cancel)
        };

        let Some(tx) = cancel else {
            return Err("audit_id no encontrado o ya finalizado".to_string());
        };

        // Si el runner ya termino, enviar puede fallar. Lo tratamos como cancelado igualmente.
        let _ = tx.send(());
        Ok(())
    }
}

static AUDIT_COUNTER: AtomicU64 = AtomicU64::new(0);

fn new_audit_id() -> String {
    let ts = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or(Duration::from_secs(0))
        .as_millis();
    let n = AUDIT_COUNTER.fetch_add(1, Ordering::Relaxed);
    format!("audit_{ts}_{n}")
}
