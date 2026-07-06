use axum::{Json, extract::{ws::{Message, WebSocket}}};
use tokio::sync::Mutex;
use std::sync::Arc;
use futures::{
    stream::SplitSink
};
use crate::engine::{
    run_code
};

use crate::websocket::{WsMessage, PayloadItem, IS_WAITING_FOR_FILES, ws_request_file, FILES_RECEIVED, FILES_FOR_EXECUTION};

// Request files function


// Find functions for each language
async fn handle_find_imports(code: &str, ext: &str) -> Vec<String> {
    match ext {
        "js" => js_find(code),
        "ts" => ts_find(code),
        "py" => py_find(code),
        _ => vec![],
    }
}

fn js_find(_code: &str) -> Vec<String> {
    // procurar imports...
    vec![]
}

fn ts_find(_code: &str) -> Vec<String> {
    // procurar imports...
    vec![]
}

fn py_find(_code: &str) -> Vec<String> {
    // procurar imports...
    vec![]
}


// Main blunder function
pub async fn handle_blunder(input: &WsMessage, sender_clone: &Arc<Mutex<SplitSink<WebSocket, Message>>>){


    let imports = handle_find_imports(&input.payload[0].code, &input.payload[0].ext).await;

    //NO IMPORTS
    if imports.is_empty() {

        if IS_WAITING_FOR_FILES.load(std::sync::atomic::Ordering::SeqCst) {
            let final_code_ext = handle_files_union().await;
            run_code(
                Json(WsMessage{
                    kind: "execution_request".into(),
                    payload: vec![PayloadItem {
                        code: final_code_ext.code,
                        ext: final_code_ext.ext
                    }]
                }),
                &sender_clone
            ).await;
            IS_WAITING_FOR_FILES.store(false, std::sync::atomic::Ordering::SeqCst);
            return;
        }

        if !IS_WAITING_FOR_FILES.load(std::sync::atomic::Ordering::SeqCst) {
            run_code(
                Json(WsMessage{
                    kind: "execution_request".into(),
                    payload: vec![PayloadItem {
                        code: input.payload[0].code.clone(),
                        ext: input.payload[0].ext.clone()
                    }]
                }),
                &sender_clone
            ).await;
            return;            
        }

        
    }

    //WITH IMPORTS
    for payload_item in &input.payload {
        let mut files_for_execution = FILES_FOR_EXECUTION.lock().await;
        files_for_execution.push(PayloadItem {
            code: payload_item.code.clone(),
            ext: payload_item.ext.clone()
        });
    }

    IS_WAITING_FOR_FILES.store(true, std::sync::atomic::Ordering::SeqCst);
 
    ws_request_file(
        imports,
        sender_clone.clone()
    ).await;

}

pub async fn handle_received_files(sender_clone: &Arc<Mutex<SplitSink<WebSocket, Message>>>) {

    let files: WsMessage = {
        let mut received = FILES_RECEIVED.lock().await;

        match received.take() {
            Some(msg) => msg,
            None => {
                println!("Nenhum arquivo recebido.");
                return;
            }
        }
    };

    println!("Received files...");
    println!("{:?}", files);

    handle_blunder(&files, sender_clone).await;
}

async fn handle_files_union() -> PayloadItem {
    let mut combined_code = String::new();

    for file in FILES_FOR_EXECUTION.lock().await.iter() {
        combined_code.push_str(&file.code);
        combined_code.push('\n');
    }

    let ext = FILES_FOR_EXECUTION.lock().await.iter().next().map(|f| f.ext.clone());

    PayloadItem {
        code: combined_code,
        ext: ext.unwrap_or_else(|| "".into())
    }
}