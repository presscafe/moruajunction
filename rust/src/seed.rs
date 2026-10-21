//! Seeds the mall from the embedded dataset and registers delivery providers.

use rusqlite::params;
use serde_json::Value;

use crate::db::Db;
use crate::timeutil::{date_offset, now_iso};

const DATASET: &str = include_str!("../seed/morua.json");

struct ProviderSeed {
    name: &'static str,
    contact: &'static str,
    vehicle: &'static str,
    areas: &'static str,
    rating: f64,
    commission_pct: f64,
    license_ref: &'static str,
    notes: &'static str,
}

/// Registered delivery service providers. The admin chooses which one
/// carries each order — there is no auction.
const PROVIDERS: &[ProviderSeed] = &[
    ProviderSeed {
        name: "Gaborone Express Couriers",
        contact: "+267 71 400 220",
        vehicle: "Cars & light vans",
        areas: "Gaborone Central, Gaborone West, Kgale, Block B",
        rating: 4.7,
        commission_pct: 12.0,
        license_ref: "BTO/LIC/2024/0117",
        notes: "Insured fleet, largest capacity in the capital. Handles bulky baskets.",
    },
    ProviderSeed {
        name: "Metsi Same-Day Riders",
        contact: "+267 72 618 004",
        vehicle: "Motorbikes",
        areas: "Gaborone Central, Block B, Kgale, Village",
        rating: 4.8,
        commission_pct: 10.0,
        license_ref: "BTO/LIC/2025/0342",
        notes: "Fastest in the inner ring. Cannot carry items over 8kg.",
    },
    ProviderSeed {
        name: "Orion Rider Collective",
        contact: "+267 73 905 331",
        vehicle: "E-scooters & bicycles",
        areas: "Village, Phakalane, Extension 10, Gaborone West",
        rating: 4.6,
        commission_pct: 9.0,
        license_ref: "BTO/LIC/2025/0518",
        notes: "Electric fleet, low running cost. No cargo over 5kg.",
    },
    ProviderSeed {
        name: "Kalahari Freight & Logistics",
        contact: "+267 62 118 770",
        vehicle: "Trucks & cargo vans",
        areas: "Nationwide Botswana",
        rating: 4.3,
        commission_pct: 14.0,
        license_ref: "BTO/LIC/2023/0904",
        notes: "Only provider authorised outside Gaborone. Slower but handles furniture.",
    },
    ProviderSeed {
        name: "Tlokweng Route Riders",
        contact: "+267 71 233 560",
        vehicle: "Vans",
        areas: "Tlokweng, Motswedi, Ramokgwebana, Gaborone North",
        rating: 4.4,
        commission_pct: 11.0,
        license_ref: "BTO/LIC/2024/0688",
        notes: "Covers the northern and western routes out of Gaborone.",
    },
];

pub fn seed(conn: &Db) {
    let count: i64 = conn
        .query_row("SELECT COUNT(*) FROM stores", [], |r| r.get(0))
        .unwrap_or(0);
    if count == 0 {
        load_dataset(conn);
    }
    seed_providers(conn);
}

fn seed_providers(conn: &Db) {
    let count: i64 = conn
        .query_row("SELECT COUNT(*) FROM delivery_providers", [], |r| r.get(0))
        .unwrap_or(0);
    if count > 0 {
        return;
    }
    for p in PROVIDERS {
        let _ = conn.execute(
            "INSERT INTO delivery_providers (name, contact, vehicle, areas, rating, commission_pct, active, registered_on, license_ref, notes)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, 1, ?7, ?8, ?9)",
            params![
                p.name,
                p.contact,
                p.vehicle,
                p.areas,
                p.rating,
                p.commission_pct,
                date_offset(-240),
                p.license_ref,
                p.notes
            ],
        );
    }
}

fn load_dataset(conn: &Db) {
    let data: Value = serde_json::from_str(DATASET).expect("embedded seed dataset");
    let empty: Vec<Value> = Vec::new();
    let arr = |key: &str| -> Vec<Value> {
        data.get(key)
            .and_then(|v| v.as_array())
            .cloned()
            .unwrap_or(empty.clone())
    };

    for f in arr("floors") {
        let _ = conn.execute(
            "INSERT INTO floors (id, code, name, tagline, town, sort) VALUES (?1,?2,?3,?4,?5,?6)",
            params![
                f.get("id").and_then(|v| v.as_i64()).unwrap_or(0),
                f.get("code").and_then(|v| v.as_str()).unwrap_or(""),
                f.get("name").and_then(|v| v.as_str()).unwrap_or(""),
                f.get("tagline").and_then(|v| v.as_str()).unwrap_or(""),
                f.get("town").and_then(|v| v.as_str()).unwrap_or("Gaborone"),
                f.get("sort").and_then(|v| v.as_i64()).unwrap_or(0)
            ],
        );
    }

    for a in arr("aisles") {
        let floor_code = a.get("floor_id").and_then(|v| v.as_i64()).unwrap_or(0);
        let floor_id: i64 = conn
            .query_row(
                "SELECT id FROM floors WHERE id = ?1",
                params![floor_code],
                |r| r.get(0),
            )
            .unwrap_or(0);
        let _ = conn.execute(
            "INSERT INTO aisles (id, floor_id, code, name, blurb, sort) VALUES (?1,?2,?3,?4,?5,?6)",
            params![
                a.get("id").and_then(|v| v.as_i64()).unwrap_or(0),
                floor_id,
                a.get("code").and_then(|v| v.as_str()).unwrap_or(""),
                a.get("name").and_then(|v| v.as_str()).unwrap_or(""),
                a.get("blurb").and_then(|v| v.as_str()).unwrap_or(""),
                a.get("sort").and_then(|v| v.as_i64()).unwrap_or(0)
            ],
        );
    }

    for s in arr("stores") {
        let g = |k: &str| s.get(k).and_then(|v| v.as_str()).unwrap_or("").to_string();
        let n = |k: &str| s.get(k).and_then(|v| v.as_f64()).unwrap_or(0.0);
        let i = |k: &str| s.get(k).and_then(|v| v.as_i64()).unwrap_or(0);
        let aisle_id = s.get("aisle_id").and_then(|v| v.as_i64());
        let _ = conn.execute(
            "INSERT INTO stores (id, slug, name, aisle_id, kind, tagline, story, accent, accent_soft, icon, banner,
                area, address, phone, hours, return_policy, delivery_promise, verified_status, verified_at,
                verified_by, rating, review_count, fulfilment_accuracy, median_prep_minutes, tags, staff, sections,
                card_stamps, card_target, town, district, region, unit_label, unit_x, unit_y, opened_on,
                approval_status, approved_at, approved_by)
             VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14,?15,?16,?17,?18,?19,?20,?21,?22,?23,?24,?25,?26,?27,?28,?29,?30,?31,?32,?33,?34,?35,?36,?37,?38,?39)",
            params![
                i("id"), g("slug"), g("name"), aisle_id, g("kind"), g("tagline"), g("story"), g("accent"), g("accent_soft"),
                g("icon"), g("banner"), g("area"), g("address"), g("phone"), g("hours"), g("return_policy"),
                g("delivery_promise"), g("verified_status"), g("verified_at"), g("verified_by"), n("rating"),
                i("review_count"), n("fulfilment_accuracy"), i("median_prep_minutes"), g("tags"), g("staff"),
                g("sections"), i("card_stamps"), i("card_target"),
                g("town"), g("district"), g("region"),
                g("unit_label"), n("unit_x"), n("unit_y"),
                g("opened_on"),
                // A handful of shops start in the approval queue so the admin
                // console has a real queue to work on out of the box.
                match g("slug").as_str() {
                    "kabelo-bags-accessories" | "bitwise-computing-gaming" | "karabo-gems-gifts" => "pending",
                    _ => "approved",
                },
                now_iso(), "Botswana Verification Desk"
            ],
        );
    }

    for p in arr("products") {
        let g = |k: &str| p.get(k).and_then(|v| v.as_str()).unwrap_or("").to_string();
        let n = |k: &str| p.get(k).and_then(|v| v.as_f64()).unwrap_or(0.0);
        let i = |k: &str| p.get(k).and_then(|v| v.as_i64()).unwrap_or(0);
        let store_id = p.get("store_id").and_then(|v| v.as_i64()).unwrap_or(0);
        let was = p.get("was_price_pula").and_then(|v| v.as_f64());
        let special = p.get("special_pula").and_then(|v| v.as_f64());
        let _ = conn.execute(
            "INSERT INTO products (sku, store_id, name, blurb, match_key, category, unit, icon, price_pula,
                was_price_pula, sa_price_zar, weight_kg, duty_rate, origin, stock, stock_synced_at, rating,
                review_count, sold_count, is_special, special_pula, tags, active)
             VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14,?15,?16,?17,?18,?19,?20,?21,?22,1)",
            params![
                g("sku"), store_id, g("name"), g("blurb"), g("match_key"), g("category"), g("unit"), g("icon"),
                n("price_pula"), was, n("sa_price_zar"), n("weight_kg"), n("duty_rate"), g("origin"),
                i("stock"), g("stock_synced_at"), n("rating"), i("review_count"), i("sold_count"),
                i("is_special"), special, g("tags")
            ],
        );
    }

    for r in arr("reviews") {
        let _ = conn.execute(
            "INSERT INTO reviews (store_id, product_id, author, rating, body, created_at) VALUES (?1,?2,?3,?4,?5,?6)",
            params![
                r.get("store_id").and_then(|v| v.as_i64()).unwrap_or(0),
                r.get("product_id").and_then(|v| v.as_i64()),
                r.get("author").and_then(|v| v.as_str()).unwrap_or(""),
                r.get("rating").and_then(|v| v.as_f64()).unwrap_or(0.0),
                r.get("body").and_then(|v| v.as_str()).unwrap_or(""),
                r.get("created_at").and_then(|v| v.as_str()).unwrap_or("")
            ],
        );
    }

    for p in arr("promotions") {
        let _ = conn.execute(
            "INSERT INTO promotions (name, scope_type, scope_id, pct, amount_pula, funded_by, budget_pula,
                spent_pula, state, starts_at, ends_at) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11)",
            params![
                p.get("name").and_then(|v| v.as_str()).unwrap_or(""),
                p.get("scope_type").and_then(|v| v.as_str()).unwrap_or("aisle"),
                p.get("scope_id").and_then(|v| v.as_str()),
                p.get("pct").and_then(|v| v.as_f64()).unwrap_or(0.0),
                p.get("amount_pula").and_then(|v| v.as_f64()).unwrap_or(0.0),
                p.get("funded_by").and_then(|v| v.as_str()).unwrap_or("Morua Junction"),
                p.get("budget_pula").and_then(|v| v.as_f64()).unwrap_or(0.0),
                p.get("spent_pula").and_then(|v| v.as_f64()).unwrap_or(0.0),
                p.get("state").and_then(|v| v.as_str()).unwrap_or("live"),
                p.get("starts_at").and_then(|v| v.as_str()).unwrap_or(""),
                p.get("ends_at").and_then(|v| v.as_str()).unwrap_or("")
            ],
        );
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    /// The dataset points at shops and aisles by id, and the seeder has to
    /// keep those ids. When SQLite was left to number the rows itself, the
    /// stores and aisles were renumbered by array position while the
    /// products still carried the dataset ids — so every product landed on
    /// the wrong shelf and every shop stood in the wrong aisle.
    #[test]
    fn seed_keeps_the_dataset_ids() {
        let conn = rusqlite::Connection::open_in_memory().expect("in-memory database");
        crate::schema::migrate(&conn);
        seed(&conn);

        // Product 1 is "Onions 1kg", and it lives in Bonwadi Fresh Market.
        let shop: String = conn
            .query_row(
                "SELECT s.name FROM products p JOIN stores s ON s.id = p.store_id WHERE p.id = 1",
                [],
                |r| r.get(0),
            )
            .expect("product 1 belongs to a shop");
        assert_eq!(shop, "Bonwadi Fresh Market");

        // Every product sits in a shop that exists.
        let orphans: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM products p
                 LEFT JOIN stores s ON s.id = p.store_id WHERE s.id IS NULL",
                [],
                |r| r.get(0),
            )
            .unwrap_or(0);
        assert_eq!(orphans, 0, "every product must belong to a real shop");

        // Every shop stands in an aisle that exists, on a floor that exists.
        let stranded: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM stores st
                 LEFT JOIN aisles a ON a.id = st.aisle_id
                 LEFT JOIN floors f ON f.id = a.floor_id
                 WHERE st.aisle_id IS NOT NULL AND (a.id IS NULL OR f.id IS NULL)",
                [],
                |r| r.get(0),
            )
            .unwrap_or(0);
        assert_eq!(stranded, 0, "every shop must stand in a real aisle");

        // The aisle is the one the dataset declares: a fresh market stands
        // in Fresh Produce, not in Groceries.
        let (code, name): (String, String) = conn
            .query_row(
                "SELECT a.code, a.name FROM products p
                 JOIN stores s ON s.id = p.store_id
                 JOIN aisles a ON a.id = s.aisle_id
                 WHERE p.id = 1",
                [],
                |r| Ok((r.get(0)?, r.get(1)?)),
            )
            .expect("product 1 stands in an aisle");
        assert_eq!(code, "A2");
        assert_eq!(name, "Fresh Produce");
    }
}
