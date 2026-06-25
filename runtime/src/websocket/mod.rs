use axum::{extract::{WebSocketUpgrade, ws::{Message, WebSocket}}, response::IntoResponse, Json};
use futures_util::{SinkExt, StreamExt};

use crate::runnitor::{
    run_code,
    RunRequest
};


pub async fn create_handler( ws: WebSocketUpgrade) -> impl IntoResponse {
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