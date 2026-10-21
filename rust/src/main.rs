//! Morua Junction — Gaborone's virtual mall.
//!
//! A Rust API service for a multi-vendor marketplace: shop managers run their
//! own shops, the mall admin approves them, sets the markup on their prices
//! and chooses which delivery provider carries each order.

mod api;
mod db;
mod ledger;
mod pricing;
mod schema;
mod seed;
mod timeutil;

use std::net::SocketAddr;
use std::sync::{Arc, Mutex};

use axum::Router;
use rusqlite::Connection;

use api::AppState;

#[tokio::main]
async fn main() {
    let db_path = std::env::var("MORUA_DB").unwrap_or_else(|_| "data/morua.db".to_string());
    if let Some(parent) = std::path::Path::new(&db_path).parent() {
        if !parent.as_os_str().is_empty() {
            let _ = std::fs::create_dir_all(parent);
        }
    }
    let conn = Connection::open(&db_path).expect("open database");
    schema::migrate(&conn);
    seed::seed(&conn);

    let state = Arc::new(AppState {
        db: Arc::new(Mutex::new(conn)),
    });

    let app: Router = api::router().with_state(state);

    let port: u16 = std::env::var("PORT")
        .ok()
        .and_then(|p| p.parse().ok())
        .unwrap_or(8787);
    let addr = SocketAddr::from(([0, 0, 0, 0], port));

    let listener = tokio::net::TcpListener::bind(addr)
        .await
        .expect("bind");
    println!("Morua Junction (Rust) listening on http://0.0.0.0:{port}");
    axum::serve(listener, app).await.expect("serve");
}
