use axum::{Router, routing::{get}};
mod websocket;
mod engine;
use websocket::create_handler;

#[tokio::main]
async fn main() {

    println!("Server starting...");
    let app = app();

    println!("Creating listener...");
    let listener = tokio::net::TcpListener::bind("0.0.0.0:8080").await.unwrap();

    axum::serve(listener, app).await.unwrap();
    println!("Server finished!");
}


fn app() -> Router {
   
    Router::new()
        .route("/create", get(create_handler))
}
