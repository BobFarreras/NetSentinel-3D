// src-tauri/src/application/external_audit/runner.rs

use std::collections::HashMap;
use std::sync::Arc;
use std::time::Duration;

use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::process::Command;
use tokio::sync::{oneshot, Mutex};

use super::sink::ExternalAuditEventSink;
use super::types::{ExternalAuditExitEvent, ExternalAuditLogEvent, ExternalAuditRequest};

pub async fn run_external_tool(
    audit_id: String,
    request: ExternalAuditRequest,
    mut cancel_rx: oneshot::Receiver<()>,
    running_map: Arc<Mutex<HashMap<String, super::service::RunningAudit>>>,
    sink: Arc<dyn ExternalAuditEventSink>,
) {
    let started = std::time::Instant::now();
    let mut finished_by_cancel = false;
    let mut finished_by_timeout = false;

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
            let audit_id = audit_id.clone();
            let sink = Arc::clone(&sink);
            tokio::spawn(async move {
                let mut lines = BufReader::new(out).lines();
                while let Ok(Some(line)) = lines.next_line().await {
                    sink.on_log(ExternalAuditLogEvent {
                        audit_id: audit_id.clone(),
                        stream: "stdout".to_string(),
                        line,
                    });
                }
            })
        });

        let log_task_err = stderr.map(|err| {
            let audit_id = audit_id.clone();
            let sink = Arc::clone(&sink);
            tokio::spawn(async move {
                let mut lines = BufReader::new(err).lines();
                while let Ok(Some(line)) = lines.next_line().await {
                    sink.on_log(ExternalAuditLogEvent {
                        audit_id: audit_id.clone(),
                        stream: "stderr".to_string(),
                        line,
                    });
                }
            })
        });

        let status = if let Some(ms) = request.timeout_ms {
            let dur = Duration::from_millis(ms);
            tokio::select! {
                _ = &mut cancel_rx => {
                    finished_by_cancel = true;
                    let _ = child.kill().await;
                    child.wait().await.map_err(|e| e.to_string())?
                }
                s = tokio::time::timeout(dur, child.wait()) => {
                    match s {
                        Ok(r) => r.map_err(|e| e.to_string())?,
                        Err(_) => {
                            finished_by_timeout = true;
                            let _ = child.kill().await;
                            // Best-effort: esperamos un poco a que el proceso termine tras kill.
                            let _ = tokio::time::timeout(Duration::from_millis(700), child.wait()).await;
                            return Err(format!("timeout tras {ms}ms"));
                        }
                    }
                }
            }
        } else {
            tokio::select! {
                _ = &mut cancel_rx => {
                    finished_by_cancel = true;
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
            let error = if finished_by_cancel {
                Some("cancelado por el usuario".to_string())
            } else {
                None
            };
            sink.on_exit(ExternalAuditExitEvent {
                audit_id,
                // Cancelado: el exit code puede ser 1/137/etc dependiendo de la plataforma. Lo tratamos como fallo.
                success: if finished_by_cancel { false } else { success },
                exit_code,
                duration_ms,
                error,
            });
        }
        Err(err) => {
            sink.on_exit(ExternalAuditExitEvent {
                audit_id,
                success: false,
                exit_code: None,
                duration_ms,
                error: Some(if finished_by_timeout {
                    // Mensaje estable para UI + logs.
                    format!("timeout: {err}")
                } else {
                    err
                }),
            });
        }
    }
}
