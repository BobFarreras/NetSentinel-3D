// src-tauri/src/infrastructure/attack_lab/runner.rs
// Descripcion: runner real del Attack Lab. Lanza procesos externos, hace streaming de stdout/stderr, soporta timeout y cancelacion.

use std::sync::Arc;
use std::time::Duration;

use async_trait::async_trait;
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::process::Command;
use tokio::sync::oneshot;

use crate::domain::entities::{AttackLabExitEvent, AttackLabLogEvent, AttackLabRequest};
use crate::domain::ports::{AttackLabEventSinkPort, AttackLabRunnerPort};

pub struct TokioProcessAttackLabRunner;

#[async_trait]
impl AttackLabRunnerPort for TokioProcessAttackLabRunner {
    async fn run(
        &self,
        audit_id: String,
        request: AttackLabRequest,
        mut cancel_rx: oneshot::Receiver<()>,
        sink: Arc<dyn AttackLabEventSinkPort>,
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
                        sink.on_log(AttackLabLogEvent {
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
                        sink.on_log(AttackLabLogEvent {
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

            if let Some(t) = log_task_out {
                let _ = t.await;
            }
            if let Some(t) = log_task_err {
                let _ = t.await;
            }

            Ok::<std::process::ExitStatus, String>(status)
        }
        .await;

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
                sink.on_exit(AttackLabExitEvent {
                    audit_id,
                    success: if finished_by_cancel { false } else { success },
                    exit_code,
                    duration_ms,
                    error,
                });
            }
            Err(err) => {
                sink.on_exit(AttackLabExitEvent {
                    audit_id,
                    success: false,
                    exit_code: None,
                    duration_ms,
                    error: Some(if finished_by_timeout {
                        format!("timeout: {err}")
                    } else {
                        err
                    }),
                });
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::Mutex;

    #[derive(Clone, Default)]
    struct MemorySink {
        logs: Arc<Mutex<Vec<AttackLabLogEvent>>>,
        exits: Arc<Mutex<Vec<AttackLabExitEvent>>>,
    }

    impl AttackLabEventSinkPort for MemorySink {
        fn on_log(&self, evt: AttackLabLogEvent) {
            self.logs.lock().unwrap().push(evt);
        }

        fn on_exit(&self, evt: AttackLabExitEvent) {
            self.exits.lock().unwrap().push(evt);
        }
    }

    #[tokio::test]
    async fn streams_stdout_stderr_and_emits_exit() {
        let sink = Arc::new(MemorySink::default());
        let runner = TokioProcessAttackLabRunner;
        let audit_id = "test_audit_1".to_string();
        let (_cancel_tx, cancel_rx) = oneshot::channel::<()>();

        let request = if cfg!(windows) {
            AttackLabRequest {
                binary_path: "powershell".to_string(),
                args: vec![
                    "-NoProfile".to_string(),
                    "-NonInteractive".to_string(),
                    "-Command".to_string(),
                    "Write-Output 'OUT_LINE_1'; [Console]::Error.WriteLine('ERR_LINE_1'); exit 0"
                        .to_string(),
                ],
                cwd: None,
                timeout_ms: Some(5_000),
                env: vec![],
            }
        } else {
            AttackLabRequest {
                binary_path: "/bin/sh".to_string(),
                args: vec![
                    "-c".to_string(),
                    "echo OUT_LINE_1; echo ERR_LINE_1 1>&2; exit 0".to_string(),
                ],
                cwd: None,
                timeout_ms: Some(5_000),
                env: vec![],
            }
        };

        runner.run(audit_id.clone(), request, cancel_rx, sink.clone()).await;

        let exits = sink.exits.lock().unwrap().clone();
        assert_eq!(exits.len(), 1);
        assert_eq!(exits[0].audit_id, audit_id);
        assert!(exits[0].success);

        let logs = sink.logs.lock().unwrap().clone();
        assert!(logs.iter().any(|l| l.stream == "stdout" && l.line.contains("OUT_LINE_1")));
        assert!(logs.iter().any(|l| l.stream == "stderr" && l.line.contains("ERR_LINE_1")));
    }
}

