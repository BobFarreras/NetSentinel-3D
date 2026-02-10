// src-tauri/src/application/external_audit/tests.rs

use std::collections::HashMap;
use std::sync::Arc;

use tokio::sync::{oneshot, Mutex};

use super::runner::run_external_tool;
use super::sink::MemoryExternalAuditSink;
use super::types::ExternalAuditRequest;

#[tokio::test]
async fn external_audit_streams_stdout_stderr_and_emits_exit() {
    let sink = MemoryExternalAuditSink::default();
    let sink_arc = Arc::new(sink.clone());

    let audit_id = "test_audit_1".to_string();

    let (_cancel_tx, cancel_rx) = oneshot::channel::<()>();

    let running_map: Arc<Mutex<HashMap<String, super::service::RunningAudit>>> =
        Arc::new(Mutex::new(HashMap::new()));

    let request = if cfg!(windows) {
        ExternalAuditRequest {
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
        ExternalAuditRequest {
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

    run_external_tool(audit_id.clone(), request, cancel_rx, running_map, sink_arc).await;

    let logs = sink.take_logs();
    let exits = sink.take_exits();

    assert_eq!(exits.len(), 1, "debe emitir un evento de salida: exits={exits:?}");
    if !exits[0].success {
        panic!("el proceso no termino con exito: {:?}", exits[0]);
    }

    assert!(
        logs.iter().any(|l| l.stream == "stdout" && l.line.contains("OUT_LINE_1")),
        "debe capturar stdout en tiempo real: logs={logs:?}"
    );
    assert!(
        logs.iter().any(|l| l.stream == "stderr" && l.line.contains("ERR_LINE_1")),
        "debe capturar stderr en tiempo real: logs={logs:?}"
    );
    assert_eq!(exits[0].audit_id, audit_id);
}
