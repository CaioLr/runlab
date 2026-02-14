use axum::http::Method;
use axum::{Json, Router, routing::post};
use serde::{Deserialize, Serialize};
use std::{fs, process::Command};
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

fn detect_python() -> Option<String> {

    if Command::new("python")
        .arg("--version")
        .output()
        .is_ok()
    {
        return Some("python".to_string());
    }

    if Command::new("python3")
        .arg("--version")
        .output()
        .is_ok()
    {
        return Some("python3".to_string());
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

    let python_cmd = detect_python();   

    let output = match payload.ext.as_str() {
        "js" => Command::new("node").arg(&filename).output(),
        "ts" => Command::new("ts-node").arg(&filename).output(),
        "py" => {
            if let Some(py) = python_cmd {
                Command::new(py).arg(&filename).output()
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
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods([Method::POST, Method::OPTIONS])
        .allow_headers(Any);
    let app = Router::new().route("/", post(run_code)).layer(cors);
    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    println!("🚀 Server running at http://localhost:3000");
    axum::serve(listener, app).await.unwrap();
}
