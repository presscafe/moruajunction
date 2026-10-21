//! SQLite access layer. The whole marketplace state lives in one file.

use rusqlite::types::{ToSqlOutput, ValueRef};
use rusqlite::{Connection, Row};
use serde_json::{json, Map, Value};

pub type Db = Connection;

/// Convert a query row into a JSON object keyed by column name.
pub fn row_to_json(row: &Row) -> Value {
    let mut map = Map::new();
    let names: Vec<String> = row.as_ref().column_names().into_iter().map(String::from).collect();
    for (i, name) in names.iter().enumerate() {
        let value = match row.get_ref(i) {
            Ok(ValueRef::Null) => Value::Null,
            Ok(ValueRef::Integer(n)) => Value::from(n),
            Ok(ValueRef::Real(f)) => Value::from(f),
            Ok(ValueRef::Text(t)) => Value::from(String::from_utf8_lossy(t).to_string()),
            Ok(ValueRef::Blob(b)) => Value::from(String::from_utf8_lossy(b).to_string()),
            Err(_) => Value::Null,
        };
        map.insert(name.clone(), value);
    }
    Value::Object(map)
}

/// Run a query and return every row as JSON objects.
pub fn rows(conn: &Db, sql: &str, params: &[&dyn ToSqlOutput]) -> Vec<Value> {
    let mut stmt = match conn.prepare(sql) {
        Ok(s) => s,
        Err(e) => {
            eprintln!("prepare failed: {e}\n{sql}");
            return Vec::new();
        }
    };
    let names: Vec<String> = stmt.column_names().into_iter().map(String::from).collect();
    let mut out = Vec::new();
    let mut query = match stmt.query(params) {
        Ok(q) => q,
        Err(e) => {
            eprintln!("query failed: {e}\n{sql}");
            return Vec::new();
        }
    };
    while let Ok(Some(row)) = query.next() {
        let mut map = Map::new();
        for (i, name) in names.iter().enumerate() {
            let value = match row.get_ref(i) {
                Ok(ValueRef::Null) => Value::Null,
                Ok(ValueRef::Integer(n)) => Value::from(n),
                Ok(ValueRef::Real(f)) => Value::from(f),
                Ok(ValueRef::Text(t)) => Value::from(String::from_utf8_lossy(t).to_string()),
                Ok(ValueRef::Blob(b)) => Value::from(String::from_utf8_lossy(b).to_string()),
                Err(_) => Value::Null,
            };
            map.insert(name.clone(), value);
        }
        out.push(Value::Object(map));
    }
    out
}

/// Run a query and return the first row, if any.
pub fn row(conn: &Db, sql: &str, params: &[&dyn ToSqlOutput]) -> Option<Value> {
    rows(conn, sql, params).into_iter().next()
}

/// Count of rows matching a query.
pub fn count(conn: &Db, sql: &str, params: &[&dyn ToSqlOutput]) -> i64 {
    row(conn, sql, params)
        .and_then(|v| v.get("c").and_then(|c| c.as_i64()))
        .unwrap_or(0)
}

/// Execute a statement, returning the number of rows changed.
pub fn exec(conn: &Db, sql: &str, params: &[&dyn ToSqlOutput]) -> usize {
    match conn.execute(sql, params) {
        Ok(n) => n,
        Err(e) => {
            eprintln!("exec failed: {e}\n{sql}");
            0
        }
    }
}

/// Last inserted row id for the most recent insert on this connection.
pub fn last_id(conn: &Db) -> i64 {
    conn.last_insert_rowid()
}

/// Helper to build a JSON number field safely.
pub fn num(v: Option<Value>) -> f64 {
    v.and_then(|x| x.as_f64()).unwrap_or(0.0)
}

/// Helper to read a string field safely.
pub fn text(v: Option<&Value>, key: &str) -> String {
    v.and_then(|x| x.get(key))
        .and_then(|x| x.as_str())
        .unwrap_or("")
        .to_string()
}

pub fn empty_object() -> Value {
    json!({})
}
