//! Small time helpers — ISO-8601 timestamps without pulling in a date crate.

use std::time::{SystemTime, UNIX_EPOCH};

/// Days from 1970-01-01 to the given civil date (Howard Hinnant's algorithm).
fn days_from_civil(y: i64, m: i64, d: i64) -> i64 {
    let y = if m <= 2 { y - 1 } else { y };
    let era = if y >= 0 { y } else { y - 399 } / 400;
    let yoe = y - era * 400;
    let mp = (m + 9) % 12;
    let doy = (153 * mp + 2) / 5 + d - 1;
    let doe = yoe * 365 + yoe / 4 - yoe / 100 + doy;
    era * 146097 + doe - 719468
}

fn civil_from_days(z: i64) -> (i64, i64, i64) {
    let z = z + 719468;
    let era = if z >= 0 { z } else { z - 146096 } / 146097;
    let doe = z - era * 146097;
    let yoe = (doe - doe / 1460 + doe / 36524 - doe / 146096) / 365;
    let y = yoe + era * 400;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153;
    let d = doy - (153 * mp + 2) / 5 + 1;
    let m = if mp < 10 { mp + 3 } else { mp - 9 };
    (if m <= 2 { y + 1 } else { y }, m, d)
}

fn unix_to_iso(secs: i64) -> String {
    let days = secs.div_euclid(86_400);
    let rem = secs.rem_euclid(86_400);
    let (y, m, d) = civil_from_days(days);
    format!(
        "{:04}-{:02}-{:02}T{:02}:{:02}:{:02}Z",
        y,
        m,
        d,
        rem / 3600,
        (rem % 3600) / 60,
        rem % 60
    )
}

/// Nanoseconds since the epoch — used to make order codes collision-free.
pub fn now_nanos() -> u128 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_nanos())
        .unwrap_or(0)
}

/// Current UTC time as an ISO-8601 string.
pub fn now_iso() -> String {
    let secs = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs() as i64)
        .unwrap_or(0);
    unix_to_iso(secs)
}

/// A date offset from today, as `YYYY-MM-DD`.
pub fn date_offset(days: i64) -> String {
    let secs = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs() as i64)
        .unwrap_or(0);
    let (y, m, d) = civil_from_days(secs.div_euclid(86_400) + days);
    format!("{:04}-{:02}-{:02}", y, m, d)
}

/// Minutes between two ISO timestamps, or `None` if either is missing.
pub fn minutes_between(then: &str, now: &str) -> Option<i64> {
    fn parse(ts: &str) -> Option<i64> {
        let b = ts.as_bytes();
        if b.len() < 19 {
            return None;
        }
        let num = |a: usize, z: usize| -> Option<i64> { ts.get(a..z)?.parse::<i64>().ok() };
        let (y, mo, d) = (num(0, 4)?, num(5, 7)?, num(8, 10)?);
        let (h, mi, s) = (num(11, 13)?, num(14, 16)?, num(17, 19)?);
        Some(days_from_civil(y, mo, d) * 86_400 + h * 3600 + mi * 60 + s)
    }
    let a = parse(then)?;
    let b = parse(now)?;
    Some((b - a) / 60)
}
