
use axum::{Json, extract::{ws::{Message, WebSocket}}};
use tokio::sync::Mutex;use std::sync::Arc;
use futures::{
    stream::SplitSink
};
use std::fs;
use tokio::process::Command;
use tokio::time::{timeout, Duration};
use uuid::Uuid;

use crate::websocket::{IS_EXECUTING, WsMessage, WsMessageResponse, ws_send_message};

async fn detect_python() -> Option<String> {
    for cmd in ["python3", "python", "py"] {
        match Command::new(cmd)
            .arg("--version")
            .output()
            .await
        {
            Ok(output) if output.status.success() => {
                return Some(cmd.to_string());
            }
            _ => {}
        }
    }

    None
}

pub async fn run_code(
    Json(payload): Json<WsMessage>,
    sender_clone: &Arc<Mutex<SplitSink<WebSocket, Message>>>
) {

    let id = Uuid::new_v4();

    let temp_dir = std::env::temp_dir();
    let filename = temp_dir.join(format!("{}.{}", id, &payload.payload[0].ext));

    if let Err(e) = fs::write(&filename, payload.payload[0].code.clone()) {
        ws_send_message(WsMessageResponse {
            kind: payload.kind.clone(),
            stdout: "".into(),
            stderr: e.to_string(),
            path: Vec::new(),
            success: false,
        }, sender_clone.clone()).await;
        return;
    }

    let mut cmd = match payload.payload[0].ext.as_str() {
        "js" => Command::new("node"),
        "ts" => Command::new("ts-node"),
        "py" => {
            let python_cmd = detect_python().await;

            if let Some(py) = python_cmd {
                Command::new(py)
            } else {
                ws_send_message(WsMessageResponse {
                    kind: "execution_response".into(),
                    stdout: "".into(),
                    stderr: "Python not found on system".into(),
                    path: Vec::new(),
                    success: false,
                }, sender_clone.clone()).await;
                return;
            }
        }
        _ => {
            ws_send_message(WsMessageResponse {
                kind: "execution_response".into(),
                stdout: "".into(),
                stderr: format!("Unsupported extension: {}", payload.payload[0].ext),
                path: Vec::new(),
                success: false,
            }, sender_clone.clone()).await;
            return;
        }
    };

    cmd.arg(&filename);

    let timed = timeout(Duration::from_secs(5), cmd.output()).await;

    let output = match timed {
        Ok(res) => res,
        Err(_) => {
            ws_send_message(WsMessageResponse {
                kind: "execution_response".into(),
                stdout: "".into(),
                stderr: "Execution timed out".into(),
                path: Vec::new(),
                success: false,
            }, sender_clone.clone()).await;
            return;
        }
    };

    IS_EXECUTING.store(false, std::sync::atomic::Ordering::SeqCst);

    match output {
        Ok(out) => {
            ws_send_message(
                WsMessageResponse {
                    kind: "execution_response".into(),
                    stdout: String::from_utf8_lossy(&out.stdout).to_string(),
                    stderr: String::from_utf8_lossy(&out.stderr).to_string(),
                    path: Vec::new(),
                    success: out.status.success(),
                },
                sender_clone.clone()
            ).await;
        }
        Err(e) => {
            ws_send_message(
                WsMessageResponse {
                    kind: "execution_response".into(),
                    stdout: "".into(),
                    stderr: e.to_string(),
                    path: Vec::new(),
                    success: false,
                },
                sender_clone.clone()
            ).await;
        }
    }

}