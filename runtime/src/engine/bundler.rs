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

// Find functions for each language
use crate::engine::dep_resolver::{
    js_ts_resolver::{js_find, ts_find},
    py_resolver::py_find
};


async fn handle_find_imports(payload: &Vec<PayloadItem>) -> Vec<String> {

    let mut all_imports = Vec::new();

    for file in payload {
        let ext = &file.ext;

        let imports = match ext.as_str() {
            "js" => js_find(&file.code.as_str()).await,
            "ts" => ts_find(&file.code.as_str()).await,
            "py" => py_find(&file.code.as_str()).await,
            _ => vec![],
        };

        all_imports.extend(imports);
        
    };

    return all_imports;

}



// ============================== FUNCTIONS ==============================
// Main blunder function
pub async fn handle_blunder(input: &WsMessage, sender_clone: &Arc<Mutex<SplitSink<WebSocket, Message>>>){


    let imports = handle_find_imports(&input.payload).await;

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
            FILES_FOR_EXECUTION.lock().await.clear();
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
                return;
            }
        }
    };

    handle_blunder(&files, sender_clone).await;
}

async fn handle_files_union() -> PayloadItem {
    let mut combined_code = String::new();

    let ext = FILES_FOR_EXECUTION.lock().await.iter().next().map(|f| f.ext.clone());

    for file in FILES_FOR_EXECUTION.lock().await.iter().rev() {
        combined_code.push_str(&file.code);
        combined_code.push('\n');
    }

    PayloadItem {
        code: combined_code,
        ext: ext.unwrap_or_else(|| "".into())
    }
}