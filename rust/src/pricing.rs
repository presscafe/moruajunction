//! Morua Junction pricing engines.
//!
//! These are the platform's own built-in functionality. Money is always
//! computed here on the server; the client never decides a price.

use serde_json::{json, Value};

/// Pula is pegged to the US dollar; the Rand has weakened against it.
pub const ZAR_TO_PULA: f64 = 1.35;
/// BURS standard VAT rate on imported goods.
pub const IMPORT_VAT_RATE: f64 = 0.14;
/// Forwarder handling and road freight into Gaborone, amortised per item.
pub const FREIGHT_BASE_PULA: f64 = 45.0;
pub const FREIGHT_PER_KG_PULA: f64 = 28.0;
pub const CLEARING_FEE_PULA: f64 = 60.0;
/// A single item only makes sense to ship if the landed cost stays near the shelf price.
pub const CROSS_BORDER_VIABLE_MAX_MULTIPLE: f64 = 2.2;
pub const CROSS_BORDER_LEAD_DAYS_MIN: i64 = 7;
pub const CROSS_BORDER_LEAD_DAYS_MAX: i64 = 14;

/// Base platform commission on the seller's own price.
pub const COMMISSION_RATE: f64 = 0.10;
/// Buyer-facing service fee, capped so it never dominates a small basket.
pub const SERVICE_FEE_RATE: f64 = 0.03;
pub const SERVICE_FEE_CAP_PULA: f64 = 15.0;
/// Basket value above which delivery is free.
pub const FREE_DELIVERY_THRESHOLD_PULA: f64 = 350.0;

pub fn round2(n: f64) -> f64 {
    (n * 100.0).round() / 100.0
}

/// Land Local — what the identical item costs landed from South Africa.
pub fn landed_quote(local_pula: f64, sa_price_zar: f64, weight_kg: f64, duty_rate: f64) -> Value {
    let sa_pula = round2(sa_price_zar * ZAR_TO_PULA);
    let freight = round2(FREIGHT_BASE_PULA + weight_kg * FREIGHT_PER_KG_PULA);
    let customs_value = round2(sa_pula + freight);
    let duty = round2(customs_value * duty_rate);
    let vat = round2((customs_value + duty) * IMPORT_VAT_RATE);
    let landed = round2(customs_value + duty + vat + CLEARING_FEE_PULA);
    let saving = round2(landed - local_pula);
    let saving_pct = if landed > 0.0 { (saving / landed * 100.0).round() as i64 } else { 0 };
    let multiple = if sa_pula > 0.0 { round2(landed / sa_pula) } else { 0.0 };

    json!({
        "localPula": round2(local_pula),
        "saPula": sa_pula,
        "freightPula": freight,
        "dutyPula": duty,
        "vatPula": vat,
        "clearingPula": CLEARING_FEE_PULA,
        "landedPula": landed,
        "savingPula": saving,
        "savingPct": saving_pct,
        "leadDaysMin": CROSS_BORDER_LEAD_DAYS_MIN,
        "leadDaysMax": CROSS_BORDER_LEAD_DAYS_MAX,
        "localWins": saving > 0.0,
        "landedMultiple": multiple,
        "crossBorderViable": multiple > 0.0 && multiple <= CROSS_BORDER_VIABLE_MAX_MULTIPLE,
    })
}

/// SACU Common External Tariff reference rates by HS chapter.
pub fn duty_for_category(category: &str) -> f64 {
    match category {
        "Groceries & Staples" => 0.0,
        "Fresh Produce" => 0.0,
        "Bakery & Deli" => 0.0,
        "Beverages & Cellar" => 0.20,
        "Home & Kitchen" => 0.15,
        "Household & Cleaning" => 0.20,
        "Health & Beauty" => 0.25,
        "Hardware & DIY" => 0.12,
        "Fashion" => 0.45,
        "Footwear" => 0.45,
        "Bags & Accessories" => 0.45,
        "Jewellery & Gifts" => 0.20,
        "Mobile & Tablets" => 0.0,
        "Audio & TV" => 0.0,
        "Computing & Gaming" => 0.0,
        "Accessories" => 0.10,
        _ => 0.15,
    }
}

/// Gaborone delivery zones measured from the Morua Junction hub in Gaborone West.
pub const ZONES: &[(&str, f64)] = &[
    // Metro — the Pula Promise bands
    ("Gaborone Central", 3.0),
    ("Block B", 5.0),
    ("Kgale", 6.0),
    ("Extension 10", 7.0),
    ("Gaborone West", 8.0),
    ("Village", 9.0),
    ("Phakalane", 9.0),
    ("Gaborone North", 13.0),
    ("Ramokgwebana", 14.0),
    ("Ramotswa", 15.0),
    ("Mogoditshane", 15.0),
    ("Tlokweng", 16.0),
    ("Motswedi", 18.0),
    ("Gaborone South", 19.0),
    ("Thapong", 22.0),
    ("Mmabatho", 25.0),
    // Southern corridor
    ("Gabane", 40.0),
    ("Oodi", 30.0),
    ("Mmakau", 30.0),
    ("Mochudi", 100.0),
    ("Kanye", 90.0),
    ("Good Hope", 100.0),
    ("Tswapong", 85.0),
    ("Lobatse", 75.0),
    ("Tsabong", 300.0),
    ("Jwaneng", 260.0),
    ("Ghanzi", 250.0),
    ("Mababe", 200.0),
    ("Mooka", 100.0),
    // Central and southern
    ("Serowe", 220.0),
    ("Sipholokwe", 230.0),
    ("Mahalapye", 150.0),
    ("Palapye", 190.0),
    ("Letlhakeng", 160.0),
    ("Moshupa", 130.0),
    ("Silume", 130.0),
    ("Otse", 130.0),
    ("Borwa", 130.0),
    ("Pitsani", 250.0),
    // North-east
    ("Selebi Phikwe", 460.0),
    ("Francistown", 440.0),
    ("Tsumeb", 490.0),
    ("Orapa", 460.0),
    ("Berea", 470.0),
    ("Tutume", 420.0),
    ("Nata", 600.0),
    // North-west
    ("Maun", 900.0),
    ("Kasane", 1000.0),
    ("Kazungula", 1005.0),
    ("Gweta", 900.0),
    ("Shakawe", 950.0),
    ("Durabans", 920.0),
];

/// The band a distance falls into: flat fee, promised window and the basket
/// value at which the ride becomes free.
pub fn band_for(km: f64) -> (&'static str, f64, i64, i64, f64) {
    if km <= 5.0 {
        ("Pula Promise · Zone 1 · up to 5 km", 25.0, 60, 90, 350.0)
    } else if km <= 10.0 {
        ("Pula Promise · Zone 2 · 5–10 km", 35.0, 90, 150, 350.0)
    } else if km <= 20.0 {
        ("Pula Promise · Zone 3 · 10–20 km", 50.0, 150, 240, 350.0)
    } else if km <= 60.0 {
        ("Zone 4 · 20–60 km", 120.0, 1440, 2880, 600.0)
    } else if km <= 120.0 {
        ("Zone 5 · 60–120 km", 170.0, 1440, 2880, 600.0)
    } else if km <= 250.0 {
        ("Zone 6 · 120–250 km", 230.0, 2880, 4320, 1200.0)
    } else if km <= 500.0 {
        ("Zone 7 · 250–500 km", 300.0, 4320, 7200, 1200.0)
    } else {
        ("Zone 8 · beyond 500 km", 380.0, 5760, 10080, 1200.0)
    }
}

/// Pula Promise — honest, published delivery pricing and timing.
pub fn delivery_quote(area: &str, subtotal_pula: f64) -> Value {
    let cleaned = area.trim().to_lowercase();
    let exact = ZONES.iter().find(|(name, _)| name.to_lowercase() == cleaned);
    let partial = ZONES
        .iter()
        .find(|(name, _)| cleaned.contains(&name.to_lowercase()) || name.to_lowercase().contains(&cleaned));
    let found = exact.or(partial);

    let (km, band, fee, eta_min, eta_max, free_above) = match found {
        None => (
            90.0,
            "Zone 5 · 60–120 km".to_string(),
            170.0,
            1440,
            2880,
            600.0,
        ),
        Some((_, km)) => {
            let (label, fee, min, max, free) = band_for(*km);
            (*km, label.to_string(), fee, min, max, free)
        }
    };

    let free_applied = subtotal_pula >= free_above;
    let fee_pula = if free_applied { 0.0 } else { fee };
    let note = if free_applied {
        format!("Delivery is free on baskets over P{}", free_above as i64)
    } else {
        format!(
            "P{} flat, quoted up front — never a surprise at checkout",
            fee as i64
        )
    };

    json!({
        "zone": found.map(|(n, _)| *n).unwrap_or("Outside the network"),
        "km": km,
        "band": band,
        "feePula": fee_pula,
        "etaMin": eta_min,
        "etaMax": eta_max,
        "freeApplied": free_applied,
        "available": true,
        "note": note,
    })
}

pub fn price_band(match_key: &str, own_price: f64, peer_prices: &[f64]) -> Value {
    if peer_prices.is_empty() {
        return json!({
            "matchKey": match_key,
            "lowPula": round2(own_price),
            "medianPula": round2(own_price),
            "highPula": round2(own_price),
            "peers": 0,
            "position": "only-offer",
            "advice": "Only offer of this product in the mall right now.",
        });
    }
    let mut sorted = peer_prices.to_vec();
    sorted.sort_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));
    let low = round2(sorted[0]);
    let high = round2(sorted[sorted.len() - 1]);
    let mid = if sorted.len() % 2 == 1 {
        sorted[(sorted.len() - 1) / 2]
    } else {
        (sorted[sorted.len() / 2 - 1] + sorted[sorted.len() / 2]) / 2.0
    };
    let median = round2(mid);

    let position = if own_price > high * 1.05 {
        "above"
    } else if own_price < low * 0.95 {
        "below"
    } else {
        "in-band"
    };

    let advice = match position {
        "above" => format!(
            "P{} above the highest comparable offer. Consider a special — the mall funds platform promotions.",
            round2(own_price - high) as i64
        ),
        "below" => format!(
            "P{} below the lowest comparable offer. Strong, but check your margin.",
            round2(low - own_price) as i64
        ),
        _ => format!(
            "In line with {} other {} in the mall.",
            sorted.len(),
            if sorted.len() == 1 { "offer" } else { "offers" }
        ),
    };

    json!({
        "matchKey": match_key,
        "lowPula": low,
        "medianPula": median,
        "highPula": high,
        "peers": sorted.len(),
        "position": position,
        "advice": advice,
    })
}

pub fn service_fee(subtotal_pula: f64) -> f64 {
    round2(SERVICE_FEE_CAP_PULA.min(subtotal_pula * SERVICE_FEE_RATE))
}

/// The admin-controlled markup applied on top of a shop manager's own price.
/// The shopkeeper still sees and sets their own price; the markup is the
/// platform's configured take and is recorded in the audit log.
pub fn marked_price(base_price: f64, markup_pct: f64) -> f64 {
    round2(base_price * (1.0 + markup_pct / 100.0))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn cooking_oil_is_not_worth_shipping_alone() {
        let q = landed_quote(89.0, 118.0, 2.0, 0.0);
        assert!(q["landedPula"].as_f64().unwrap() > 89.0);
        assert!(!q["crossBorderViable"].as_bool().unwrap());
    }

    #[test]
    fn clothing_saves_handsomely_against_landed_cost() {
        // 45% SACU duty on clothing makes the local price far better.
        let q = landed_quote(330.0, 480.0, 0.2, 0.45);
        assert!(q["localWins"].as_bool().unwrap());
        assert!(q["savingPct"].as_i64().unwrap() > 40);
        assert!(q["crossBorderViable"].as_bool().unwrap());
    }

    #[test]
    fn electronics_carry_vat_but_no_duty() {
        let q = landed_quote(2350.0, 4150.0, 0.4, 0.0);
        assert_eq!(q["dutyPula"].as_f64().unwrap(), 0.0);
        assert!(q["vatPula"].as_f64().unwrap() > 0.0);
        assert!(q["localWins"].as_bool().unwrap());
    }

    #[test]
    fn delivery_bands_are_monotonic_and_free_over_threshold() {
        let near = delivery_quote("Gaborone Central", 100.0);
        let mid = delivery_quote("Kgale", 100.0);
        let far = delivery_quote("Motswedi", 100.0);
        assert!(near["feePula"].as_f64().unwrap() < mid["feePula"].as_f64().unwrap());
        assert!(mid["feePula"].as_f64().unwrap() < far["feePula"].as_f64().unwrap());
        let free = delivery_quote("Gaborone Central", 400.0);
        assert_eq!(free["feePula"].as_f64().unwrap(), 0.0);
        assert!(free["freeApplied"].as_bool().unwrap());
    }

    #[test]
    fn unknown_area_falls_back_to_the_national_road_rate() {
        let q = delivery_quote("Somewhere New", 100.0);
        assert_eq!(q["band"].as_str().unwrap(), "Zone 5 · 60–120 km");
        assert_eq!(q["feePula"].as_f64().unwrap(), 170.0);
        assert!(q["etaMin"].as_i64().unwrap() >= 1440);
    }

    #[test]
    fn the_national_network_covers_every_district() {
        // Metro promise bands stay cheap; the far districts get road rates.
        let metro = delivery_quote("Gaborone Central", 100.0);
        assert_eq!(metro["feePula"].as_f64().unwrap(), 25.0);
        let francistown = delivery_quote("Francistown", 100.0);
        assert_eq!(francistown["feePula"].as_f64().unwrap(), 300.0);
        assert!(francistown["etaMax"].as_i64().unwrap() >= 7200);
        let maun = delivery_quote("Maun", 100.0);
        assert_eq!(maun["feePula"].as_f64().unwrap(), 380.0);
        assert!(maun["etaMin"].as_i64().unwrap() >= 5760);
    }

    #[test]
    fn national_baskets_earn_free_delivery_at_a_higher_threshold() {
        let small = delivery_quote("Mahalapye", 400.0);
        assert!(!small["freeApplied"].as_bool().unwrap());
        let large = delivery_quote("Mahalapye", 1500.0);
        assert!(large["freeApplied"].as_bool().unwrap());
        assert_eq!(large["feePula"].as_f64().unwrap(), 0.0);
    }

    #[test]
    fn price_guard_flags_outliers_without_rewriting_them() {
        let band = price_band("olive-oil", 100.0, &[95.0, 98.0, 102.0]);
        assert_eq!(band["position"].as_str().unwrap(), "in-band");
        let high = price_band("olive-oil", 140.0, &[95.0, 98.0, 102.0]);
        assert_eq!(high["position"].as_str().unwrap(), "above");
        let only = price_band("olive-oil", 100.0, &[]);
        assert_eq!(only["position"].as_str().unwrap(), "only-offer");
    }

    #[test]
    fn service_fee_is_capped() {
        assert_eq!(service_fee(100.0), 3.0);
        assert_eq!(service_fee(10_000.0), SERVICE_FEE_CAP_PULA);
    }

    #[test]
    fn admin_markup_raises_the_payable_price_only() {
        assert_eq!(marked_price(100.0, 0.0), 100.0);
        assert_eq!(marked_price(100.0, 10.0), 110.0);
    }
}
