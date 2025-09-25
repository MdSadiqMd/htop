use axum::{Router, extract::State, routing::get};
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

async fn sys_info(State(state): State<AppState>) -> String {
    use ::std::fmt::Write;

    let mut s = String::new();
    let mut sys = state.sys.lock().unwrap();
    sys.refresh_cpu_all();

    for (i, cpus) in sys.cpus().iter().enumerate() {
        let i = i + 1;
        let usage = cpus.cpu_usage();
        writeln!(&mut s, "CPU {i} {usage}%").unwrap();
    }

    s
}
