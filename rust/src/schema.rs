//! Database schema and migrations.

use rusqlite::Connection;

pub fn migrate(conn: &Connection) {
    conn.execute_batch(
        r#"
        PRAGMA journal_mode = WAL;
        PRAGMA foreign_keys = ON;

        CREATE TABLE IF NOT EXISTS floors (
            id INTEGER PRIMARY KEY, code TEXT UNIQUE NOT NULL, name TEXT NOT NULL,
            tagline TEXT NOT NULL, town TEXT NOT NULL DEFAULT 'Gaborone',
            sort INTEGER NOT NULL DEFAULT 0);

        CREATE TABLE IF NOT EXISTS aisles (
            id INTEGER PRIMARY KEY, floor_id INTEGER NOT NULL REFERENCES floors(id),
            code TEXT NOT NULL, name TEXT NOT NULL, blurb TEXT NOT NULL, sort INTEGER NOT NULL DEFAULT 0);

        CREATE TABLE IF NOT EXISTS stores (
            id INTEGER PRIMARY KEY, slug TEXT UNIQUE NOT NULL, name TEXT NOT NULL,
            aisle_id INTEGER REFERENCES aisles(id), kind TEXT NOT NULL DEFAULT 'retailer',
            tagline TEXT NOT NULL, story TEXT NOT NULL, accent TEXT NOT NULL, accent_soft TEXT NOT NULL,
            icon TEXT NOT NULL, banner TEXT NOT NULL, area TEXT NOT NULL, address TEXT NOT NULL,
            phone TEXT NOT NULL, hours TEXT NOT NULL, return_policy TEXT NOT NULL,
            delivery_promise TEXT NOT NULL, verified_status TEXT NOT NULL DEFAULT 'pending',
            verified_at TEXT, verified_by TEXT, rating REAL NOT NULL DEFAULT 0,
            review_count INTEGER NOT NULL DEFAULT 0, fulfilment_accuracy REAL NOT NULL DEFAULT 0,
            median_prep_minutes INTEGER NOT NULL DEFAULT 90, tags TEXT NOT NULL DEFAULT '[]',
            staff TEXT NOT NULL DEFAULT '[]', sections TEXT NOT NULL DEFAULT '[]',
            card_stamps INTEGER NOT NULL DEFAULT 0, card_target INTEGER NOT NULL DEFAULT 8,
            town TEXT NOT NULL DEFAULT 'Gaborone', district TEXT NOT NULL DEFAULT 'Central',
            region TEXT NOT NULL DEFAULT 'South-East',
            unit_label TEXT NOT NULL DEFAULT '', unit_x REAL NOT NULL DEFAULT 0.5,
            unit_y REAL NOT NULL DEFAULT 0.5, opened_on TEXT NOT NULL,
            approval_status TEXT NOT NULL DEFAULT 'pending', approval_note TEXT NOT NULL DEFAULT '',
            approved_at TEXT, approved_by TEXT, markup_pct REAL NOT NULL DEFAULT 0,
            markup_note TEXT NOT NULL DEFAULT '', markup_set_by TEXT, markup_set_at TEXT);

        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY, sku TEXT UNIQUE NOT NULL, store_id INTEGER NOT NULL REFERENCES stores(id),
            name TEXT NOT NULL, blurb TEXT NOT NULL, match_key TEXT NOT NULL, category TEXT NOT NULL,
            unit TEXT NOT NULL DEFAULT 'each', icon TEXT NOT NULL DEFAULT '📦',
            price_pula REAL NOT NULL, was_price_pula REAL, sa_price_zar REAL NOT NULL,
            weight_kg REAL NOT NULL DEFAULT 0.5, duty_rate REAL NOT NULL DEFAULT 0,
            origin TEXT NOT NULL DEFAULT 'Imported', stock INTEGER NOT NULL DEFAULT 0,
            stock_synced_at TEXT, rating REAL NOT NULL DEFAULT 0, review_count INTEGER NOT NULL DEFAULT 0,
            sold_count INTEGER NOT NULL DEFAULT 0, is_special INTEGER NOT NULL DEFAULT 0,
            special_pula REAL, tags TEXT NOT NULL DEFAULT '[]', active INTEGER NOT NULL DEFAULT 1);

        CREATE TABLE IF NOT EXISTS delivery_providers (
            id INTEGER PRIMARY KEY, name TEXT NOT NULL, contact TEXT NOT NULL,
            vehicle TEXT NOT NULL, areas TEXT NOT NULL, rating REAL NOT NULL DEFAULT 0,
            commission_pct REAL NOT NULL DEFAULT 0, active INTEGER NOT NULL DEFAULT 1,
            registered_on TEXT NOT NULL, license_ref TEXT NOT NULL DEFAULT '',
            notes TEXT NOT NULL DEFAULT '');

        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY, code TEXT UNIQUE NOT NULL, customer_name TEXT NOT NULL,
            customer_phone TEXT NOT NULL, customer_area TEXT NOT NULL, fulfilment TEXT NOT NULL,
            status TEXT NOT NULL, payment_method TEXT NOT NULL, payment_state TEXT NOT NULL DEFAULT 'authorised',
            escrow_state TEXT NOT NULL DEFAULT 'held', subtotal_pula REAL NOT NULL,
            delivery_pula REAL NOT NULL, service_pula REAL NOT NULL, total_pula REAL NOT NULL,
            saved_pula REAL NOT NULL DEFAULT 0, address TEXT NOT NULL, notes TEXT NOT NULL DEFAULT '',
            rider_name TEXT, rider_phone TEXT, eta_minutes INTEGER, placed_at TEXT NOT NULL,
            updated_at TEXT NOT NULL, delivery_provider_id INTEGER REFERENCES delivery_providers(id),
            delivery_provider_name TEXT, dispatch_note TEXT, dispatched_at TEXT,
            collect_point TEXT NOT NULL DEFAULT '');

        CREATE TABLE IF NOT EXISTS order_items (
            id INTEGER PRIMARY KEY, order_id INTEGER NOT NULL REFERENCES orders(id),
            product_id INTEGER NOT NULL REFERENCES products(id), store_id INTEGER NOT NULL REFERENCES stores(id),
            qty INTEGER NOT NULL, unit_price_pula REAL NOT NULL, line_total_pula REAL NOT NULL,
            commission_pula REAL NOT NULL, seller_net_pula REAL NOT NULL, markup_pula REAL NOT NULL DEFAULT 0);

        CREATE TABLE IF NOT EXISTS ledger_entries (
            id INTEGER PRIMARY KEY, ts TEXT NOT NULL, order_id INTEGER, account TEXT NOT NULL,
            direction TEXT NOT NULL, amount_pula REAL NOT NULL, kind TEXT NOT NULL, memo TEXT NOT NULL DEFAULT '');

        CREATE TABLE IF NOT EXISTS payouts (
            id INTEGER PRIMARY KEY, store_id INTEGER NOT NULL REFERENCES stores(id), period TEXT NOT NULL,
            orders INTEGER NOT NULL, gross_pula REAL NOT NULL, commission_pula REAL NOT NULL,
            net_pula REAL NOT NULL, state TEXT NOT NULL DEFAULT 'scheduled', created_at TEXT NOT NULL);

        CREATE TABLE IF NOT EXISTS reviews (
            id INTEGER PRIMARY KEY, store_id INTEGER NOT NULL REFERENCES stores(id), product_id INTEGER,
            author TEXT NOT NULL, rating REAL NOT NULL, body TEXT NOT NULL, created_at TEXT NOT NULL);

        CREATE TABLE IF NOT EXISTS disputes (
            id INTEGER PRIMARY KEY, order_id INTEGER REFERENCES orders(id), store_id INTEGER REFERENCES stores(id),
            subject TEXT NOT NULL, detail TEXT NOT NULL, state TEXT NOT NULL DEFAULT 'open',
            raised_by TEXT NOT NULL, resolution TEXT, created_at TEXT NOT NULL);

        CREATE TABLE IF NOT EXISTS promotions (
            id INTEGER PRIMARY KEY, name TEXT NOT NULL, scope_type TEXT NOT NULL, scope_id INTEGER,
            pct REAL NOT NULL DEFAULT 0, amount_pula REAL NOT NULL DEFAULT 0, funded_by TEXT NOT NULL,
            budget_pula REAL NOT NULL DEFAULT 0, spent_pula REAL NOT NULL DEFAULT 0,
            state TEXT NOT NULL DEFAULT 'live', starts_at TEXT NOT NULL, ends_at TEXT NOT NULL);

        CREATE TABLE IF NOT EXISTS admin_actions (
            id INTEGER PRIMARY KEY, ts TEXT NOT NULL, actor TEXT NOT NULL, action TEXT NOT NULL,
            target_type TEXT NOT NULL, target_id TEXT NOT NULL, detail TEXT NOT NULL DEFAULT '',
            reason TEXT NOT NULL DEFAULT '');

        CREATE TABLE IF NOT EXISTS notifications (
            id INTEGER PRIMARY KEY, ts TEXT NOT NULL, store_id INTEGER REFERENCES stores(id),
            kind TEXT NOT NULL, title TEXT NOT NULL, body TEXT NOT NULL, read INTEGER NOT NULL DEFAULT 0);

        CREATE TABLE IF NOT EXISTS platform_config (key TEXT PRIMARY KEY, value TEXT NOT NULL);

        CREATE INDEX IF NOT EXISTS idx_products_store ON products(store_id);
        CREATE INDEX IF NOT EXISTS idx_products_match ON products(match_key);
        CREATE INDEX IF NOT EXISTS idx_items_order ON order_items(order_id);
        CREATE INDEX IF NOT EXISTS idx_ledger_ts ON ledger_entries(ts);
        "#,
    )
    .expect("schema");

    // Additive migrations for databases created by an earlier build.
    let additions: &[(&str, &[(&str, &str)])] = &[
        (
            "stores",
            &[
                ("approval_status", "TEXT NOT NULL DEFAULT 'pending'"),
                ("approval_note", "TEXT NOT NULL DEFAULT ''"),
                ("approved_at", "TEXT"),
                ("approved_by", "TEXT"),
                ("markup_pct", "REAL NOT NULL DEFAULT 0"),
                ("markup_note", "TEXT NOT NULL DEFAULT ''"),
                ("markup_set_by", "TEXT"),
                ("markup_set_at", "TEXT"),
            ],
        ),
        (
            "floors",
            &[("town", "TEXT NOT NULL DEFAULT 'Gaborone'")],
        ),
        (
            "stores",
            &[
                ("town", "TEXT NOT NULL DEFAULT 'Gaborone'"),
                ("district", "TEXT NOT NULL DEFAULT 'Central'"),
                ("region", "TEXT NOT NULL DEFAULT 'South-East'"),
            ],
        ),
        (
            "orders",
            &[
                ("delivery_provider_id", "INTEGER"),
                ("delivery_provider_name", "TEXT"),
                ("dispatch_note", "TEXT"),
                ("dispatched_at", "TEXT"),
                ("collect_point", "TEXT NOT NULL DEFAULT ''"),
            ],
        ),
    ];
    for (table, cols) in additions {
        let mut stmt = conn
            .prepare(&format!("PRAGMA table_info({table})"))
            .expect("table_info");
        let existing: Vec<String> = stmt
            .query_map([], |r| r.get::<_, String>(1))
            .expect("table_info rows")
            .filter_map(|x| x.ok())
            .collect();
        for (name, decl) in cols.iter() {
            if !existing.iter().any(|e| e == name) {
                let _ = conn.execute_batch(&format!("ALTER TABLE {table} ADD COLUMN {name} {decl};"));
            }
        }
    }
}
