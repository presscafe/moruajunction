//! HTTP API for Morua Junction.

use std::sync::{Arc, Mutex};

use std::collections::HashMap;

use axum::extract::{Path, Query, State};
use axum::routing::{get, post};
use axum::{Json, Router};
use rusqlite::params;
use rusqlite::ToSql;
use rusqlite::Connection;
use serde_json::{json, Map, Value};

use crate::db::{exec, last_id, row, rows, Db};
use crate::ledger::{self, Entry};
use crate::pricing::{
    delivery_quote, landed_quote, marked_price, price_band, round2, service_fee, CARD_CREDIT_PULA,
    COMMISSION_RATE,
};
use crate::timeutil::{minutes_between, now_iso};

pub struct AppState {
    pub db: Arc<Mutex<Connection>>,
}

type S = State<Arc<AppState>>;

pub fn router() -> Router<Arc<AppState>> {
    Router::new()
        .route("/health", get(health))
        .route("/mall", get(mall))
        .route("/mall/plan", get(mall_plan))
        .route("/stores", get(list_stores))
        .route("/stores/:slug", get(store_detail))
        .route("/products/:id", get(product_detail))
        .route("/aisles/:code", get(aisle_detail))
        .route("/walk", get(walk))
        .route("/providers", get(providers))
        .route("/areas", get(areas))
        .route("/cart/quote", post(cart_quote))
        .route("/card", get(card))
        .route("/orders", post(create_order))
        .route("/orders/:code", get(order_detail))
        .route("/orders/:code/advance", post(advance_order))
        .route("/orders/:code/returns", get(order_returns).post(create_return))
        .route("/seller/:slug", get(seller_console))
        .route("/seller/:slug/products", post(seller_save_product))
        .route("/seller/:slug/shelf", post(seller_sync_shelf))
        .route("/seller/:slug/special", post(seller_set_special))
        .route("/seller/:slug/returns", get(seller_returns))
        .route("/seller/:slug/returns/:id/accept", post(seller_accept_return))
        .route("/seller/:slug/returns/:id/decline", post(seller_decline_return))
        .route("/seller/:slug/notifications", get(seller_notifications))
        .route("/seller/:slug/notifications/read", post(seller_read_notifications))
        .route("/admin", get(admin_console))
        .route("/admin/stores/:id/approval", post(admin_approval))
        .route("/admin/stores/:id/markup", post(admin_markup))
        .route("/admin/orders/:code/dispatch", post(admin_dispatch))
        .route("/admin/disputes", post(admin_create_dispute))
        .route("/admin/disputes/:id/resolve", post(admin_resolve_dispute))
        .route("/admin/promotions", post(admin_create_promotion))
        .route("/admin/returns", get(admin_returns))
        .route("/admin/returns/:id/refund", post(admin_refund_return))
        .route("/admin/actions", get(admin_actions))
        .route("/ledger", get(ledger_view))
        .layer(axum::middleware::from_fn(cors))
}

async fn cors(
    request: axum::extract::Request,
    next: axum::middleware::Next,
) -> axum::response::Response {
    let origin = request
        .headers()
        .get("origin")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("*")
        .to_string();
    let mut response = next.run(request).await;
    let headers = response.headers_mut();
    headers.insert("access-control-allow-origin", origin.parse().unwrap());
    headers.insert(
        "access-control-allow-methods",
        "GET,POST,PUT,DELETE,OPTIONS".parse().unwrap(),
    );
    headers.insert(
        "access-control-allow-headers",
        "content-type,authorization".parse().unwrap(),
    );
    response
}

/* ------------------------------------------------------------------ *
 * Helpers
 * ------------------------------------------------------------------ */

/// Read a field under either a camelCase or a snake_case key, so the API
/// accepts both conventions from the storefront and from scripts.
fn field<'a>(value: &'a Value, camel: &str, snake: &str) -> Option<&'a Value> {
    value.get(camel).or_else(|| value.get(snake))
}

fn str_field<'a>(value: &'a Value, camel: &str, snake: &str) -> Option<&'a str> {
    field(value, camel, snake).and_then(|v| v.as_str())
}

fn num_field(value: &Value, camel: &str, snake: &str) -> Option<f64> {
    field(value, camel, snake).and_then(|v| v.as_f64())
}

fn args<'a, 'b>(params: &'a [&'b dyn ToSql]) -> &'a [&'b dyn ToSql] {
    params
}

fn json_array(value: &Value, key: &str) -> Value {
    value
        .get(key)
        .and_then(|v| v.as_str())
        .and_then(|s| serde_json::from_str::<Value>(s).ok())
        .unwrap_or_else(|| json!([]))
}

fn store_decorated(store: &Value) -> Value {
    let mut map = store.as_object().cloned().unwrap_or_default();
    for key in ["tags", "staff", "sections"] {
        let parsed = json_array(store, key);
        map.insert(key.to_string(), parsed);
    }
    let approval = map
        .get("approval_status")
        .and_then(|v| v.as_str())
        .unwrap_or("pending")
        .to_string();
    map.insert("approval_status".into(), json!(approval));
    let markup = map.get("markup_pct").and_then(|v| v.as_f64()).unwrap_or(0.0);
    map.insert("markup_pct".into(), json!(markup));
    Value::Object(map)
}

fn shelf_freshness(synced: Option<&str>) -> Value {
    let now = now_iso();
    match synced {
        None => json!({"label": "Never synced", "minutes": 99999, "live": false}),
        Some(ts) => {
            let minutes = minutes_between(ts, &now).unwrap_or(99999).max(0);
            let label = if minutes < 1 {
                "Just now".to_string()
            } else if minutes < 60 {
                format!("{minutes} min ago")
            } else if minutes < 1440 {
                format!("{} h ago", minutes / 60)
            } else {
                format!("{} d ago", minutes / 1440)
            };
            json!({"label": label, "minutes": minutes, "live": minutes <= 240})
        }
    }
}

fn product_decorated(conn: &Db, product: &Value, store: Option<&Value>) -> Value {
    let mut map = product.as_object().cloned().unwrap_or_default();
    let id = product.get("id").and_then(|v| v.as_i64()).unwrap_or(0);
    // Two prices, on purpose: the shelf price is what the shop publishes
    // and what Price Guard compares with the other shops; the effective
    // price is what the shopper is charged while the item is on special.
    let shelf_price = product.get("price_pula").and_then(|v| v.as_f64()).unwrap_or(0.0);
    let price = effective_price(product);
    let sa_zar = product.get("sa_price_zar").and_then(|v| v.as_f64()).unwrap_or(0.0);
    let kg = product.get("weight_kg").and_then(|v| v.as_f64()).unwrap_or(0.5);
    let duty = product.get("duty_rate").and_then(|v| v.as_f64()).unwrap_or(0.0);
    let match_key = product
        .get("match_key")
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_string();

    let peers: Vec<f64> = rows(
        conn,
        "SELECT price_pula FROM products WHERE match_key = ?1 AND active = 1 AND id != ?2",
        args(&[&match_key as &dyn ToSql, &id as &dyn ToSql]),
    )
    .iter()
    .filter_map(|r| r.get("price_pula").and_then(|v| v.as_f64()))
    .collect();

    let markup_pct = store
        .and_then(|s| s.get("markup_pct"))
        .and_then(|v| v.as_f64())
        .unwrap_or(0.0);
    let payable = marked_price(price, markup_pct);

    map.insert("tags".into(), json_array(product, "tags"));
    map.insert(
        "is_special".into(),
        json!(product.get("is_special").and_then(|v| v.as_i64()).unwrap_or(0) == 1),
    );
    map.insert("landed".into(), landed_quote(price, sa_zar, kg, duty));
    map.insert("band".into(), price_band(&match_key, shelf_price, &peers));
    map.insert(
        "shelf".into(),
        shelf_freshness(product.get("stock_synced_at").and_then(|v| v.as_str())),
    );
    map.insert("payable_pula".into(), json!(payable));
    map.insert("markup_pct".into(), json!(markup_pct));
    if let Some(s) = store {
        map.insert("store".into(), store_decorated(s));
    }
    Value::Object(map)
}

/// The price the shopper is charged for a product: the shop's promotional
/// price while it is on special, otherwise its shelf price. The admin's
/// markup is applied on top of this, never on the shelf price of an item
/// that is on offer.
fn effective_price(product: &Value) -> f64 {
    let on_special = product.get("is_special").and_then(|v| v.as_i64()).unwrap_or(0) == 1;
    if on_special {
        if let Some(special) = product.get("special_pula").and_then(|v| v.as_f64()) {
            return special;
        }
    }
    product.get("price_pula").and_then(|v| v.as_f64()).unwrap_or(0.0)
}

fn find_store(conn: &Db, slug: &str) -> Option<Value> {
    row(
        conn,
        "SELECT * FROM stores WHERE slug = ?1",
        args(&[&slug as &dyn ToSql]),
    )
    .map(|s| store_decorated(&s))
}

/// The aisle a shop unit stands in, e.g. "A2" or "FA1".
fn aisle_code_for(conn: &Db, aisle_id: Option<i64>) -> String {
    match aisle_id {
        Some(id) => row(
            conn,
            "SELECT code FROM aisles WHERE id = ?1",
            args(&[&id as &dyn ToSql]),
        )
        .and_then(|r| r.get("code").and_then(|v| v.as_str()).map(String::from))
        .unwrap_or_default(),
        None => String::new(),
    }
}

fn record_admin_action(
    conn: &Db,
    actor: &str,
    action: &str,
    target_type: &str,
    target_id: &str,
    detail: &str,
    reason: &str,
) {
    let _ = conn.execute(
        "INSERT INTO admin_actions (ts, actor, action, target_type, target_id, detail, reason) VALUES (?1,?2,?3,?4,?5,?6,?7)",
        params![now_iso(), actor, action, target_type, target_id, detail, reason],
    );
}

fn notify(conn: &Db, store_id: i64, kind: &str, title: &str, body: &str) {
    let _ = conn.execute(
        "INSERT INTO notifications (ts, store_id, kind, title, body, read) VALUES (?1,?2,?3,?4,?5,0)",
        params![now_iso(), store_id, kind, title, body],
    );
}

/* ------------------------------------------------------------------ *
 * Public views
 * ------------------------------------------------------------------ */

async fn health() -> Json<Value> {
    Json(json!({"ok": true, "service": "morua-junction", "time": now_iso(), "runtime": "rust"}))
}

async fn mall(State(state): S) -> Json<Value> {
    let conn = state.db.lock().unwrap();
    let floors = rows(&conn, "SELECT * FROM floors ORDER BY sort", &[]);
    let aisles = rows(&conn, "SELECT * FROM aisles ORDER BY sort", &[]);
    let store_rows = rows(&conn, "SELECT * FROM stores ORDER BY name", &[]);
    // Every shop in the network is listed. Shops still waiting on the admin
    // approval queue are shown, badged, so nothing disappears from the map.
    let stores: Vec<Value> = store_rows.iter().map(store_decorated).collect();
    let towns = rows(
        &conn,
        "SELECT town, district, region, COUNT(*) AS stores FROM stores GROUP BY town, district, region ORDER BY town",
        &[],
    );

    let product_rows = rows(
        &conn,
        "SELECT * FROM products WHERE is_special = 1 AND active = 1 ORDER BY special_pula LIMIT 8",
        &[],
    );
    let specials: Vec<Value> = product_rows
        .iter()
        .map(|p| {
            // The special belongs to the shop that sells it. Matching the
            // product id against the store id credited every special on the
            // front page to the wrong shop, or to none at all.
            let store = store_rows.iter().find(|s| {
                let store_id = s.get("id").and_then(|v| v.as_i64());
                let product_store_id = p.get("store_id").and_then(|v| v.as_i64());
                store_id == product_store_id
            });
            product_decorated(&conn, p, store)
        })
        .collect();

    let counts = row(
        &conn,
        "SELECT (SELECT COUNT(*) FROM products WHERE active=1) AS products,
                (SELECT COUNT(*) FROM stores) AS stores,
                (SELECT COUNT(*) FROM stores WHERE approval_status='approved') AS approved",
        &[],
    );
    let orders = row(
        &conn,
        "SELECT COUNT(*) AS c, COALESCE(SUM(total_pula),0) AS gmv FROM orders",
        &[],
    );
    let pending = row(
        &conn,
        "SELECT COUNT(*) AS c FROM stores WHERE approval_status='pending'",
        &[],
    );

    Json(json!({
        "floors": floors,
        "aisles": aisles,
        "stores": stores,
        "towns": towns,
        "specials": specials,
        "stats": {
            "stores": counts.as_ref().and_then(|c| c.get("stores")).and_then(|v| v.as_i64()).unwrap_or(0),
            "products": counts.as_ref().and_then(|c| c.get("products")).and_then(|v| v.as_i64()).unwrap_or(0),
            "approved": counts.as_ref().and_then(|c| c.get("approved")).and_then(|v| v.as_i64()).unwrap_or(0),
            "pendingApproval": pending.as_ref().and_then(|c| c.get("c")).and_then(|v| v.as_i64()).unwrap_or(0),
            "orders": orders.as_ref().and_then(|c| c.get("c")).and_then(|v| v.as_i64()).unwrap_or(0),
            "gmv": round2(orders.as_ref().and_then(|c| c.get("gmv")).and_then(|v| v.as_f64()).unwrap_or(0.0)),
        }
    }))
}

/// The God's-eye view: every shop positioned on its floor, with the corridors
/// between them and walking times across the mall.
async fn mall_plan(State(state): S) -> Json<Value> {
    let conn = state.db.lock().unwrap();
    let floors = rows(&conn, "SELECT * FROM floors ORDER BY sort", &[]);
    let aisles = rows(&conn, "SELECT * FROM aisles ORDER BY sort", &[]);
    let store_rows = rows(&conn, "SELECT * FROM stores ORDER BY unit_label", &[]);

    // Aisle -> floor map, so every unit knows which pavilion it stands in.
    let mut aisle_floor: Vec<(i64, i64)> = Vec::new();
    for a in &aisles {
        let aid = a.get("id").and_then(|v| v.as_i64()).unwrap_or(0);
        let fid = a.get("floor_id").and_then(|v| v.as_i64()).unwrap_or(0);
        aisle_floor.push((aid, fid));
    }
    let floor_of = |aisle_id: Option<i64>| -> i64 {
        let aid = match aisle_id {
            Some(v) => v,
            None => return 0,
        };
        aisle_floor
            .iter()
            .find(|(a, _)| *a == aid)
            .map(|(_, f)| *f)
            .unwrap_or(0)
    };

    // Each pavilion has its own hub: the Morua Junction hub for Gaborone,
    // the branch hub for every town.
    let mut hubs: Vec<(i64, f64, f64)> = Vec::new();
    for s in &store_rows {
        if s.get("kind").and_then(|v| v.as_str()).unwrap_or("") != "hub" {
            continue;
        }
        let fid = floor_of(s.get("aisle_id").and_then(|v| v.as_i64()));
        let x = s.get("unit_x").and_then(|v| v.as_f64()).unwrap_or(0.5);
        let y = s.get("unit_y").and_then(|v| v.as_f64()).unwrap_or(0.5);
        hubs.push((fid, x, y));
    }
    let hub_for = |fid: i64| -> (f64, f64) {
        hubs.iter()
            .find(|(f, _, _)| *f == fid)
            .map(|(_, x, y)| (*x, *y))
            .unwrap_or((0.5, 0.5))
    };

    let walk_minutes = |a: (f64, f64), b: (f64, f64)| -> i64 {
        let km = ((a.0 - b.0).powi(2) + (a.1 - b.1).powi(2)).sqrt() * 22.0;
        ((km / 4.5) * 60.0).round().max(1.0) as i64
    };

    let mut units = Vec::new();
    for s in &store_rows {
        let aisle_id = s.get("aisle_id").and_then(|v| v.as_i64());
        let fid = floor_of(aisle_id);
        let ux = s.get("unit_x").and_then(|v| v.as_f64()).unwrap_or(0.5);
        let uy = s.get("unit_y").and_then(|v| v.as_f64()).unwrap_or(0.5);
        let hub = hub_for(fid);
        let aisle_code = aisle_code_for(&conn, aisle_id);
        units.push(json!({
            "id": s.get("id").and_then(|v| v.as_i64()).unwrap_or(0),
            "slug": s.get("slug").and_then(|v| v.as_str()).unwrap_or(""),
            "name": s.get("name").and_then(|v| v.as_str()).unwrap_or(""),
            "icon": s.get("icon").and_then(|v| v.as_str()).unwrap_or(""),
            "accent": s.get("accent").and_then(|v| v.as_str()).unwrap_or("#333"),
            "area": s.get("area").and_then(|v| v.as_str()).unwrap_or(""),
            "town": s.get("town").and_then(|v| v.as_str()).unwrap_or("Gaborone"),
            "floorId": fid,
            "unitLabel": s.get("unit_label").and_then(|v| v.as_str()).unwrap_or(""),
            "x": ux,
            "y": uy,
            "aisle": aisle_code,
            "kind": s.get("kind").and_then(|v| v.as_str()).unwrap_or("retailer"),
            "approval": s.get("approval_status").and_then(|v| v.as_str()).unwrap_or("approved"),
            "minutesFromHub": walk_minutes((ux, uy), hub),
        }));
    }

    let mut hubs_out = Vec::new();
    for (fid, x, y) in &hubs {
        hubs_out.push(json!({"floorId": fid, "x": x, "y": y, "label": "Morua Junction Hub"}));
    }

    Json(json!({
        "floors": floors,
        "aisles": aisles,
        "units": units,
        "hubs": hubs_out,
        "hub": {"x": 0.5, "y": 0.5, "label": "Morua Junction Hub — Gaborone West"},
    }))
}

async fn list_stores(
    State(state): S,
    axum::extract::Query(params): axum::extract::Query<std::collections::HashMap<String, String>>,
) -> Json<Value> {
    let conn = state.db.lock().unwrap();
    let aisle = params.get("aisle").cloned();
    let q = params.get("q").cloned();
    let tag = params.get("tag").cloned();

    let town = params.get("town").cloned();
    let mut sql = String::from(
        "SELECT s.* FROM stores s LEFT JOIN aisles a ON a.id = s.aisle_id WHERE 1=1",
    );
    let mut args: Vec<Box<dyn ToSql>> = Vec::new();
    if let Some(t) = town {
        sql.push_str(" AND s.town = ?");
        args.push(Box::new(t));
    }
    if let Some(a) = aisle {
        sql.push_str(" AND a.code = ?");
        args.push(Box::new(a));
    }
    if let Some(t) = q {
        sql.push_str(" AND (s.name LIKE ? OR s.tagline LIKE ? OR s.tags LIKE ?)");
        args.push(Box::new(format!("%{t}%")));
        args.push(Box::new(format!("%{t}%")));
        args.push(Box::new(format!("%{t}%")));
    }
    if let Some(t) = tag {
        sql.push_str(" AND s.tags LIKE ?");
        args.push(Box::new(format!("%\"{t}\"%")));
    }
    sql.push_str(" ORDER BY s.town, s.kind = 'hub' DESC, s.name");

    let bound: Vec<&dyn ToSql> = args.iter().map(|b| b.as_ref()).collect();
    let stores: Vec<Value> = rows(&conn, &sql, &bound).iter().map(store_decorated).collect();
    Json(json!({"stores": stores}))
}

async fn store_detail(State(state): S, Path(slug): Path<String>) -> Json<Value> {
    let conn = state.db.lock().unwrap();
    let store = match find_store(&conn, &slug) {
        Some(s) => s,
        None => return Json(json!({"error": "Store not found"})),
    };
    let approval = store
        .get("approval_status")
        .and_then(|v| v.as_str())
        .unwrap_or("approved")
        .to_string();
    let tradeable = approval == "approved";
    let id = store.get("id").and_then(|v| v.as_i64()).unwrap_or(0);
    let products = rows(
        &conn,
        "SELECT * FROM products WHERE store_id = ?1 AND active = 1 ORDER BY is_special DESC, name",
        args(&[&id as &dyn ToSql]),
    );
    let reviews = rows(
        &conn,
        "SELECT id, author, rating, body, created_at FROM reviews WHERE store_id = ?1 ORDER BY created_at DESC LIMIT 12",
        args(&[&id as &dyn ToSql]),
    );
    let peers: Vec<Value> = products
        .iter()
        .filter_map(|p| {
            let key = p.get("match_key")?.as_str()?;
            let n: i64 = row(
                &conn,
                "SELECT COUNT(*) AS c FROM products WHERE match_key = ?1 AND active = 1 AND store_id != ?2",
                args(&[&key as &dyn ToSql, &id as &dyn ToSql]),
            )
            .and_then(|r| r.get("c").and_then(|v| v.as_i64()))
            .unwrap_or(0);
            if n > 0 {
                Some(json!({"matchKey": key, "count": n}))
            } else {
                None
            }
        })
        .collect();

    let fresh = row(
        &conn,
        "SELECT MAX(stock_synced_at) AS max FROM products WHERE store_id = ?1",
        args(&[&id as &dyn ToSql]),
    )
    .and_then(|r| r.get("max").and_then(|v| v.as_str()).map(String::from));

    Json(json!({
        "store": store_decorated(&store),
        "tradeable": tradeable,
        "products": products.iter().map(|p| product_decorated(&conn, p, Some(&store))).collect::<Vec<_>>(),
        "reviews": reviews,
        "shelfFreshness": shelf_freshness(fresh.as_deref()),
        "peerCompetition": peers,
    }))
}

async fn product_detail(State(state): S, Path(id): Path<i64>) -> Json<Value> {
    let conn = state.db.lock().unwrap();
    let product = match row(
        &conn,
        "SELECT * FROM products WHERE id = ?1",
        args(&[&id as &dyn ToSql]),
    ) {
        Some(p) => p,
        None => return Json(json!({"error": "Product not found"})),
    };
    let store_id = product.get("store_id").and_then(|v| v.as_i64()).unwrap_or(0);
    let store = row(
        &conn,
        "SELECT * FROM stores WHERE id = ?1",
        args(&[&store_id as &dyn ToSql]),
    );
    let shop_approved = store
        .as_ref()
        .and_then(|s| s.get("approval_status"))
        .and_then(|v| v.as_str())
        .unwrap_or("approved")
        == "approved";
    let key = product.get("match_key").and_then(|v| v.as_str()).unwrap_or("").to_string();
    let peers = rows(
        &conn,
        "SELECT p.*, s.name AS store_name, s.slug AS store_slug, s.area AS store_area
         FROM products p JOIN stores s ON s.id = p.store_id
         WHERE p.match_key = ?1 AND p.active = 1 AND p.id != ?2 ORDER BY p.price_pula",
        args(&[&key as &dyn ToSql, &id as &dyn ToSql]),
    );

    Json(json!({
        "product": product_decorated(&conn, &product, store.as_ref()),
        "tradeable": shop_approved,
        "peers": peers.iter().map(|p| json!({
            "id": p.get("id").and_then(|v| v.as_i64()).unwrap_or(0),
            "name": p.get("name").and_then(|v| v.as_str()).unwrap_or(""),
            "price_pula": p.get("price_pula").and_then(|v| v.as_f64()).unwrap_or(0.0),
            "icon": p.get("icon").and_then(|v| v.as_str()).unwrap_or("📦"),
            "stock": p.get("stock").and_then(|v| v.as_i64()).unwrap_or(0),
            "store_name": p.get("store_name").and_then(|v| v.as_str()).unwrap_or(""),
            "store_slug": p.get("store_slug").and_then(|v| v.as_str()).unwrap_or(""),
            "store_area": p.get("store_area").and_then(|v| v.as_str()).unwrap_or(""),
            "unit": p.get("unit").and_then(|v| v.as_str()).unwrap_or("each"),
        })).collect::<Vec<_>>(),
    }))
}

async fn aisle_detail(State(state): S, Path(code): Path<String>) -> Json<Value> {
    let conn = state.db.lock().unwrap();
    let aisle = match row(
        &conn,
        "SELECT * FROM aisles WHERE code = ?1",
        args(&[&code as &dyn ToSql]),
    ) {
        Some(a) => a,
        None => return Json(json!({"error": "Aisle not found"})),
    };
    let id = aisle.get("id").and_then(|v| v.as_i64()).unwrap_or(0);
    let store_rows = rows(
        &conn,
        "SELECT * FROM stores WHERE aisle_id = ?1 ORDER BY kind = 'hub' DESC, name",
        args(&[&id as &dyn ToSql]),
    );
    let products = rows(
        &conn,
        "SELECT p.* FROM products p JOIN stores s ON s.id = p.store_id
         WHERE s.aisle_id = ?1 AND p.active = 1 ORDER BY p.is_special DESC, p.sold_count DESC LIMIT 40",
        args(&[&id as &dyn ToSql]),
    );
    Json(json!({
        "aisle": aisle,
        "stores": store_rows.iter().map(store_decorated).collect::<Vec<_>>(),
        "products": products.iter().map(|p| product_decorated(&conn, p, None)).collect::<Vec<_>>(),
    }))
}

async fn walk(
    State(state): S,
    axum::extract::Query(params): axum::extract::Query<std::collections::HashMap<String, String>>,
) -> Json<Value> {
    let conn = state.db.lock().unwrap();
    let stores = rows(&conn, "SELECT * FROM stores", &[]);
    let aisles = rows(&conn, "SELECT id, floor_id FROM aisles", &[]);

    // Each pavilion has its own hub, so walking times are measured inside the
    // town you are actually in.
    let mut aisle_floor: Vec<(i64, i64)> = Vec::new();
    for a in &aisles {
        let aid = a.get("id").and_then(|v| v.as_i64()).unwrap_or(0);
        let fid = a.get("floor_id").and_then(|v| v.as_i64()).unwrap_or(0);
        aisle_floor.push((aid, fid));
    }
    let floor_of = |aisle_id: Option<i64>| -> i64 {
        let aid = match aisle_id {
            Some(v) => v,
            None => return 0,
        };
        aisle_floor
            .iter()
            .find(|(a, _)| *a == aid)
            .map(|(_, f)| *f)
            .unwrap_or(0)
    };
    let mut hubs: Vec<(i64, f64, f64)> = Vec::new();
    for s in &stores {
        if s.get("kind").and_then(|v| v.as_str()).unwrap_or("") != "hub" {
            continue;
        }
        let fid = floor_of(s.get("aisle_id").and_then(|v| v.as_i64()));
        let x = s.get("unit_x").and_then(|v| v.as_f64()).unwrap_or(0.5);
        let y = s.get("unit_y").and_then(|v| v.as_f64()).unwrap_or(0.5);
        hubs.push((fid, x, y));
    }
    let hub_for = |fid: i64| -> (f64, f64) {
        hubs.iter()
            .find(|(f, _, _)| *f == fid)
            .map(|(_, x, y)| (*x, *y))
            .unwrap_or((0.5, 0.5))
    };
    let coords: Vec<(f64, f64)> = stores
        .iter()
        .map(|s| {
            let fid = floor_of(s.get("aisle_id").and_then(|v| v.as_i64()));
            let hub = hub_for(fid);
            let ux = s.get("unit_x").and_then(|v| v.as_f64()).unwrap_or(0.5);
            let uy = s.get("unit_y").and_then(|v| v.as_f64()).unwrap_or(0.5);
            (hub.0 + (ux - hub.0) * 0.06, hub.1 + (uy - hub.1) * 0.06)
        })
        .collect();
    let walk_minutes = |a: (f64, f64), b: (f64, f64)| -> i64 {
        let km = ((a.0 - b.0).powi(2) + (a.1 - b.1).powi(2)).sqrt() * 22.0;
        ((km / 4.5) * 60.0).round().max(1.0) as i64
    };

    let focus = params.get("from").cloned();
    let mut out: Vec<Value> = Vec::new();
    for (i, s) in stores.iter().enumerate() {
        let slug = s.get("slug").and_then(|v| v.as_str()).unwrap_or("").to_string();
        if let Some(f) = &focus {
            if slug != *f {
                continue;
            }
        }
        let c = coords[i];
        let times: Map<String, Value> = stores
            .iter()
            .enumerate()
            .map(|(j, o)| {
                let oslug = o.get("slug").and_then(|v| v.as_str()).unwrap_or("").to_string();
                (oslug, json!(walk_minutes(c, coords[j])))
            })
            .collect();
        let fid = floor_of(s.get("aisle_id").and_then(|v| v.as_i64()));
        let hub = hub_for(fid);
        out.push(json!({
            "slug": slug,
            "name": s.get("name").and_then(|v| v.as_str()).unwrap_or(""),
            "town": s.get("town").and_then(|v| v.as_str()).unwrap_or("Gaborone"),
            "unit_label": s.get("unit_label").and_then(|v| v.as_str()).unwrap_or(""),
            "minutesFromHub": walk_minutes(c, hub),
            "minutesTo": Value::Object(times),
        }));
    }
    Json(json!({"from": out}))
}

/// Every delivery zone the Junction serves, for the area picker.
async fn areas(State(_state): S) -> Json<Value> {
    let list: Vec<&str> = crate::pricing::ZONES.iter().map(|(name, _)| *name).collect();
    Json(json!({"areas": list}))
}

async fn providers(State(state): S) -> Json<Value> {
    let conn = state.db.lock().unwrap();
    let list = rows(
        &conn,
        "SELECT * FROM delivery_providers ORDER BY rating DESC, name",
        &[],
    );
    Json(json!({"providers": list}))
}

/* ------------------------------------------------------------------ *
 * Cart and orders
 * ------------------------------------------------------------------ */

struct QuoteLine {
    product: Value,
    store: Value,
    qty: i64,
    unit_price: f64,
    payable_unit: f64,
    line_total: f64,
    commission: f64,
    seller_net: f64,
    markup: f64,
    landed: Value,
    tradeable: bool,
}

/// A line of a basket, before the money is worked out.
struct Draft {
    product: Value,
    store: Value,
    qty: i64,
    base: f64,
    landed: Value,
    tradeable: bool,
    markup_pct: f64,
}

/// The shopper's number, as the stores it is keyed by: the last eight
/// digits, so "+267 71 000 000" and "71000000" are the same shopper.
fn normalise_phone(phone: &str) -> String {
    let digits: String = phone.chars().filter(|c| c.is_ascii_digit()).collect();
    if digits.len() > 8 {
        digits[digits.len() - 8..].to_string()
    } else {
        digits
    }
}

/// What the shopper's Store Card is worth against this basket, if it is
/// full. The shop that issued the card funds the credit.
fn card_credit(conn: &Db, phone: &str, store_id: i64, store_total: f64) -> Option<f64> {
    if phone.is_empty() || store_total <= 0.0 {
        return None;
    }
    let stamps = row(
        conn,
        "SELECT stamps FROM card_stamps WHERE phone = ?1 AND store_id = ?2",
        args(&[&phone as &dyn ToSql, &store_id]),
    )
    .and_then(|r| r.get("stamps"))
    .and_then(|v| v.as_i64())
    .unwrap_or(0);
    if stamps <= 0 {
        return None;
    }
    let target = row(
        conn,
        "SELECT card_target FROM stores WHERE id = ?1",
        args(&[&store_id as &dyn ToSql]),
    )
    .and_then(|r| r.get("card_target"))
    .and_then(|v| v.as_i64())
    .unwrap_or(8);
    if stamps < target {
        return None;
    }
    let credit = round2(store_total.min(CARD_CREDIT_PULA));
    if credit <= 0.0 {
        None
    } else {
        Some(credit)
    }
}

fn build_quote(
    conn: &Db,
    lines: &Value,
    area: &str,
    fulfilment: &str,
    phone: &str,
) -> (Vec<QuoteLine>, Value) {
    let mut drafts: Vec<Draft> = Vec::new();
    if let Some(arr) = lines.as_array() {
        for line in arr {
            let pid = field(line, "productId", "product_id")
                .and_then(|v| v.as_i64())
                .or_else(|| line.get("id").and_then(|v| v.as_i64()))
                .unwrap_or(0);
            let qty = line.get("qty").and_then(|v| v.as_f64()).unwrap_or(1.0).floor() as i64;
            let qty = qty.clamp(1, 50);
            let product = match row(
                conn,
                "SELECT * FROM products WHERE id = ?1 AND active = 1",
                args(&[&pid as &dyn ToSql]),
            ) {
                Some(p) => p,
                None => continue,
            };
            let store_id = product.get("store_id").and_then(|v| v.as_i64()).unwrap_or(0);
            let store = store_decorated(
                &row(
                    conn,
                    "SELECT * FROM stores WHERE id = ?1",
                    args(&[&store_id as &dyn ToSql]),
                )
                .unwrap_or(json!({})),
            );
            // A product on special is charged at the special price, and the
            // commission and the seller's share are worked out of that same
            // price, so the books still balance to the cent.
            let base = effective_price(&product);
            let markup_pct = store.get("markup_pct").and_then(|v| v.as_f64()).unwrap_or(0.0);
            // A shop waiting on the admin approval queue may be browsed but
            // may not trade.
            let tradeable = store
                .get("approval_status")
                .and_then(|v| v.as_str())
                .unwrap_or("approved")
                == "approved";
            let landed = landed_quote(
                base,
                product.get("sa_price_zar").and_then(|v| v.as_f64()).unwrap_or(0.0),
                product.get("weight_kg").and_then(|v| v.as_f64()).unwrap_or(0.5),
                product.get("duty_rate").and_then(|v| v.as_f64()).unwrap_or(0.0),
            );
            drafts.push(Draft {
                product,
                store,
                qty,
                base,
                landed,
                tradeable,
                markup_pct,
            });
        }
    }

    // What each shop in this basket is worth, before any card credit.
    let mut store_totals: Vec<(i64, f64)> = Vec::new();
    for d in &drafts {
        let sid = d.store.get("id").and_then(|v| v.as_i64()).unwrap_or(0);
        let total = d.base * d.qty as f64;
        match store_totals.iter_mut().find(|(s, _)| *s == sid) {
            Some(t) => t.1 += total,
            None => store_totals.push((sid, total)),
        }
    }

    // The Store Card™: a full card earns a credit against this basket.
    let key = normalise_phone(phone);
    let mut credits: Vec<(i64, f64)> = Vec::new();
    for (sid, total) in &store_totals {
        if let Some(credit) = card_credit(conn, &key, *sid, *total) {
            credits.push((*sid, credit));
        }
    }

    // The money, with the card credit taken off the shop's own lines.
    let mut out: Vec<QuoteLine> = Vec::new();
    for d in &drafts {
        let sid = d.store.get("id").and_then(|v| v.as_i64()).unwrap_or(0);
        let base_total = d.base * d.qty as f64;
        let store_total = store_totals
            .iter()
            .find(|(s, _)| *s == sid)
            .map(|(_, t)| *t)
            .unwrap_or(0.0);
        let credit = credits
            .iter()
            .find(|(s, _)| *s == sid)
            .map(|(_, c)| *c)
            .unwrap_or(0.0);
        // The credit is spread across the shop's lines in proportion to
        // what each of them is worth.
        let discount_total = if store_total > 0.0 {
            credit * base_total / store_total
        } else {
            0.0
        };
        let discount_unit = if d.qty > 0 {
            discount_total / d.qty as f64
        } else {
            0.0
        };
        let base = (d.base - discount_unit).max(0.0);
        let payable_unit = marked_price(base, d.markup_pct);
        let line_total = round2(payable_unit * d.qty as f64);
        let base_total = round2(base * d.qty as f64);
        let commission = round2(base_total * COMMISSION_RATE);
        let markup = round2(line_total - base_total);
        out.push(QuoteLine {
            product: d.product.clone(),
            store: d.store.clone(),
            tradeable: d.tradeable,
            qty: d.qty,
            unit_price: base,
            payable_unit,
            line_total,
            commission,
            seller_net: round2(base_total - commission),
            markup,
            landed: d.landed.clone(),
        });
    }

    // What the card gave back, for the shopper to see.
    let card_credits: Vec<Value> = credits
        .iter()
        .map(|(sid, credit)| {
            let shop = drafts
                .iter()
                .find(|d| d.store.get("id").and_then(|v| v.as_i64()).unwrap_or(0) == *sid)
                .and_then(|d| d.store.get("name").and_then(|v| v.as_str()))
                .unwrap_or("A shop")
                .to_string();
            json!({"storeId": sid, "shop": shop, "creditPula": credit})
        })
        .collect();

    let subtotal = round2(out.iter().map(|l| l.line_total).sum());
    let delivery = if fulfilment == "pickup" {
        0.0
    } else {
        delivery_quote(area, subtotal)
            .get("feePula")
            .and_then(|v| v.as_f64())
            .unwrap_or(0.0)
    };
    let fee = service_fee(subtotal);
    let total = round2(subtotal + delivery + fee);
    let saved = round2(
        out.iter()
            .filter(|l| {
                l.landed
                    .get("localWins")
                    .and_then(|v| v.as_bool())
                    .unwrap_or(false)
            })
            .map(|l| {
                l.landed
                    .get("savingPula")
                    .and_then(|v| v.as_f64())
                    .unwrap_or(0.0)
                    * l.qty as f64
            })
            .sum(),
    );

    let lines_json: Vec<Value> = out
        .iter()
        .map(|l| {
            json!({
                "productId": l.product.get("id").and_then(|v| v.as_i64()).unwrap_or(0),
                "sku": l.product.get("sku").and_then(|v| v.as_str()).unwrap_or(""),
                "name": l.product.get("name").and_then(|v| v.as_str()).unwrap_or(""),
                "blurb": l.product.get("blurb").and_then(|v| v.as_str()).unwrap_or(""),
                "icon": l.product.get("icon").and_then(|v| v.as_str()).unwrap_or("📦"),
                "unit": l.product.get("unit").and_then(|v| v.as_str()).unwrap_or("each"),
                "qty": l.qty,
                "unitPrice": l.unit_price,
                "payableUnit": l.payable_unit,
                "markupPula": l.markup,
                "lineTotal": l.line_total,
                "commission": l.commission,
                "sellerNet": l.seller_net,
                "stock": l.product.get("stock").and_then(|v| v.as_i64()).unwrap_or(0),
                "tradeable": l.tradeable,
                "store": l.store,
                "landed": l.landed,
            })
        })
        .collect();

    let mut seen = Vec::new();
    let stores: Vec<Value> = out
        .iter()
        .filter(|l| {
            let id = l.store.get("id").and_then(|v| v.as_i64()).unwrap_or(0);
            if seen.contains(&id) {
                false
            } else {
                seen.push(id);
                true
            }
        })
        .map(|l| l.store.clone())
        .collect();

    let quote = json!({
        "lines": lines_json,
        "stores": stores,
        "subtotal": subtotal,
        "delivery": delivery,
        "serviceFee": fee,
        "total": total,
        "savedVsLanded": saved,
        "deliveryQuote": delivery_quote(area, subtotal),
        "fulfilment": fulfilment,
        "area": area,
        "cardCredits": card_credits,
        "cardCreditPula": round2(credits.iter().map(|(_, c)| *c).sum()),
    });
    (out, quote)
}

async fn cart_quote(State(state): S, Json(body): Json<Value>) -> Json<Value> {
    let conn = state.db.lock().unwrap();
    let area = body.get("area").and_then(|v| v.as_str()).unwrap_or("Gaborone Central");
    let fulfilment = body
        .get("fulfilment")
        .and_then(|v| v.as_str())
        .unwrap_or("delivery");
    let lines = field(&body, "lines", "items").cloned().unwrap_or(json!([]));
    // A Store Card is keyed to the shopper's number, so the mall can
    // find the card without asking anybody to sign in.
    let phone = str_field(&body, "phone", "phone")
        .or_else(|| str_field(&body, "customerPhone", "customer_phone"))
        .unwrap_or("")
        .to_string();
    let (_, quote) = build_quote(&conn, &lines, area, fulfilment, &phone);
    Json(quote)
}

/// The shopper's Store Cards: one per shop they have been served by.
async fn card(State(state): S, Query(params): Query<HashMap<String, String>>) -> Json<Value> {
    let conn = state.db.lock().unwrap();
    let phone = params.get("phone").cloned().unwrap_or_default();
    let key = normalise_phone(&phone);
    if key.is_empty() {
        return Json(json!({"phone": "", "cards": []}));
    }
    let found = rows(
        &conn,
        "SELECT cs.store_id, cs.stamps, s.card_target, s.name, s.slug, s.icon, s.area, s.town
         FROM card_stamps cs JOIN stores s ON s.id = cs.store_id
         WHERE cs.phone = ?1 ORDER BY cs.stamps DESC, s.name",
        args(&[&key as &dyn ToSql]),
    );
    let cards: Vec<Value> = found
        .iter()
        .map(|r| {
            let stamps = r.get("stamps").and_then(|v| v.as_i64()).unwrap_or(0);
            let target = r.get("card_target").and_then(|v| v.as_i64()).unwrap_or(8);
            json!({
                "storeId": r.get("store_id").and_then(|v| v.as_i64()).unwrap_or(0),
                "shop": r.get("name").and_then(|v| v.as_str()).unwrap_or("A shop"),
                "slug": r.get("slug").and_then(|v| v.as_str()).unwrap_or(""),
                "icon": r.get("icon").and_then(|v| v.as_str()).unwrap_or("🏬"),
                "area": r.get("area").and_then(|v| v.as_str()).unwrap_or(""),
                "town": r.get("town").and_then(|v| v.as_str()).unwrap_or(""),
                "stamps": stamps,
                "target": target,
                "ready": stamps >= target,
                "creditPula": CARD_CREDIT_PULA,
            })
        })
        .collect();
    Json(json!({"phone": key, "cards": cards}))
}

async fn create_order(State(state): S, Json(body): Json<Value>) -> Json<Value> {
    let conn = state.db.lock().unwrap();
    let area = str_field(&body, "customerArea", "customer_area")
        .or_else(|| body.get("area").and_then(|v| v.as_str()))
        .unwrap_or("Gaborone Central")
        .to_string();
    let fulfilment = body
        .get("fulfilment")
        .and_then(|v| v.as_str())
        .unwrap_or("delivery")
        .to_string();
    let lines = field(&body, "lines", "items").cloned().unwrap_or(json!([]));
    // The shopper's number is also their Store Card.
    let customer_phone = str_field(&body, "customerPhone", "customer_phone")
        .unwrap_or("+267 000 0000")
        .to_string();
    let (quote_lines, quote) = build_quote(&conn, &lines, &area, &fulfilment, &customer_phone);

    if quote_lines.is_empty() {
        return Json(json!({"error": "Your basket is empty."}));
    }
    for l in &quote_lines {
        if !l.tradeable {
            let name = l.store.get("name").and_then(|v| v.as_str()).unwrap_or("A shop");
            return Json(json!({
                "error": format!(
                    "{name} is still waiting for the Junction admin to approve it, so it cannot take orders yet."
                )
            }));
        }
        let stock = l.product.get("stock").and_then(|v| v.as_i64()).unwrap_or(0);
        if stock < l.qty {
            let name = l.product.get("name").and_then(|v| v.as_str()).unwrap_or("item");
            let store = l.store.get("name").and_then(|v| v.as_str()).unwrap_or("the shop");
            return Json(json!({
                "error": format!("{store} only has {stock} of {name} on the shelf right now.")
            }));
        }
    }

    let stamp = now_iso();
    let serial = (crate::timeutil::now_nanos() % 900_000) as i64 + 1000;
    let code = format!("MJ-{}-{}", &stamp[0..4], serial);
    let customer_name = str_field(&body, "customerName", "customer_name")
        .unwrap_or("Guest")
        .to_string();
    let address = body
        .get("address")
        .and_then(|v| v.as_str())
        .unwrap_or("Gaborone")
        .to_string();
    let notes = body
        .get("notes")
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_string();
    let payment_method = body
        .get("paymentMethod")
        .and_then(|v| v.as_str())
        .unwrap_or("cod")
        .to_string();
    let collect_point = body
        .get("collectPoint")
        .and_then(|v| v.as_str())
        .unwrap_or("Morua Junction Hub — Gaborone West")
        .to_string();

    let eta = if fulfilment == "pickup" {
        30
    } else {
        quote
            .get("deliveryQuote")
            .and_then(|d| d.get("etaMax"))
            .and_then(|v| v.as_i64())
            .unwrap_or(120)
    };

    exec(
        &conn,
        "INSERT INTO orders (code, customer_name, customer_phone, customer_area, fulfilment, status,
            payment_method, payment_state, escrow_state, subtotal_pula, delivery_pula, service_pula,
            total_pula, saved_pula, address, notes, eta_minutes, placed_at, updated_at, collect_point)
         VALUES (?1,?2,?3,?4,?5,'placed',?6,?7,'held',?8,?9,?10,?11,?12,?13,?14,?15,?16,?16,?17)",
        args(&[
            &code as &dyn ToSql,
            &customer_name,
            &customer_phone,
            &area,
            &fulfilment,
            &payment_method,
            &if payment_method == "cod" { "due_on_delivery" } else { "authorised" },
            &quote.get("subtotal").and_then(|v| v.as_f64()).unwrap_or(0.0),
            &quote.get("delivery").and_then(|v| v.as_f64()).unwrap_or(0.0),
            &quote.get("serviceFee").and_then(|v| v.as_f64()).unwrap_or(0.0),
            &quote.get("total").and_then(|v| v.as_f64()).unwrap_or(0.0),
            &quote.get("savedVsLanded").and_then(|v| v.as_f64()).unwrap_or(0.0),
            &address,
            &notes,
            &eta,
            &stamp,
            &collect_point,
        ]),
    );
    let order_id = last_id(&conn);
    let card_key = normalise_phone(&customer_phone);

    for l in &quote_lines {
        let pid = l.product.get("id").and_then(|v| v.as_i64()).unwrap_or(0);
        let sid = l.store.get("id").and_then(|v| v.as_i64()).unwrap_or(0);
        exec(
            &conn,
            "INSERT INTO order_items (order_id, product_id, store_id, qty, unit_price_pula, line_total_pula,
                commission_pula, seller_net_pula, markup_pula) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9)",
            args(&[
                &order_id as &dyn ToSql,
                &pid,
                &sid,
                &l.qty,
                &l.payable_unit,
                &l.line_total,
                &l.commission,
                &l.seller_net,
                &l.markup,
            ]),
        );
        exec(
            &conn,
            "UPDATE products SET stock = MAX(0, stock - ?1), sold_count = sold_count + ?1 WHERE id = ?2",
            args(&[&l.qty as &dyn ToSql, &pid as &dyn ToSql]),
        );
    }

    let total = quote.get("total").and_then(|v| v.as_f64()).unwrap_or(0.0);
    // The card has been spent: it starts again from empty at that shop.
    if let Some(credits) = quote.get("cardCredits").and_then(|v| v.as_array()) {
        for credit in credits {
            let store_id = credit.get("storeId").and_then(|v| v.as_i64()).unwrap_or(0);
            exec(
                &conn,
                "UPDATE card_stamps SET stamps = 0, updated_at = ?1 WHERE phone = ?2 AND store_id = ?3",
                args(&[&stamp as &dyn ToSql, &card_key as &dyn ToSql, &store_id]),
            );
        }
    }

    ledger::post(
        &conn,
        &[
            Entry {
                ts: stamp.clone(),
                order_id: Some(order_id),
                account: "platform_cash".into(),
                direction: "debit".into(),
                amount_pula: total,
                kind: "order".into(),
                memo: format!("Order {code} collected"),
            },
            Entry {
                ts: stamp.clone(),
                order_id: Some(order_id),
                account: "escrow_held".into(),
                direction: "credit".into(),
                amount_pula: total,
                kind: "order".into(),
                memo: format!("Order {code} held in escrow"),
            },
        ],
    );

    Json(json!({"code": code, "orderId": order_id, "quote": quote}))
}

const ORDER_FLOW: &[&str] = &[
    "placed",
    "confirmed",
    "picking",
    "picked_up",
    "in_transit",
    "out_for_delivery",
    "delivered",
];

async fn order_detail(State(state): S, Path(code): Path<String>) -> Json<Value> {
    let conn = state.db.lock().unwrap();
    let order = match row(
        &conn,
        "SELECT * FROM orders WHERE code = ?1",
        args(&[&code as &dyn ToSql]),
    ) {
        Some(o) => o,
        None => return Json(json!({"error": "Order not found"})),
    };
    let id = order.get("id").and_then(|v| v.as_i64()).unwrap_or(0);
    let items = rows(
        &conn,
        "SELECT oi.*, p.name, p.icon, p.sku FROM order_items oi JOIN products p ON p.id = oi.product_id WHERE oi.order_id = ?1",
        args(&[&id as &dyn ToSql]),
    );
    let stores: Vec<Value> = rows(
        &conn,
        "SELECT DISTINCT s.* FROM stores s JOIN order_items oi ON oi.store_id = s.id WHERE oi.order_id = ?1",
        args(&[&id as &dyn ToSql]),
    )
    .iter()
    .map(store_decorated)
    .collect();
    let provider = order
        .get("delivery_provider_id")
        .and_then(|v| v.as_i64())
        .and_then(|pid| {
            row(
                &conn,
                "SELECT * FROM delivery_providers WHERE id = ?1",
                args(&[&pid as &dyn ToSql]),
            )
        });

    let returns = returns_list(&conn, "WHERE r.order_id = ?1", args(&[&id as &dyn ToSql]));

    Json(json!({
        "order": order,
        "items": items,
        "stores": stores,
        "provider": provider,
        "returns": returns,
        "statusCopy": {
            "placed": "Order received by the mall",
            "confirmed": "Shops confirmed the items and reserved them on the shelf",
            "picking": "Items are being picked and packed",
            "picked_up": "Rider collected from the shop",
            "in_transit": "Rider is on the way",
            "out_for_delivery": "Rider is at your door",
            "delivered": "Delivered — payment released",
            "failed": "Delivery could not be completed",
            "cancelled": "Order cancelled",
        }
    }))
}

async fn advance_order(
    State(state): S,
    Path(code): Path<String>,
    Json(body): Json<Value>,
) -> Json<Value> {
    let conn = state.db.lock().unwrap();
    let order = match row(
        &conn,
        "SELECT * FROM orders WHERE code = ?1",
        args(&[&code as &dyn ToSql]),
    ) {
        Some(o) => o,
        None => return Json(json!({"error": "Order not found"})),
    };
    let requested = body
        .get("status")
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_string();
    let current = order.get("status").and_then(|v| v.as_str()).unwrap_or("").to_string();
    let current_index = ORDER_FLOW.iter().position(|s| *s == current);
    // With no status named, the order moves one step along its own flow.
    let to = match (current_index, requested.is_empty()) {
        (Some(c), true) => ORDER_FLOW
            .get(c + 1)
            .map(|s| s.to_string())
            .unwrap_or_else(|| current.clone()),
        _ => requested.clone(),
    };
    if !ORDER_FLOW.contains(&to.as_str()) {
        return Json(json!({"error": "Unknown status"}));
    }
    let next_index = ORDER_FLOW.iter().position(|s| *s == to.as_str());
    match (current_index, next_index) {
        (Some(c), Some(n)) if n == c + 1 => {}
        _ => {
            return Json(json!({
                "error": format!("Cannot move from {current} to {to}")
            }))
        }
    }

    let id = order.get("id").and_then(|v| v.as_i64()).unwrap_or(0);
    let ts = now_iso();
    exec(
        &conn,
        "UPDATE orders SET status = ?1, updated_at = ?2 WHERE id = ?3",
        args(&[&to as &dyn ToSql, &ts as &dyn ToSql, &id as &dyn ToSql]),
    );

    if to == "delivered" {
        let escrow = order.get("escrow_state").and_then(|v| v.as_str()).unwrap_or("held");
        if escrow == "held" {
            let items = rows(
                &conn,
                "SELECT commission_pula, seller_net_pula, markup_pula FROM order_items WHERE order_id = ?1",
                args(&[&id as &dyn ToSql]),
            );
            let sum = |key: &str| -> f64 {
                items
                    .iter()
                    .map(|i| i.get(key).and_then(|v| v.as_f64()).unwrap_or(0.0))
                    .sum()
            };
            let commission = round2(sum("commission_pula"));
            let markup = round2(sum("markup_pula"));
            let seller_net = round2(sum("seller_net_pula"));
            let delivery = order
                .get("delivery_pula")
                .and_then(|v| v.as_f64())
                .unwrap_or(0.0);
            let service = order
                .get("service_pula")
                .and_then(|v| v.as_f64())
                .unwrap_or(0.0);
            let total = order
                .get("total_pula")
                .and_then(|v| v.as_f64())
                .unwrap_or(0.0);

            exec(
                &conn,
                "UPDATE orders SET escrow_state = 'released' WHERE id = ?1",
                args(&[&id as &dyn ToSql]),
            );
            // The shopper's Store Card earns a stamp at every shop that
            // served them, and the shop's own card counts the stamps it
            // has handed out.
            let phone = normalise_phone(
                order
                    .get("customer_phone")
                    .and_then(|v| v.as_str())
                    .unwrap_or(""),
            );
            if !phone.is_empty() {
                let shops = rows(
                    &conn,
                    "SELECT DISTINCT store_id FROM order_items WHERE order_id = ?1",
                    args(&[&id as &dyn ToSql]),
                );
                for shop in &shops {
                    let sid = shop.get("store_id").and_then(|v| v.as_i64()).unwrap_or(0);
                    exec(
                        &conn,
                        "INSERT INTO card_stamps (phone, store_id, stamps, updated_at) VALUES (?1,?2,1,?3)
                         ON CONFLICT(phone, store_id) DO UPDATE SET stamps = stamps + 1, updated_at = ?3",
                        args(&[&phone as &dyn ToSql, &sid, &ts as &dyn ToSql]),
                    );
                    exec(
                        &conn,
                        "UPDATE stores SET card_stamps = card_stamps + 1 WHERE id = ?1",
                        args(&[&sid]),
                    );
                }
            }
            ledger::post(
                &conn,
                &[
                    Entry {
                        ts: ts.clone(),
                        order_id: Some(id),
                        account: "escrow_held".into(),
                        direction: "debit".into(),
                        amount_pula: total,
                        kind: "release".into(),
                        memo: format!("Escrow released for {code}"),
                    },
                    Entry {
                        ts: ts.clone(),
                        order_id: Some(id),
                        account: "revenue".into(),
                        direction: "credit".into(),
                        amount_pula: round2(commission + markup + service),
                        kind: "release".into(),
                        memo: format!("Commission, markup and service fee on {code}"),
                    },
                    Entry {
                        ts: ts.clone(),
                        order_id: Some(id),
                        account: "seller_payable".into(),
                        direction: "credit".into(),
                        amount_pula: seller_net,
                        kind: "release".into(),
                        memo: format!("Seller proceeds for {code}"),
                    },
                    Entry {
                        ts: ts.clone(),
                        order_id: Some(id),
                        account: "delivery_costs".into(),
                        direction: "credit".into(),
                        amount_pula: delivery,
                        kind: "release".into(),
                        memo: format!("Delivery settlement for {code}"),
                    },
                ],
            );
        }
    }
    let updated = row(
        &conn,
        "SELECT * FROM orders WHERE id = ?1",
        args(&[&id as &dyn ToSql]),
    );
    Json(json!({"ok": true, "status": to, "order": updated}))
}

/* ------------------------------------------------------------------ *
 * Return to Shop
 *
 * The one thing a WhatsApp group and a cross-border forwarder cannot
 * do: take the thing back. The shopper sends the item to the shop that
 * sold it, the shop accepts it, and the mall settles the refund out of
 * the money it collected. The delivery is not returned — the rider
 * already came.
 * ------------------------------------------------------------------ */

/// The reasons a shopper can give for sending something back.
pub const RETURN_REASONS: &[&str] = &[
    "Not what I ordered",
    "Arrived damaged",
    "Wrong item",
    "Missing from the box",
    "No longer needed",
    "Other",
];

/// A return joined with the product, the shop and the order it is on.
fn return_joined(conn: &Db, id: i64) -> Option<Value> {
    row(
        conn,
        "SELECT r.*, p.name AS product, p.icon, p.sku, o.code AS order_code,
                o.status AS order_status, s.name AS shop, s.slug AS shop_slug
         FROM returns r
         JOIN products p ON p.id = r.product_id
         JOIN orders o ON o.id = r.order_id
         JOIN stores s ON s.id = r.store_id
         WHERE r.id = ?1",
        args(&[&id as &dyn ToSql]),
    )
}

/// Every return, joined with the product, the shop and the order.
fn returns_list(conn: &Db, where_clause: &str, params: &[&dyn ToSql]) -> Vec<Value> {
    rows(
        conn,
        &format!(
            "SELECT r.*, p.name AS product, p.icon, p.sku, o.code AS order_code,
                    o.status AS order_status, s.name AS shop, s.slug AS shop_slug
             FROM returns r
             JOIN products p ON p.id = r.product_id
             JOIN orders o ON o.id = r.order_id
             JOIN stores s ON s.id = r.store_id
             {where_clause}
             ORDER BY r.id DESC"
        ),
        params,
    )
}

/// How many returns are still waiting on somebody.
fn returns_open(list: &[Value]) -> usize {
    list.iter()
        .filter(|r| {
            matches!(
                r.get("status").and_then(|v| v.as_str()),
                Some("requested") | Some("accepted")
            )
        })
        .count()
}

async fn order_returns(State(state): S, Path(code): Path<String>) -> Json<Value> {
    let conn = state.db.lock().unwrap();
    let order = match row(
        &conn,
        "SELECT id FROM orders WHERE code = ?1",
        args(&[&code as &dyn ToSql]),
    ) {
        Some(o) => o,
        None => return Json(json!({"error": "Order not found"})),
    };
    let order_id = order.get("id").and_then(|v| v.as_i64()).unwrap_or(0);
    let list = returns_list(&conn, "WHERE r.order_id = ?1", args(&[&order_id as &dyn ToSql]));
    Json(json!({"returns": list, "reasons": RETURN_REASONS}))
}

async fn create_return(
    State(state): S,
    Path(code): Path<String>,
    Json(body): Json<Value>,
) -> Json<Value> {
    let conn = state.db.lock().unwrap();
    let order = match row(
        &conn,
        "SELECT * FROM orders WHERE code = ?1",
        args(&[&code as &dyn ToSql]),
    ) {
        Some(o) => o,
        None => return Json(json!({"error": "Order not found"})),
    };
    let status = order
        .get("status")
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_string();
    // The goods have to be with the shopper, or on their way, before
    // there is anything to send back.
    if status != "out_for_delivery" && status != "delivered" {
        return Json(json!({
            "error": "An item can only be sent back once it is on its way to you or has arrived"
        }));
    }
    let order_id = order.get("id").and_then(|v| v.as_i64()).unwrap_or(0);
    let item_id = body.get("itemId").and_then(|v| v.as_i64()).unwrap_or(0);
    let item = match row(
        &conn,
        "SELECT * FROM order_items WHERE id = ?1 AND order_id = ?2",
        args(&[&item_id as &dyn ToSql, &order_id]),
    ) {
        Some(i) => i,
        None => return Json(json!({"error": "That item is not on this order"})),
    };
    let ordered = item.get("qty").and_then(|v| v.as_i64()).unwrap_or(0);
    // What is already on its way back to the shop.
    let already: i64 = rows(
        &conn,
        "SELECT COALESCE(SUM(qty),0) AS q FROM returns WHERE order_item_id = ?1 AND status != 'declined'",
        args(&[&item_id as &dyn ToSql]),
    )
    .first()
    .and_then(|r| r.get("q"))
    .and_then(|v| v.as_i64())
    .unwrap_or(0);
    let qty = body.get("qty").and_then(|v| v.as_i64()).unwrap_or(1);
    if qty < 1 {
        return Json(json!({"error": "Say how many you are sending back"}));
    }
    let left = ordered - already;
    if qty > left {
        return Json(json!({
            "error": format!("Only {left} of that item can still be sent back")
        }));
    }
    let unit = item
        .get("unit_price_pula")
        .and_then(|v| v.as_f64())
        .unwrap_or(0.0);
    let amount = round2(unit * qty as f64);
    let reason = body
        .get("reason")
        .and_then(|v| v.as_str())
        .unwrap_or("Not what I ordered")
        .to_string();
    let product_id = item.get("product_id").and_then(|v| v.as_i64()).unwrap_or(0);
    let store_id = item.get("store_id").and_then(|v| v.as_i64()).unwrap_or(0);
    let ts = now_iso();
    exec(
        &conn,
        "INSERT INTO returns (order_id, order_item_id, product_id, store_id, qty, amount_pula,
            reason, status, note, created_at, updated_at)
         VALUES (?1,?2,?3,?4,?5,?6,?7,'requested','',?8,?8)",
        args(&[
            &order_id as &dyn ToSql,
            &item_id,
            &product_id,
            &store_id,
            &qty,
            &amount,
            &reason,
            &ts as &dyn ToSql,
        ]),
    );
    let id = last_id(&conn);
    // The shop is told straight away: it has to take the item back.
    let product_name = row(
        &conn,
        "SELECT name FROM products WHERE id = ?1",
        args(&[&product_id as &dyn ToSql]),
    )
    .and_then(|p| p.get("name").and_then(|v| v.as_str()).map(String::from))
    .unwrap_or_else(|| "An item".to_string());
    notify(
        &conn,
        store_id,
        "return",
        "A shopper wants to send something back",
        &format!(
            "{product_name} on order {code} — {reason}. Take it back from the shopper, then the mall refunds them."
        ),
    );
    Json(json!({"ok": true, "return": return_joined(&conn, id)}))
}

async fn seller_returns(State(state): S, Path(slug): Path<String>) -> Json<Value> {
    let conn = state.db.lock().unwrap();
    let store = match find_store(&conn, &slug) {
        Some(s) => s,
        None => return Json(json!({"error": "Store not found"})),
    };
    let id = store.get("id").and_then(|v| v.as_i64()).unwrap_or(0);
    let list = returns_list(&conn, "WHERE r.store_id = ?1", args(&[&id as &dyn ToSql]));
    Json(json!({"returns": list, "open": returns_open(&list)}))
}

/// The shop accepts or turns down a return.
fn return_decision(conn: &Db, slug: &str, id: i64, accept: bool, note: &str) -> Json<Value> {
    let store = match find_store(conn, slug) {
        Some(s) => s,
        None => return Json(json!({"error": "Store not found"})),
    };
    let store_id = store.get("id").and_then(|v| v.as_i64()).unwrap_or(0);
    let ret = match return_joined(conn, id) {
        Some(r) => r,
        None => return Json(json!({"error": "Return not found"})),
    };
    if ret.get("store_id").and_then(|v| v.as_i64()) != Some(store_id) {
        return Json(json!({"error": "That return belongs to another shop"}));
    }
    let status = ret
        .get("status")
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_string();
    if status != "requested" {
        return Json(json!({"error": "That return has already been answered"}));
    }
    let product = ret
        .get("product")
        .and_then(|v| v.as_str())
        .unwrap_or("The item")
        .to_string();
    let code = ret
        .get("order_code")
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_string();
    let amount = ret
        .get("amount_pula")
        .and_then(|v| v.as_f64())
        .unwrap_or(0.0);
    let ts = now_iso();
    let new_status = if accept { "accepted" } else { "declined" };
    let note = if note.is_empty() {
        if accept {
            "The shop will take it back.".to_string()
        } else {
            "The shop cannot take this one back.".to_string()
        }
    } else {
        note.to_string()
    };
    exec(
        conn,
        "UPDATE returns SET status = ?1, note = ?2, updated_at = ?3 WHERE id = ?4",
        args(&[
            &new_status as &dyn ToSql,
            &note as &dyn ToSql,
            &ts as &dyn ToSql,
            &id,
        ]),
    );
    if accept {
        notify(
            conn,
            store_id,
            "return",
            "You accepted a return",
            &format!("{product} on order {code}. Take it back, then the mall refunds the shopper."),
        );
    }
    Json(json!({
        "ok": true,
        "status": new_status,
        "amount_pula": amount,
        "return": return_joined(conn, id)
    }))
}

async fn seller_accept_return(
    State(state): S,
    Path((slug, id)): Path<(String, i64)>,
    Json(body): Json<Value>,
) -> Json<Value> {
    let conn = state.db.lock().unwrap();
    let note = body
        .get("note")
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_string();
    return_decision(&conn, &slug, id, true, &note)
}

async fn seller_decline_return(
    State(state): S,
    Path((slug, id)): Path<(String, i64)>,
    Json(body): Json<Value>,
) -> Json<Value> {
    let conn = state.db.lock().unwrap();
    let note = body
        .get("note")
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_string();
    return_decision(&conn, &slug, id, false, &note)
}

async fn admin_returns(State(state): S) -> Json<Value> {
    let conn = state.db.lock().unwrap();
    let list = returns_list(&conn, "", &[]);
    Json(json!({"returns": list, "open": returns_open(&list)}))
}

/// The mall settles a return: the shopper gets the money back, the shop's
/// share goes back to the mall with the item, and the junction's levy is
/// returned too. The delivery is not — the rider already came.
async fn admin_refund_return(
    State(state): S,
    Path(id): Path<i64>,
    Json(_body): Json<Value>,
) -> Json<Value> {
    let conn = state.db.lock().unwrap();
    let ret = match return_joined(&conn, id) {
        Some(r) => r,
        None => return Json(json!({"error": "Return not found"})),
    };
    let status = ret
        .get("status")
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_string();
    if status == "refunded" {
        return Json(json!({"error": "That return has already been refunded"}));
    }
    if status != "accepted" {
        return Json(json!({
            "error": "The shop has to accept the return before it can be refunded"
        }));
    }
    let order_id = ret.get("order_id").and_then(|v| v.as_i64()).unwrap_or(0);
    let order = match row(
        &conn,
        "SELECT * FROM orders WHERE id = ?1",
        args(&[&order_id as &dyn ToSql]),
    ) {
        Some(o) => o,
        None => return Json(json!({"error": "Order not found"})),
    };
    let order_status = order
        .get("status")
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_string();
    if order_status != "delivered" {
        return Json(json!({
            "error": "The refund settles once the order has been delivered"
        }));
    }
    let item_id = ret.get("order_item_id").and_then(|v| v.as_i64()).unwrap_or(0);
    let item = match row(
        &conn,
        "SELECT * FROM order_items WHERE id = ?1",
        args(&[&item_id as &dyn ToSql]),
    ) {
        Some(i) => i,
        None => return Json(json!({"error": "That item is not on the order any more"})),
    };
    let qty = ret.get("qty").and_then(|v| v.as_i64()).unwrap_or(1);
    let line_qty = item
        .get("qty")
        .and_then(|v| v.as_i64())
        .unwrap_or(1)
        .max(1);
    let unit = item
        .get("unit_price_pula")
        .and_then(|v| v.as_f64())
        .unwrap_or(0.0);
    let amount = round2(unit * qty as f64);
    let seller_share = round2(
        item.get("seller_net_pula")
            .and_then(|v| v.as_f64())
            .unwrap_or(0.0)
            * qty as f64
            / line_qty as f64,
    );
    let revenue_share = round2(amount - seller_share);
    let ts = now_iso();
    let code = ret
        .get("order_code")
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_string();
    let product = ret
        .get("product")
        .and_then(|v| v.as_str())
        .unwrap_or("the item")
        .to_string();
    let posted = ledger::post(
        &conn,
        &[
            Entry {
                ts: ts.clone(),
                order_id: Some(order_id),
                account: "platform_cash".into(),
                direction: "credit".into(),
                amount_pula: amount,
                kind: "refund".into(),
                memo: format!("Refund for {product} on order {code}"),
            },
            Entry {
                ts: ts.clone(),
                order_id: Some(order_id),
                account: "revenue".into(),
                direction: "debit".into(),
                amount_pula: revenue_share,
                kind: "refund".into(),
                memo: "Junction levy returned with the item".into(),
            },
            Entry {
                ts: ts.clone(),
                order_id: Some(order_id),
                account: "seller_payable".into(),
                direction: "debit".into(),
                amount_pula: seller_share,
                kind: "refund".into(),
                memo: "The shop's share returned with the item".into(),
            },
        ],
    );
    if !posted {
        return Json(json!({"error": "The refund would not balance the books"}));
    }
    exec(
        &conn,
        "UPDATE returns SET status = 'refunded', updated_at = ?1 WHERE id = ?2",
        args(&[&ts as &dyn ToSql, &id]),
    );
    let store_id = ret.get("store_id").and_then(|v| v.as_i64()).unwrap_or(0);
    notify(
        &conn,
        store_id,
        "return",
        "A return was refunded",
        &format!("{product} was sent back and P{amount} went back to the shopper."),
    );
    record_admin_action(
        &conn,
        "Mall Admin",
        "refund_return",
        "return",
        &id.to_string(),
        &format!("P{amount} returned to the shopper"),
        "",
    );
    Json(json!({
        "ok": true,
        "status": "refunded",
        "amount_pula": amount,
        "return": return_joined(&conn, id)
    }))
}

/* ------------------------------------------------------------------ *
 * Seller console
 * ------------------------------------------------------------------ */

async fn seller_console(State(state): S, Path(slug): Path<String>) -> Json<Value> {
    let conn = state.db.lock().unwrap();
    let store = match find_store(&conn, &slug) {
        Some(s) => s,
        None => return Json(json!({"error": "Store not found"})),
    };
    let id = store.get("id").and_then(|v| v.as_i64()).unwrap_or(0);
    let products = rows(
        &conn,
        "SELECT * FROM products WHERE store_id = ?1 AND active = 1 ORDER BY name",
        args(&[&id as &dyn ToSql]),
    );
    let decorated: Vec<Value> = products
        .iter()
        .map(|p| product_decorated(&conn, p, Some(&store)))
        .collect();
    let orders = rows(
        &conn,
        "SELECT o.id, o.code, o.status, o.total_pula, o.placed_at, o.customer_name, o.customer_area, o.fulfilment
         FROM orders o JOIN order_items oi ON oi.order_id = o.id WHERE oi.store_id = ?1
         GROUP BY o.id ORDER BY o.placed_at DESC LIMIT 20",
        args(&[&id as &dyn ToSql]),
    );
    let revenue = row(
        &conn,
        "SELECT COALESCE(SUM(oi.line_total_pula),0) AS gmv, COUNT(DISTINCT oi.order_id) AS orders,
                COALESCE(SUM(oi.markup_pula),0) AS markup, COALESCE(SUM(oi.commission_pula),0) AS commission
         FROM order_items oi WHERE oi.store_id = ?1",
        args(&[&id as &dyn ToSql]),
    );
    let payout = row(
        &conn,
        "SELECT COALESCE(SUM(net_pula),0) AS net, COUNT(*) AS count FROM payouts WHERE store_id = ?1 AND state='scheduled'",
        args(&[&id as &dyn ToSql]),
    );
    let notifications = rows(
        &conn,
        "SELECT * FROM notifications WHERE store_id = ?1 ORDER BY id DESC LIMIT 20",
        args(&[&id as &dyn ToSql]),
    );

    let returns = returns_list(&conn, "WHERE r.store_id = ?1", args(&[&id as &dyn ToSql]));

    let gmv = revenue.as_ref().and_then(|r| r.get("gmv")).and_then(|v| v.as_f64()).unwrap_or(0.0);
    Json(json!({
        "store": store,
        "products": decorated,
        "orders": orders,
        "returns": returns,
        "openReturns": returns_open(&returns),
        "revenue": {
            "gmv": round2(gmv),
            "orders": revenue.as_ref().and_then(|r| r.get("orders")).and_then(|v| v.as_i64()).unwrap_or(0),
            "commission": round2(revenue.as_ref().and_then(|r| r.get("commission")).and_then(|v| v.as_f64()).unwrap_or(0.0)),
            "markup": round2(revenue.as_ref().and_then(|r| r.get("markup")).and_then(|v| v.as_f64()).unwrap_or(0.0)),
        },
        "payout": {
            "net": round2(payout.as_ref().and_then(|r| r.get("net")).and_then(|v| v.as_f64()).unwrap_or(0.0)),
            "count": payout.as_ref().and_then(|r| r.get("count")).and_then(|v| v.as_i64()).unwrap_or(0),
        },
        "notifications": notifications,
        "alerts": {
            "lowStock": decorated.iter().filter(|p| p.get("stock").and_then(|v| v.as_i64()).unwrap_or(99) <= 5).count(),
            "staleShelf": decorated.iter().filter(|p| p.get("shelf").and_then(|s| s.get("live")).and_then(|v| v.as_bool()).unwrap_or(false) == false).count(),
            "aboveBand": decorated.iter().filter(|p| p.get("band").and_then(|b| b.get("position")).and_then(|v| v.as_str()) == Some("above")).count(),
        }
    }))
}

async fn seller_save_product(
    State(state): S,
    Path(slug): Path<String>,
    Json(body): Json<Value>,
) -> Json<Value> {
    let conn = state.db.lock().unwrap();
    let store = match find_store(&conn, &slug) {
        Some(s) => s,
        None => return Json(json!({"error": "Store not found"})),
    };
    let id = store.get("id").and_then(|v| v.as_i64()).unwrap_or(0);
    let product_id = body.get("id").and_then(|v| v.as_i64());
    let name = body.get("name").and_then(|v| v.as_str()).unwrap_or("").to_string();
    let blurb = body.get("blurb").and_then(|v| v.as_str()).unwrap_or("").to_string();
    let price = num_field(&body, "pricePula", "price_pula");
    let stock = field(&body, "stock", "stock")
        .and_then(|v| v.as_i64())
        .or_else(|| field(&body, "stock", "stock").and_then(|v| v.as_f64()).map(|f| f as i64));
    let unit = body.get("unit").and_then(|v| v.as_str()).unwrap_or("each").to_string();
    let icon = body.get("icon").and_then(|v| v.as_str()).unwrap_or("📦").to_string();
    let sa_zar = num_field(&body, "saPriceZar", "sa_price_zar").unwrap_or(0.0);
    let weight = num_field(&body, "weightKg", "weight_kg").unwrap_or(0.5);

    if let Some(pid) = product_id {
        exec(
            &conn,
            // When the shop moves the shelf price of an item that is on
            // offer, the price it was reduced from moves with it.
            "UPDATE products SET name = COALESCE(NULLIF(?1,''), name), blurb = COALESCE(?2, blurb),
                price_pula = COALESCE(?3, price_pula),
                was_price_pula = CASE WHEN is_special = 1 AND ?3 IS NOT NULL THEN ?3 ELSE was_price_pula END,
                stock = COALESCE(?4, stock), stock_synced_at = ?5
             WHERE id = ?6 AND store_id = ?7",
            args(&[
                &name as &dyn ToSql,
                &blurb,
                &price,
                &stock,
                &now_iso() as &dyn ToSql,
                &pid,
                &id,
            ]),
        );
        return Json(json!({"ok": true, "id": pid}));
    }

    let key = name.to_lowercase().replace(|c: char| !c.is_alphanumeric(), "-");
    let sku = format!("MJ-{}", 100_000 + last_id(&conn));
    exec(
        &conn,
        "INSERT INTO products (sku, store_id, name, blurb, match_key, category, unit, icon, price_pula,
            sa_price_zar, weight_kg, duty_rate, origin, stock, stock_synced_at, rating, review_count,
            sold_count, is_special, special_pula, tags, active)
         VALUES (?1,?2,?3,?4,?5,'Services',?6,?7,?8,?9,?10,0.15,'Gaborone',?11,?12,0,0,0,0,NULL,'[]',1)",
        args(&[
            &sku as &dyn ToSql,
            &id,
            &name,
            &blurb,
            &key,
            &unit,
            &icon,
            &price.unwrap_or(0.0),
            &sa_zar,
            &weight,
            &stock.unwrap_or(0),
            &now_iso() as &dyn ToSql,
        ]),
    );
    Json(json!({"ok": true, "id": last_id(&conn)}))
}

async fn seller_sync_shelf(
    State(state): S,
    Path(slug): Path<String>,
    Json(body): Json<Value>,
) -> Json<Value> {
    let conn = state.db.lock().unwrap();
    let store = match find_store(&conn, &slug) {
        Some(s) => s,
        None => return Json(json!({"error": "Store not found"})),
    };
    let id = store.get("id").and_then(|v| v.as_i64()).unwrap_or(0);
    let ts = now_iso();
    match body.get("productId").and_then(|v| v.as_i64()) {
        Some(pid) => {
            let stock = body.get("stock").and_then(|v| v.as_i64()).unwrap_or(0).max(0);
            exec(
                &conn,
                "UPDATE products SET stock = ?1, stock_synced_at = ?2 WHERE id = ?3 AND store_id = ?4",
                args(&[
                    &stock as &dyn ToSql,
                    &ts as &dyn ToSql,
                    &pid,
                    &id,
                ]),
            );
        }
        None => {
            exec(
                &conn,
                "UPDATE products SET stock_synced_at = ?1 WHERE store_id = ?2",
                args(&[&ts as &dyn ToSql, &id as &dyn ToSql]),
            );
        }
    }
    Json(json!({"ok": true}))
}

async fn seller_set_special(
    State(state): S,
    Path(slug): Path<String>,
    Json(body): Json<Value>,
) -> Json<Value> {
    let conn = state.db.lock().unwrap();
    let store = match find_store(&conn, &slug) {
        Some(s) => s,
        None => return Json(json!({"error": "Store not found"})),
    };
    let id = store.get("id").and_then(|v| v.as_i64()).unwrap_or(0);
    let pid = field(&body, "productId", "product_id")
        .and_then(|v| v.as_i64())
        .or_else(|| body.get("id").and_then(|v| v.as_i64()))
        .unwrap_or(0);
    if body.get("clear").and_then(|v| v.as_bool()).unwrap_or(false) {
        exec(
            &conn,
            "UPDATE products SET is_special = 0, special_pula = NULL, was_price_pula = NULL
             WHERE id = ?1 AND store_id = ?2",
            args(&[&pid as &dyn ToSql, &id as &dyn ToSql]),
        );
    } else {
        let special = num_field(&body, "specialPula", "special_pula").unwrap_or(0.0);
        // Keep the price it was reduced from, so the shopper can see what
        // the special saved them rather than just a lower number.
        exec(
            &conn,
            "UPDATE products SET is_special = 1, special_pula = ?1, was_price_pula = price_pula
             WHERE id = ?2 AND store_id = ?3",
            args(&[&special as &dyn ToSql, &pid, &id]),
        );
    }
    Json(json!({"ok": true}))
}

async fn seller_notifications(State(state): S, Path(slug): Path<String>) -> Json<Value> {
    let conn = state.db.lock().unwrap();
    let store = match find_store(&conn, &slug) {
        Some(s) => s,
        None => return Json(json!({"error": "Store not found"})),
    };
    let id = store.get("id").and_then(|v| v.as_i64()).unwrap_or(0);
    let list = rows(
        &conn,
        "SELECT * FROM notifications WHERE store_id = ?1 ORDER BY id DESC LIMIT 50",
        args(&[&id as &dyn ToSql]),
    );
    Json(json!({"notifications": list}))
}

async fn seller_read_notifications(
    State(state): S,
    Path(slug): Path<String>,
    Json(_body): Json<Value>,
) -> Json<Value> {
    let conn = state.db.lock().unwrap();
    if let Some(store) = find_store(&conn, &slug) {
        let id = store.get("id").and_then(|v| v.as_i64()).unwrap_or(0);
        exec(
            &conn,
            "UPDATE notifications SET read = 1 WHERE store_id = ?1",
            args(&[&id as &dyn ToSql]),
        );
    }
    Json(json!({"ok": true}))
}

/* ------------------------------------------------------------------ *
 * Admin console
 * ------------------------------------------------------------------ */

async fn admin_console(State(state): S) -> Json<Value> {
    let conn = state.db.lock().unwrap();
    let store_rows = rows(
        &conn,
        "SELECT * FROM stores ORDER BY CASE approval_status WHEN 'pending' THEN 0 ELSE 1 END, name",
        &[],
    );
    let stores: Vec<Value> = store_rows.iter().map(store_decorated).collect();
    let disputes = rows(
        &conn,
        "SELECT d.*, o.code AS order_code, s.name AS store_name FROM disputes d
         LEFT JOIN orders o ON o.id = d.order_id LEFT JOIN stores s ON s.id = d.store_id
         ORDER BY CASE d.state WHEN 'open' THEN 0 ELSE 1 END, d.created_at DESC",
        &[],
    );
    let all_products = rows(
        &conn,
        "SELECT p.*, s.name AS store_name, s.slug AS store_slug FROM products p JOIN stores s ON s.id = p.store_id WHERE p.active = 1",
        &[],
    );
    let anomalies: Vec<Value> = all_products
        .iter()
        .map(|p| {
            let mut v = product_decorated(&conn, p, None);
            if let Some(map) = v.as_object_mut() {
                map.insert(
                    "store_name".into(),
                    p.get("store_name").cloned().unwrap_or(json!("")),
                );
                map.insert(
                    "store_slug".into(),
                    p.get("store_slug").cloned().unwrap_or(json!("")),
                );
            }
            v
        })
        .filter(|p| {
            p.get("band")
                .and_then(|b| b.get("position"))
                .and_then(|v| v.as_str())
                == Some("above")
        })
        .collect();

    let platform = row(
        &conn,
        "SELECT COALESCE(SUM(total_pula),0) AS gmv, COUNT(*) AS orders,
                COUNT(DISTINCT customer_phone) AS shoppers, COALESCE(SUM(saved_pula),0) AS saved
         FROM orders",
        &[],
    );
    let pending = row(
        &conn,
        "SELECT COUNT(*) AS c FROM stores WHERE approval_status = 'pending'",
        &[],
    );
    let unassigned = row(
        &conn,
        "SELECT COUNT(*) AS c FROM orders WHERE delivery_provider_id IS NULL AND status NOT IN ('delivered','cancelled')",
        &[],
    );

    let orders = rows(
        &conn,
        "SELECT id, code, customer_name, customer_phone, customer_area, fulfilment, status, payment_method,
                total_pula, placed_at, delivery_provider_id, delivery_provider_name, rider_name
         FROM orders ORDER BY id DESC LIMIT 40",
        &[],
    );

    Json(json!({
        "stores": stores,
        "orders": orders,
        "pendingApprovals": stores.iter().filter(|s| s.get("approval_status").and_then(|v| v.as_str()) == Some("pending")).count(),
        "disputes": disputes,
        "anomalies": anomalies,
        "promotions": rows(&conn, "SELECT * FROM promotions ORDER BY state, id DESC", &[]),
        "providers": rows(&conn, "SELECT * FROM delivery_providers ORDER BY rating DESC", &[]),
        "balances": ledger::balances(&conn),
        "entries": ledger::recent_entries(&conn, 30),
        "actions": rows(&conn, "SELECT * FROM admin_actions ORDER BY id DESC LIMIT 40", &[]),
        "platform": {
            "gmv": round2(platform.as_ref().and_then(|p| p.get("gmv")).and_then(|v| v.as_f64()).unwrap_or(0.0)),
            "orders": platform.as_ref().and_then(|p| p.get("orders")).and_then(|v| v.as_i64()).unwrap_or(0),
            "shoppers": platform.as_ref().and_then(|p| p.get("shoppers")).and_then(|v| v.as_i64()).unwrap_or(0),
            "savedVsLanded": round2(platform.as_ref().and_then(|p| p.get("saved")).and_then(|v| v.as_f64()).unwrap_or(0.0)),
            "pendingApprovals": pending.as_ref().and_then(|p| p.get("c")).and_then(|v| v.as_i64()).unwrap_or(0),
            "ordersAwaitingDispatch": unassigned.as_ref().and_then(|p| p.get("c")).and_then(|v| v.as_i64()).unwrap_or(0),
        }
    }))
}

/// The admin approves or declines a shop manager's application to trade.
async fn admin_approval(
    State(state): S,
    Path(id): Path<i64>,
    Json(body): Json<Value>,
) -> Json<Value> {
    let conn = state.db.lock().unwrap();
    let decision = body
        .get("decision")
        .and_then(|v| v.as_str())
        .unwrap_or("approve")
        .to_string();
    let note = body
        .get("note")
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_string();
    let actor = body
        .get("actor")
        .and_then(|v| v.as_str())
        .unwrap_or("Mall Admin")
        .to_string();
    let store = match row(
        &conn,
        "SELECT * FROM stores WHERE id = ?1",
        args(&[&id as &dyn ToSql]),
    ) {
        Some(s) => s,
        None => return Json(json!({"error": "Store not found"})),
    };
    let name = store.get("name").and_then(|v| v.as_str()).unwrap_or("shop");
    let status = if decision == "approve" { "approved" } else { "declined" };
    let ts = now_iso();
    exec(
        &conn,
        "UPDATE stores SET approval_status = ?1, approval_note = ?2, approved_at = ?3, approved_by = ?4 WHERE id = ?5",
        args(&[
            &status as &dyn ToSql,
            &note,
            &ts as &dyn ToSql,
            &actor,
            &id,
        ]),
    );
    record_admin_action(
        &conn,
        &actor,
        if decision == "approve" { "approve_shop_manager" } else { "decline_shop_manager" },
        "store",
        &id.to_string(),
        &format!("{name} {status}"),
        &note,
    );
    notify(
        &conn,
        id,
        "approval",
        &format!("Your shop application was {status}"),
        &if note.is_empty() {
            format!("{name} has been {status} by the Morua Junction admin team.")
        } else {
            format!("{name}: {note}")
        },
    );
    Json(json!({"ok": true, "approval_status": status}))
}

/// The admin sets the markup applied on top of a shop manager's own price.
async fn admin_markup(
    State(state): S,
    Path(id): Path<i64>,
    Json(body): Json<Value>,
) -> Json<Value> {
    let conn = state.db.lock().unwrap();
    let markup = num_field(&body, "markupPct", "markup_pct")
        .unwrap_or(0.0)
        .clamp(0.0, 25.0);
    let note = body
        .get("note")
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_string();
    let actor = body
        .get("actor")
        .and_then(|v| v.as_str())
        .unwrap_or("Mall Admin")
        .to_string();
    let store = match row(
        &conn,
        "SELECT * FROM stores WHERE id = ?1",
        args(&[&id as &dyn ToSql]),
    ) {
        Some(s) => s,
        None => return Json(json!({"error": "Store not found"})),
    };
    let name = store.get("name").and_then(|v| v.as_str()).unwrap_or("shop");
    let ts = now_iso();
    exec(
        &conn,
        "UPDATE stores SET markup_pct = ?1, markup_note = ?2, markup_set_by = ?3, markup_set_at = ?4 WHERE id = ?5",
        args(&[
            &markup as &dyn ToSql,
            &note,
            &actor,
            &ts as &dyn ToSql,
            &id,
        ]),
    );
    record_admin_action(
        &conn,
        &actor,
        "set_markup",
        "store",
        &id.to_string(),
        &format!("{name} markup set to {markup}%"),
        &note,
    );
    notify(
        &conn,
        id,
        "markup",
        &format!("Your shop markup is now {markup}%"),
        &format!(
            "The mall applies a {markup}% markup on the prices you set. Your own price is unchanged.{}",
            if note.is_empty() { String::new() } else { format!(" Note: {note}") }
        ),
    );
    Json(json!({"ok": true, "markup_pct": markup}))
}

/// The admin decides which delivery service provider carries each order.
async fn admin_dispatch(
    State(state): S,
    Path(code): Path<String>,
    Json(body): Json<Value>,
) -> Json<Value> {
    let conn = state.db.lock().unwrap();
    let provider_id = body
        .get("providerId")
        .and_then(|v| v.as_i64())
        .unwrap_or(0);
    let rider = body
        .get("riderName")
        .and_then(|v| v.as_str())
        .unwrap_or("Dispatch desk")
        .to_string();
    let rider_phone = body
        .get("riderPhone")
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_string();
    let note = body
        .get("note")
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_string();
    let actor = body
        .get("actor")
        .and_then(|v| v.as_str())
        .unwrap_or("Dispatch Desk")
        .to_string();

    let order = match row(
        &conn,
        "SELECT * FROM orders WHERE code = ?1",
        args(&[&code as &dyn ToSql]),
    ) {
        Some(o) => o,
        None => return Json(json!({"error": "Order not found"})),
    };
    let provider = match row(
        &conn,
        "SELECT * FROM delivery_providers WHERE id = ?1",
        args(&[&provider_id as &dyn ToSql]),
    ) {
        Some(p) => p,
        None => return Json(json!({"error": "Choose a registered delivery provider"})),
    };
    let provider_name = provider
        .get("name")
        .and_then(|v| v.as_str())
        .unwrap_or("Provider")
        .to_string();
    let id = order.get("id").and_then(|v| v.as_i64()).unwrap_or(0);
    let ts = now_iso();
    exec(
        &conn,
        "UPDATE orders SET delivery_provider_id = ?1, delivery_provider_name = ?2, rider_name = ?3,
            rider_phone = ?4, dispatch_note = ?5, dispatched_at = ?6, status = CASE WHEN status = 'placed' THEN 'confirmed' ELSE status END,
            updated_at = ?6 WHERE id = ?7",
        args(&[
            &provider_id as &dyn ToSql,
            &provider_name,
            &rider,
            &rider_phone,
            &note,
            &ts as &dyn ToSql,
            &id,
        ]),
    );
    record_admin_action(
        &conn,
        &actor,
        "assign_delivery_provider",
        "order",
        &code.clone(),
        &format!("{code} assigned to {provider_name}"),
        &note,
    );
    Json(json!({"ok": true, "provider": provider_name, "rider": rider}))
}

async fn admin_create_dispute(State(state): S, Json(body): Json<Value>) -> Json<Value> {
    let conn = state.db.lock().unwrap();
    let order_code = body
        .get("orderCode")
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_string();
    let order_id = row(
        &conn,
        "SELECT id FROM orders WHERE code = ?1",
        args(&[&order_code as &dyn ToSql]),
    )
    .and_then(|r| r.get("id").and_then(|v| v.as_i64()));
    exec(
        &conn,
        "INSERT INTO disputes (order_id, store_id, subject, detail, state, raised_by, resolution, created_at)
         VALUES (?1,NULL,?2,?3,'open',?4,NULL,?5)",
        args(&[
            &order_id as &dyn ToSql,
            &body.get("subject").and_then(|v| v.as_str()).unwrap_or("Issue with an order"),
            &body.get("detail").and_then(|v| v.as_str()).unwrap_or(""),
            &body.get("raisedBy").and_then(|v| v.as_str()).unwrap_or("customer"),
            &now_iso() as &dyn ToSql,
        ]),
    );
    Json(json!({"ok": true}))
}

async fn admin_resolve_dispute(
    State(state): S,
    Path(id): Path<i64>,
    Json(body): Json<Value>,
) -> Json<Value> {
    let conn = state.db.lock().unwrap();
    let resolution = body
        .get("resolution")
        .and_then(|v| v.as_str())
        .unwrap_or("Resolved")
        .to_string();
    exec(
        &conn,
        "UPDATE disputes SET resolution = ?1, state = 'resolved' WHERE id = ?2",
        args(&[&resolution as &dyn ToSql, &id as &dyn ToSql]),
    );
    record_admin_action(
        &conn,
        "Mall Admin",
        "resolve_dispute",
        "dispute",
        &id.to_string(),
        &resolution,
        "",
    );
    Json(json!({"ok": true}))
}

async fn admin_create_promotion(State(state): S, Json(body): Json<Value>) -> Json<Value> {
    let conn = state.db.lock().unwrap();
    let name = body
        .get("name")
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_string();
    if name.is_empty() {
        return Json(json!({"error": "Promotion needs a name"}));
    }
    let scope_type = body
        .get("scopeType")
        .and_then(|v| v.as_str())
        .unwrap_or("aisle")
        .to_string();
    let scope_id = body.get("scopeId").and_then(|v| v.as_str()).unwrap_or("");
    let pct = body.get("pct").and_then(|v| v.as_f64()).unwrap_or(0.0);
    let budget = body.get("budgetPula").and_then(|v| v.as_f64()).unwrap_or(0.0);
    let funded_by = body
        .get("fundedBy")
        .and_then(|v| v.as_str())
        .unwrap_or("Morua Junction")
        .to_string();
    exec(
        &conn,
        "INSERT INTO promotions (name, scope_type, scope_id, pct, amount_pula, funded_by, budget_pula,
            spent_pula, state, starts_at, ends_at) VALUES (?1,?2,?3,?4,0,?5,?6,0,'live',?7,?8)",
        args(&[
            &name as &dyn ToSql,
            &scope_type,
            &scope_id,
            &pct as &dyn ToSql,
            &funded_by,
            &budget as &dyn ToSql,
            &crate::timeutil::date_offset(0) as &dyn ToSql,
            &crate::timeutil::date_offset(30) as &dyn ToSql,
        ]),
    );
    record_admin_action(
        &conn,
        &funded_by,
        "create_promotion",
        "promotion",
        &last_id(&conn).to_string(),
        &format!("{name} — {pct}% funded by {funded_by}"),
        "",
    );
    Json(json!({"ok": true}))
}

async fn admin_actions(State(state): S) -> Json<Value> {
    let conn = state.db.lock().unwrap();
    let list = rows(
        &conn,
        "SELECT * FROM admin_actions ORDER BY id DESC LIMIT 100",
        &[],
    );
    Json(json!({"actions": list}))
}

async fn ledger_view(State(state): S) -> Json<Value> {
    let conn = state.db.lock().unwrap();
    Json(json!({
        "balances": ledger::balances(&conn),
        "entries": ledger::recent_entries(&conn, 80),
    }))
}
