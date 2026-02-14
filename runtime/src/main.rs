use axum::http::Method;
use axum::{Json, Router, routing::post};
use serde::{Deserialize, Serialize};
use std::fs;
use std::io::Write;
use tokio::process::Command;
use tokio::time::{timeout, Duration};
use tower_http::cors::{Any, CorsLayer};
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

    if Command::new("python3")
        .arg("--version")
        .output()
        .await
        .is_ok()
    {
        return Some("python3".to_string());
    }

    if Command::new("python")
        .arg("--version")
        .output()
        .await
        .is_ok()
    {
        return Some("python".to_string());
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

    let python_cmd = detect_python().await;

    let mut cmd = match payload.ext.as_str() {
        "js" => Command::new("node"),
        "ts" => Command::new("ts-node"),
        "py" => {
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
    eprintln!("[STARTUP] Starting runtime server...");
    
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods([Method::POST, Method::OPTIONS])
        .allow_headers(Any);
    let app = Router::new().route("/", post(run_code)).layer(cors);
    
    let addr = "0.0.0.0:8080";
    eprintln!("[STARTUP] Binding to {}", addr);
    let listener = match tokio::net::TcpListener::bind(addr).await {
        Ok(l) => {
            eprintln!("[STARTUP] Successfully bound to {}", addr);
            l
        }
        Err(e) => {
            eprintln!("[ERROR] Failed to bind to {}: {}", addr, e);
            std::process::exit(1);
        }
    };
    
    eprintln!("[STARTUP] 🚀 Server running on http://0.0.0.0:8080");
    let _ = std::io::stderr().flush();
    
    match axum::serve(listener, app).await {
        Ok(_) => {
            eprintln!("[ERROR] Server exited normally (this should not happen)");
            std::process::exit(1);
        }
        Err(e) => {
            eprintln!("[ERROR] Server error: {}", e);
            std::process::exit(1);
        }
    }
}
