use std::collections::HashMap;
use std::sync::{
    atomic::{AtomicU64, Ordering},
    Arc,
};
use std::time::{Duration, SystemTime, UNIX_EPOCH};

use tauri::{AppHandle, Emitter};
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::process::Command;
use tokio::sync::{oneshot, Mutex};

// Nota de DevSecOps:
// - No usamos shell (Command::new + args) para evitar injection.
// - El frontend envia ruta + args ya tokenizados (sin concatenar strings).
// - Aunque el usuario sea admin, validamos limites basicos para evitar cuelgues (args enormes, null bytes, etc.).

#[derive(Clone, Debug)]
pub struct ExternalAuditRequest {
    pub binary_path: String,
    pub args: Vec<String>,
    pub cwd: Option<String>,
    pub timeout_ms: Option<u64>,
    pub env: Vec<(String, String)>,
}

#[derive(Clone, Debug, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ExternalAuditLogEvent {
    pub audit_id: String,
    pub stream: String, // "stdout" | "stderr"
    pub line: String,
}

#[derive(Clone, Debug, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ExternalAuditExitEvent {
    pub audit_id: String,
    pub success: bool,
    pub exit_code: Option<i32>,
    pub duration_ms: u128,
    pub error: Option<String>,
}

struct RunningAudit {
    cancel: oneshot::Sender<()>,
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
        tokio::spawn(async move {
            run_external_tool(app, audit_id_for_task, request, cancel_rx, running_map).await;
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

fn validate_request(req: &ExternalAuditRequest) -> Result<(), String> {
    let bin = req.binary_path.trim();
    if bin.is_empty() {
        return Err("binary_path no puede estar vacio".to_string());
    }
    if bin.contains('\0') {
        return Err("binary_path contiene un byte nulo".to_string());
    }

    // CWD si existe debe ser ruta valida (no imponemos absoluta para permitir AppData, etc.)
    if let Some(cwd) = &req.cwd {
        if cwd.contains('\0') {
            return Err("cwd contiene un byte nulo".to_string());
        }
    }

    if req.args.len() > 128 {
        return Err("demasiados argumentos (max 128)".to_string());
    }
    for (i, a) in req.args.iter().enumerate() {
        if a.contains('\0') {
            return Err(format!("argumento #{i} contiene un byte nulo"));
        }
        if a.len() > 4096 {
            return Err(format!("argumento #{i} demasiado largo (max 4096)"));
        }
    }

    if req.env.len() > 64 {
        return Err("demasiadas variables de entorno (max 64)".to_string());
    }
    for (k, v) in req.env.iter() {
        if k.is_empty() {
            return Err("env key vacia".to_string());
        }
        if k.contains('\0') || v.contains('\0') {
            return Err("env contiene byte nulo".to_string());
        }
        if k.len() > 128 || v.len() > 4096 {
            return Err("env demasiado largo".to_string());
        }
    }

    if let Some(ms) = req.timeout_ms {
        if ms < 100 {
            return Err("timeout_ms demasiado bajo (min 100ms)".to_string());
        }
        if ms > 60 * 60 * 1000 {
            return Err("timeout_ms demasiado alto (max 1h)".to_string());
        }
    }

    Ok(())
}

async fn run_external_tool(
    app: AppHandle,
    audit_id: String,
    request: ExternalAuditRequest,
    mut cancel_rx: oneshot::Receiver<()>,
    running_map: Arc<Mutex<HashMap<String, RunningAudit>>>,
) {
    let started = std::time::Instant::now();

    let result = async {
        let mut cmd = Command::new(&request.binary_path);
        cmd.args(&request.args);

        if let Some(cwd) = &request.cwd {
            cmd.current_dir(cwd);
        }

        for (k, v) in request.env.iter() {
            cmd.env(k, v);
        }

        cmd.stdout(std::process::Stdio::piped());
        cmd.stderr(std::process::Stdio::piped());

        let mut child = cmd.spawn().map_err(|e| format!("No se pudo ejecutar el binario: {e}"))?;

        let stdout = child.stdout.take();
        let stderr = child.stderr.take();

        let log_task_out = if let Some(out) = stdout {
            let app = app.clone();
            let audit_id = audit_id.clone();
            Some(tokio::spawn(async move {
                let mut lines = BufReader::new(out).lines();
                while let Ok(Some(line)) = lines.next_line().await {
                    let _ = app.emit(
                        "external-audit-log",
                        ExternalAuditLogEvent {
                            audit_id: audit_id.clone(),
                            stream: "stdout".to_string(),
                            line,
                        },
                    );
                }
            }))
        } else {
            None
        };

        let log_task_err = if let Some(err) = stderr {
            let app = app.clone();
            let audit_id = audit_id.clone();
            Some(tokio::spawn(async move {
                let mut lines = BufReader::new(err).lines();
                while let Ok(Some(line)) = lines.next_line().await {
                    let _ = app.emit(
                        "external-audit-log",
                        ExternalAuditLogEvent {
                            audit_id: audit_id.clone(),
                            stream: "stderr".to_string(),
                            line,
                        },
                    );
                }
            }))
        } else {
            None
        };

        let status = if let Some(ms) = request.timeout_ms {
            let dur = Duration::from_millis(ms);
            tokio::select! {
                _ = &mut cancel_rx => {
                    let _ = child.kill().await;
                    child.wait().await.map_err(|e| e.to_string())?
                }
                s = tokio::time::timeout(dur, child.wait()) => {
                    match s {
                        Ok(r) => r.map_err(|e| e.to_string())?,
                        Err(_) => {
                            let _ = child.kill().await;
                            return Err(format!("timeout tras {ms}ms"));
                        }
                    }
                }
            }
        } else {
            tokio::select! {
                _ = &mut cancel_rx => {
                    let _ = child.kill().await;
                    child.wait().await.map_err(|e| e.to_string())?
                }
                s = child.wait() => {
                    s.map_err(|e| e.to_string())?
                }
            }
        };

        // Esperamos a que las tareas de lectura terminen (pipes cerrados).
        if let Some(t) = log_task_out {
            let _ = t.await;
        }
        if let Some(t) = log_task_err {
            let _ = t.await;
        }

        Ok::<std::process::ExitStatus, String>(status)
    }
    .await;

    // Limpieza del registro de "running".
    {
        let mut guard = running_map.lock().await;
        guard.remove(&audit_id);
    }

    let duration_ms = started.elapsed().as_millis();
    match result {
        Ok(status) => {
            let success = status.success();
            let exit_code = status.code();
            let _ = app.emit(
                "external-audit-exit",
                ExternalAuditExitEvent {
                    audit_id,
                    success,
                    exit_code,
                    duration_ms,
                    error: None,
                },
            );
        }
        Err(err) => {
            let _ = app.emit(
                "external-audit-exit",
                ExternalAuditExitEvent {
                    audit_id,
                    success: false,
                    exit_code: None,
                    duration_ms,
                    error: Some(err),
                },
            );
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn validate_request_rejects_empty_binary() {
        let r = ExternalAuditRequest {
            binary_path: "   ".to_string(),
            args: vec![],
            cwd: None,
            timeout_ms: None,
            env: vec![],
        };
        assert!(validate_request(&r).is_err());
    }

    #[test]
    fn validate_request_rejects_too_many_args() {
        let r = ExternalAuditRequest {
            binary_path: "tool".to_string(),
            args: (0..129).map(|_| "x".to_string()).collect(),
            cwd: None,
            timeout_ms: None,
            env: vec![],
        };
        assert!(validate_request(&r).is_err());
    }
}
