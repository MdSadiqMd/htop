use axum::{
    Router,
    extract::{
        State, WebSocketUpgrade,
        ws::{Message, WebSocket},
    },
    http::Response,
    response::{Html, IntoResponse},
    routing::get,
};
use sysinfo::System;
use tokio::net::TcpListener;
use tokio::sync::broadcast;

type Snapshot = Vec<f32>;

#[derive(Clone)]
struct AppState {
    tx: broadcast::Sender<Snapshot>,
}

#[tokio::main]
async fn main() {
    let (tx, _) = broadcast::channel::<Snapshot>(16);
    tracing_subscriber::fmt::init();

    let app_state = AppState { tx: tx.clone() };
    let app = Router::new()
        .route("/healthz", get(|| async { "up" }))
        .route("/", get(root_get))
        .route("/index.mjs", get(indexmjs_get))
        .route("/index.css", get(indexcss_get))
        .route("/realtime/cpus", get(realtime_cpus_get))
        .with_state(app_state.clone());

    tokio::task::spawn_blocking(move || {
        let mut sys = System::new();
        loop {
            sys.refresh_cpu_usage();
            let v: Vec<_> = sys.cpus().iter().map(|cpu| cpu.cpu_usage()).collect();
            let _ = tx.send(v);
            std::thread::sleep(std::time::Duration::from_millis(250));
        }
    });

    let listener = TcpListener::bind("0.0.0.0:3000").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

#[axum::debug_handler]
async fn root_get() -> impl IntoResponse {
    let markup = tokio::fs::read_to_string("src/index.html").await.unwrap();
    Html(markup)
}

#[axum::debug_handler]
async fn indexmjs_get() -> impl IntoResponse {
    let markup = tokio::fs::read_to_string("src/index.mjs").await.unwrap();
    Response::builder()
        .header("content-type", "application/javascript;charset=utf-8")
        .body(markup)
        .unwrap()
}

#[axum::debug_handler]
async fn indexcss_get() -> impl IntoResponse {
    let markup = tokio::fs::read_to_string("src/index.css").await.unwrap();
    Response::builder()
        .header("content-type", "text/css;charset=utf-8")
        .body(markup)
        .unwrap()
}

#[axum::debug_handler]
async fn realtime_cpus_get(
    ws: WebSocketUpgrade,
    State(state): State<AppState>,
) -> impl IntoResponse {
    ws.on_upgrade(|ws: WebSocket| async { realtime_cpus_stream(state, ws).await })
}

async fn realtime_cpus_stream(app_state: AppState, mut ws: WebSocket) {
    let mut rx = app_state.tx.subscribe();
    while let Ok(msg) = rx.recv().await {
        ws.send(Message::Text(serde_json::to_string(&msg).unwrap().into()))
            .await
            .unwrap();
    }
}
