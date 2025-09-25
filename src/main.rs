use axum::{Json, Router, extract::State, response::IntoResponse, routing::get};
use std::sync::{Arc, Mutex};
use sysinfo::System;
use tokio::net::TcpListener;

#[derive(Clone)]
struct AppState {
    sys: Arc<Mutex<System>>,
}

#[tokio::main]
async fn main() {
    let app = Router::new()
        .route("/healthz", get(|| async { "up" }))
        .route("/", get(sys_info))
        .with_state(AppState {
            sys: Arc::new(Mutex::new(System::new())),
        });
    let listener = TcpListener::bind("0.0.0.0:3000").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

async fn sys_info(State(state): State<AppState>) -> impl IntoResponse {
    let mut sys = state.sys.lock().unwrap();
    sys.refresh_cpu_all();

    let v: Vec<_> = sys.cpus().iter().map(|cpu| cpu.cpu_usage()).collect();
    Json(v)
}
