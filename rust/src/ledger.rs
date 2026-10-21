//! Keeper's Ledger — the platform's double-entry book.
//!
//! Accounts:
//!   platform_cash   cash held and paid out by the platform
//!   escrow_held      buyer funds held until the order is delivered
//!   revenue          commission, admin markup and buyer service fees
//!   delivery_costs   amounts payable to delivery service providers
//!   seller_payable   amounts owed to shops
//!
//! Every posting is checked: debits must equal credits.

use rusqlite::params;
use serde_json::{json, Value};

use crate::db::{rows, Db};
use crate::pricing::round2;

pub const ACCOUNTS: &[&str] = &[
    "platform_cash",
    "escrow_held",
    "revenue",
    "delivery_costs",
    "seller_payable",
];

pub struct Entry {
    pub ts: String,
    pub order_id: Option<i64>,
    pub account: String,
    pub direction: String,
    pub amount_pula: f64,
    pub kind: String,
    pub memo: String,
}

/// Post a balanced set of entries. Panics if the set would not balance.
pub fn post(conn: &Db, entries: &[Entry]) -> bool {
    let debit: f64 = entries
        .iter()
        .filter(|e| e.direction == "debit")
        .map(|e| e.amount_pula)
        .sum();
    let credit: f64 = entries
        .iter()
        .filter(|e| e.direction == "credit")
        .map(|e| e.amount_pula)
        .sum();
    if (debit - credit).abs() > 0.01 {
        eprintln!("ledger would not balance: debit {debit} vs credit {credit}");
        return false;
    }
    for e in entries {
        let _ = conn.execute(
            "INSERT INTO ledger_entries (ts, order_id, account, direction, amount_pula, kind, memo)
             VALUES (?1,?2,?3,?4,?5,?6,?7)",
            params![e.ts, e.order_id, e.account, e.direction, round2(e.amount_pula), e.kind, e.memo],
        );
    }
    true
}

pub fn balances(conn: &Db) -> Vec<Value> {
    let raw = rows(
        conn,
        "SELECT account,
                SUM(CASE WHEN direction='debit' THEN amount_pula ELSE 0 END) AS debit,
                SUM(CASE WHEN direction='credit' THEN amount_pula ELSE 0 END) AS credit
         FROM ledger_entries GROUP BY account",
        &[],
    );
    let mut out = Vec::new();
    for account in ACCOUNTS {
        let found = raw
            .iter()
            .find(|r| r.get("account").and_then(|v| v.as_str()) == Some(*account));
        let debit = found
            .and_then(|r| r.get("debit"))
            .and_then(|v| v.as_f64())
            .unwrap_or(0.0);
        let credit = found
            .and_then(|r| r.get("credit"))
            .and_then(|v| v.as_f64())
            .unwrap_or(0.0);
        out.push(json!({
            "account": account,
            "debit": round2(debit),
            "credit": round2(credit),
            "balance": round2(debit - credit),
        }));
    }
    out
}

pub fn recent_entries(conn: &Db, limit: i64) -> Vec<Value> {
    rows(
        conn,
        "SELECT * FROM ledger_entries ORDER BY id DESC LIMIT ?1",
        &[&limit as &dyn rusqlite::types::ToSqlOutput],
    )
}

pub fn entries_for_order(conn: &Db, order_id: i64) -> Vec<Value> {
    rows(
        conn,
        "SELECT * FROM ledger_entries WHERE order_id = ?1 ORDER BY id",
        &[&order_id as &dyn rusqlite::types::ToSqlOutput],
    )
}
