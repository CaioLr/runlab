use axum::{Router, routing::{get}};
mod runnitor;
mod websocket;
use websocket::create_handler;

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
