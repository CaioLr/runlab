use axum::{Router, extract::{WebSocketUpgrade, ws::{Message, WebSocket}}, response::IntoResponse, routing::{get}, Json};
use futures_util::{SinkExt, StreamExt};
use serde::{Deserialize, Serialize};
use std::fs;
use tokio::process::Command;
use tokio::time::{timeout, Duration};
use uuid::Uuid;

#[derive(Deserialize)]
struct RunRequest {
    code: String,
    ext: String,
}

#[derive(Serialize)]
struct RunResponse {
    stdout: String,
    stderr: String,
    success: bool,
}

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

async fn run_code(Json(payload): Json<RunRequest>) -> Json<RunResponse> {
    let id = Uuid::new_v4();

    let temp_dir = std::env::temp_dir();
    let filename = temp_dir.join(format!("{}.{}", id, &payload.ext));

    if let Err(e) = fs::write(&filename, payload.code) {
        return Json(RunResponse {
            stdout: "".into(),
            stderr: e.to_string(),
            success: false,
        });
    }

    let mut cmd = match payload.ext.as_str() {
        "js" => Command::new("node"),
        "ts" => Command::new("ts-node"),
        "py" => {
            let python_cmd = detect_python().await;

            if let Some(py) = python_cmd {
                Command::new(py)
            } else {
                return Json(RunResponse {
                    stdout: "".into(),
                    stderr: "Python not found on system".into(),
                    success: false,
                });
            }
        }
        _ => {
            return Json(RunResponse {
                stdout: "".into(),
                stderr: format!("Unsupported extension: {}", payload.ext),
                success: false,
            });
        }
    };

    cmd.arg(&filename);

    let timed = timeout(Duration::from_secs(5), cmd.output()).await;

    let output = match timed {
        Ok(res) => res,
        Err(_) => {
            return Json(RunResponse {
                stdout: "".into(),
                stderr: "Execution timed out".into(),
                success: false,
            })
        }
    };

    match output {
        Ok(out) => Json(RunResponse {
            stdout: String::from_utf8_lossy(&out.stdout).to_string(),
            stderr: String::from_utf8_lossy(&out.stderr).to_string(),
            success: out.status.success(),
        }),
        Err(e) => Json(RunResponse {
            stdout: "".into(),
            stderr: e.to_string(),
            success: false,
        }),
    }
}


#[tokio::main]
async fn main() {
    let app = app();

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();

    axum::serve(listener, app).await.unwrap();
}


fn app() -> Router {
   
    Router::new()
        .route("/create", get(create_handler))
        
}

async fn create_handler( ws: WebSocketUpgrade) -> impl IntoResponse {
    ws.on_upgrade(|websocket| handle_websocket(websocket))
}

async fn handle_websocket(websocket: WebSocket) {
    let (mut sender, mut receiver) = websocket.split();

    while let Some(msg) = receiver.next().await {
        if let Ok(Message::Text(text)) = msg {

            let request: RunRequest = serde_json::from_str(&text)
                .unwrap();

            let response = run_code(Json(request)).await;

            let json_response = serde_json::to_string(&response.0)
                .unwrap();

            sender
                .send(Message::Text(json_response.into()))
                .await
                .unwrap();
        }
    }
}