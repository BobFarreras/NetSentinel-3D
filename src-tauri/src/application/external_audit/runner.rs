// src-tauri/src/application/external_audit/runner.rs

use std::collections::HashMap;
use std::sync::Arc;
use std::time::Duration;

use tauri::{AppHandle, Emitter};
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::process::Command;
use tokio::sync::{oneshot, Mutex};

use super::types::{ExternalAuditExitEvent, ExternalAuditLogEvent, ExternalAuditRequest};

pub async fn run_external_tool(
    app: AppHandle,
    audit_id: String,
    request: ExternalAuditRequest,
    mut cancel_rx: oneshot::Receiver<()>,
    running_map: Arc<Mutex<HashMap<String, super::service::RunningAudit>>>,
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

        let mut child = cmd
            .spawn()
            .map_err(|e| format!("No se pudo ejecutar el binario: {e}"))?;

        let stdout = child.stdout.take();
        let stderr = child.stderr.take();

        let log_task_out = stdout.map(|out| {
            let app = app.clone();
            let audit_id = audit_id.clone();
            tokio::spawn(async move {
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
            })
        });

        let log_task_err = stderr.map(|err| {
            let app = app.clone();
            let audit_id = audit_id.clone();
            tokio::spawn(async move {
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
            })
        });

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

