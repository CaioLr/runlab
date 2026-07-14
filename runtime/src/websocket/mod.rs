use axum::{
    extract::{
        WebSocketUpgrade,
        ws::{Message, WebSocket}
    }, response::IntoResponse
};

use futures::{
    SinkExt, StreamExt, stream::SplitSink
};

use serde::{Deserialize, Serialize};
use tokio::sync::Mutex;
use std::sync::Arc;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{LazyLock};

use crate::engine::{handle_blunder, handle_received_files};

pub static IS_EXECUTING: AtomicBool = AtomicBool::new(false);
pub static IS_WAITING_FOR_FILES: AtomicBool = AtomicBool::new(false);
pub static FILES_RECEIVED: LazyLock<Mutex<Option<WsMessage>>> =
    LazyLock::new(|| Mutex::new(None));
pub static FILES_FOR_EXECUTION: LazyLock<Mutex<Vec<PayloadItem>>> =
    LazyLock::new(|| Mutex::new(Vec::new()));


#[derive(Debug, Serialize, Deserialize)]
pub struct PayloadItem {
    pub code: String,
    pub ext: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct WsMessage {
    pub kind: String,
    pub payload: Vec<PayloadItem>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct WsMessageResponse{
    pub kind: String,
    pub stdout: String,
    pub stderr: String,
    pub path: Vec<String>,
    pub success: bool,
}


pub async fn create_handler(
    ws: WebSocketUpgrade
) -> impl IntoResponse {

    ws.on_upgrade(handle_websocket)

}

async fn handle_websocket(
    ws: WebSocket
){

    let (sender, mut receiver) = ws.split();


    let sender = Arc::new(
        Mutex::new(sender)
    );

    let sender_clone = sender.clone();

    /*
        Receive client message
    */
    while let Some(Ok(Message::Text(text))) =
        receiver.next().await
    {

        let message: WsMessage =
            serde_json::from_str(&text)
            .unwrap();


        if message.kind == "execution_request" {

            if !IS_EXECUTING.load(Ordering::SeqCst) {

                IS_EXECUTING.store(true, Ordering::SeqCst);

                // send to function in blunder to check imports
                handle_blunder(&message, &sender_clone).await;
            }
            
        }

        // This function is to receive messages, that were requestes by the blunder
        if message.kind == "file_response"{
            {
                let mut files = FILES_RECEIVED.lock().await;
                *files = Some(message);
            }
            handle_received_files(&sender_clone).await;
        }

    }
}

pub async fn ws_request_file(
    import_path: Vec<String>,
    sender: Arc<Mutex<SplitSink<WebSocket, Message>>>
) {

    let msg = WsMessageResponse {
        kind: "file_request".into(),
        stdout: "".into(),
        stderr: "".into(),
        path: import_path,
        success: true,
    };

    let msg = Message::Text(
        serde_json::to_string(&msg)
            .unwrap()
            .into(),
    );


    sender
        .lock()
        .await
        .send(msg)
        .await
        .unwrap();

}

pub async fn ws_send_message(
    message: WsMessageResponse,
    sender: Arc<Mutex<SplitSink<WebSocket, Message>>>
) {

    let msg = Message::Text(
        serde_json::to_string(&message)
            .unwrap()
            .into(),
    );

    sender
        .lock()
        .await
        .send(msg)
        .await
        .unwrap();
}