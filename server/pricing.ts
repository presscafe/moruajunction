/**
 * Morua Junction domain engines.
 *
 * These are the platform's own built-in functionality. Each one exists because
 * it solves a problem that a plain storefront cannot, and each is computable
 * server-side so that money is never decided by the client.
 */

/** Pula is pegged to the US dollar; the Rand has weakened against it. */
export const ZAR_TO_PULA = 1.35

/** BURS standard VAT rate on imported goods and services. */
export const IMPORT_VAT_RATE = 0.14

/** Forwarder + road freight into Gaborone: collection, line haul, and border clearing. */
export const FREIGHT_BASE_PULA = 45
export const FREIGHT_PER_KG_PULA = 28
export const CLEARING_FEE_PULA = 60
/** A single item only makes sense to ship if the landed cost stays near the shelf price. */
export const CROSS_BORDER_VIABLE_MAX_MULTIPLE = 2.2
export const CROSS_BORDER_LEAD_DAYS_MIN = 7
export const CROSS_BORDER_LEAD_DAYS_MAX = 14

/** Platform take rate on the seller's own price. */
export const COMMISSION_RATE = 0.1
/** Platform service fee shown to the buyer, capped so it never dominates a small basket. */
export const SERVICE_FEE_RATE = 0.03
export const SERVICE_FEE_CAP_PULA = 15
/** Basket value above which delivery is free — the incentive to consolidate across shops. */
export const FREE_DELIVERY_THRESHOLD_PULA = 350

export interface LandedQuote {
  /** Local shelf price, in Pula. */
  localPula: number
  /** South African shelf price converted to Pula at the pegged rate. */
  saPula: number
  /** Road freight into Gaborone. */
  freightPula: number
  /** SACU Common External Tariff duty on the customs value. */
  dutyPula: number
  /** 14% import VAT on customs value plus duty. */
  vatPula: number
  /** Border clearing and forwarder handling. */
  clearingPula: number
  /** Total the shopper would pay for the same item landed from South Africa. */
  landedPula: number
  /** What the shopper saves by buying local. Negative means local is dearer. */
  savingPula: number
  savingPct: number
  /** Landed lead time in business days. */
  leadDaysMin: number
  leadDaysMax: number
  /** True when the local shelf price is the cheaper route. */
  localWins: boolean
  /** True when shipping this single item from South Africa is a realistic option at all. */
  crossBorderViable: boolean
  /** How many times the landed cost exceeds the South African shelf price. */
  landedMultiple: number
}

export function landedQuote(opts: {
  localPula: number
  saPriceZar: number
  weightKg: number
  dutyRate: number
}): LandedQuote {
  const saPula = round2(opts.saPriceZar * ZAR_TO_PULA)
  const freightPula = round2(FREIGHT_BASE_PULA + opts.weightKg * FREIGHT_PER_KG_PULA)
  const customsValue = round2(saPula + freightPula)
  const dutyPula = round2(customsValue * opts.dutyRate)
  const vatPula = round2((customsValue + dutyPula) * IMPORT_VAT_RATE)
  const landedPula = round2(customsValue + dutyPula + vatPula + CLEARING_FEE_PULA)
  const savingPula = round2(landedPula - opts.localPula)
  const savingPct = landedPula > 0 ? Math.round((savingPula / landedPula) * 100) : 0
  return {
    localPula: round2(opts.localPula),
    saPula,
    freightPula,
    dutyPula,
    vatPula,
    clearingPula: CLEARING_FEE_PULA,
    landedPula,
    savingPula,
    savingPct,
    leadDaysMin: CROSS_BORDER_LEAD_DAYS_MIN,
    leadDaysMax: CROSS_BORDER_LEAD_DAYS_MAX,
    localWins: savingPula > 0,
    landedMultiple: saPula > 0 ? round2(landedPula / saPula) : 0,
    crossBorderViable: saPula > 0 ? landedPula / saPula <= CROSS_BORDER_VIABLE_MAX_MULTIPLE : false,
  }
}

/**
 * SACU Common External Tariff reference rates by HS chapter.
 * Used to price the import route so a shopper can compare honestly.
 */
export const DUTY_BY_CATEGORY: Record<string, number> = {
  'Groceries & Staples': 0,
  'Fresh Produce': 0,
  'Bakery & Deli': 0,
  'Beverages & Cellar': 0.2,
  'Home & Kitchen': 0.15,
  'Household & Cleaning': 0.2,
  'Health & Beauty': 0.25,
  'Hardware & DIY': 0.12,
  Fashion: 0.45,
  Footwear: 0.45,
  'Bags & Accessories': 0.45,
  'Jewellery & Gifts': 0.2,
  'Mobile & Tablets': 0,
  'Audio & TV': 0,
  'Computing & Gaming': 0,
  Accessories: 0.1,
  Services: 0,
}

export function dutyForCategory(category: string): number {
  return DUTY_BY_CATEGORY[category] ?? 0.15
}

/**
 * Morua Junction delivery zones, measured by road from the Junction hub in
 * Gaborone West. The first four bands are the Pula Promise metro bands; the
 * rest carry the national road rates out to the far districts.
 */
export interface Zone {
  area: string
  km: number
  town?: string
}

export const ZONES: Zone[] = [
  // Metro — the Pula Promise bands
  { area: 'Gaborone Central', km: 3, town: 'Gaborone' },
  { area: 'Block B', km: 5, town: 'Gaborone' },
  { area: 'Kgale', km: 6, town: 'Gaborone' },
  { area: 'Extension 10', km: 7, town: 'Gaborone' },
  { area: 'Gaborone West', km: 8, town: 'Gaborone' },
  { area: 'Village', km: 9, town: 'Gaborone' },
  { area: 'Phakalane', km: 9, town: 'Gaborone' },
  { area: 'Gaborone North', km: 13, town: 'Gaborone' },
  { area: 'Ramokgwebana', km: 14, town: 'Gaborone' },
  { area: 'Ramotswa', km: 15, town: 'Gaborone' },
  { area: 'Mogoditshane', km: 15, town: 'Mogoditshane' },
  { area: 'Tlokweng', km: 16, town: 'Tlokweng' },
  { area: 'Motswedi', km: 18, town: 'Gaborone' },
  { area: 'Gaborone South', km: 19, town: 'Gaborone' },
  { area: 'Thapong', km: 22, town: 'Gaborone' },
  { area: 'Mmabatho', km: 25, town: 'Gaborone' },
  // Southern corridor
  { area: 'Gabane', km: 40, town: 'Gaborone' },
  { area: 'Oodi', km: 30, town: 'Gaborone' },
  { area: 'Mmakau', km: 30, town: 'Gaborone' },
  { area: 'Mochudi', km: 100, town: 'Mochudi' },
  { area: 'Kanye', km: 90, town: 'Kanye' },
  { area: 'Good Hope', km: 100, town: 'Kanye' },
  { area: 'Tswapong', km: 85, town: 'Kanye' },
  { area: 'Lobatse', km: 75, town: 'Lobatse' },
  { area: 'Tsabong', km: 300, town: 'Tsabong' },
  { area: 'Jwaneng', km: 260, town: 'Tsabong' },
  { area: 'Ghanzi', km: 250, town: 'Ghanzi' },
  { area: 'Mababe', km: 200, town: 'Ghanzi' },
  { area: 'Mooka', km: 100, town: 'Ghanzi' },
  // Central and southern
  { area: 'Serowe', km: 220, town: 'Serowe' },
  { area: 'Sipholokwe', km: 230, town: 'Serowe' },
  { area: 'Mahalapye', km: 150, town: 'Mahalapye' },
  { area: 'Palapye', km: 190, town: 'Palapye' },
  { area: 'Letlhakeng', km: 160, town: 'Letlhakeng' },
  { area: 'Moshupa', km: 130, town: 'Letlhakeng' },
  { area: 'Silume', km: 130, town: 'Letlhakeng' },
  { area: 'Otse', km: 130, town: 'Letlhakeng' },
  { area: 'Borwa', km: 130, town: 'Palapye' },
  { area: 'Pitsani', km: 250, town: 'Palapye' },
  // North-east
  { area: 'Selebi Phikwe', km: 460, town: 'Selebi Phikwe' },
  { area: 'Francistown', km: 440, town: 'Francistown' },
  { area: 'Tsumeb', km: 490, town: 'Tsumeb' },
  { area: 'Orapa', km: 460, town: 'Tsumeb' },
  { area: 'Berea', km: 470, town: 'Tsumeb' },
  { area: 'Tutume', km: 420, town: 'Tsumeb' },
  { area: 'Nata', km: 600, town: 'Nata' },
  // North-west
  { area: 'Maun', km: 900, town: 'Maun' },
  { area: 'Kasane', km: 1000, town: 'Kasane' },
  { area: 'Kazungula', km: 1005, town: 'Kasane' },
  { area: 'Gweta', km: 900, town: 'Maun' },
  { area: 'Shakawe', km: 950, town: 'Maun' },
  { area: 'Durabans', km: 920, town: 'Maun' },
]

/** Band definitions shared by every zone: label, flat fee and promised window. */
export interface Band {
  label: string
  fee: number
  etaMin: number
  etaMax: number
  freeAbove: number
}

export function bandFor(km: number): Band {
  if (km <= 5) return { label: 'Pula Promise · Zone 1 · up to 5 km', fee: 25, etaMin: 60, etaMax: 90, freeAbove: 350 }
  if (km <= 10) return { label: 'Pula Promise · Zone 2 · 5–10 km', fee: 35, etaMin: 90, etaMax: 150, freeAbove: 350 }
  if (km <= 20) return { label: 'Pula Promise · Zone 3 · 10–20 km', fee: 50, etaMin: 150, etaMax: 240, freeAbove: 350 }
  if (km <= 60) return { label: 'Zone 4 · 20–60 km', fee: 120, etaMin: 1440, etaMax: 2880, freeAbove: 600 }
  if (km <= 120) return { label: 'Zone 5 · 60–120 km', fee: 170, etaMin: 1440, etaMax: 2880, freeAbove: 600 }
  if (km <= 250) return { label: 'Zone 6 · 120–250 km', fee: 230, etaMin: 2880, etaMax: 4320, freeAbove: 1200 }
  if (km <= 500) return { label: 'Zone 7 · 250–500 km', fee: 300, etaMin: 4320, etaMax: 7200, freeAbove: 1200 }
  return { label: 'Zone 8 · beyond 500 km', fee: 380, etaMin: 5760, etaMax: 10080, freeAbove: 1200 }
}

export interface DeliveryQuote {
  zone: string
  km: number
  band: string
  feePula: number
  etaMin: number
  etaMax: number
  freeApplied: boolean
  available: boolean
  note: string
}

export function deliveryQuote(area: string, subtotalPula: number): DeliveryQuote {
  const wanted = area.trim().toLowerCase()
  const known =
    ZONES.find((z) => z.area.toLowerCase() === wanted) ??
    ZONES.find((z) => wanted.includes(z.area.toLowerCase()) || z.area.toLowerCase().includes(wanted))
  if (!known) {
    return {
      zone: area || 'Outside the network',
      km: 90,
      band: 'Zone 5 · 60–120 km',
      feePula: 170,
      etaMin: 1440,
      etaMax: 2880,
      freeApplied: false,
      available: true,
      note: 'National road rate for an address outside our listed zones',
    }
  }
  const band = bandFor(known.km)
  const freeApplied = subtotalPula >= band.freeAbove
  return {
    zone: known.area,
    km: known.km,
    band: band.label,
    feePula: freeApplied ? 0 : band.fee,
    etaMin: band.etaMin,
    etaMax: band.etaMax,
    freeApplied,
    available: true,
    note: freeApplied
      ? `Delivery is free on baskets over P${band.freeAbove}`
      : `P${band.fee} flat, quoted up front — never a surprise at checkout`,
  }
}

export interface PriceBand {
  matchKey: string
  lowPula: number
  medianPula: number
  highPula: number
  peers: number
  /** 'in-band' | 'above' | 'below' — advisory only; Morua never rewrites a seller's price. */
  position: 'in-band' | 'above' | 'below' | 'only-offer'
  advice: string
}

/**
 * Price Guard — advisory market bands built from what other Gaborone shops
 * charge for the same product. Morua shows a shopkeeper where they sit; it
 * never edits their price.
 */
export function priceBand(
  matchKey: string,
  ownPrice: number,
  peerPrices: number[],
): PriceBand {
  if (peerPrices.length === 0) {
    return {
      matchKey,
      lowPula: ownPrice,
      medianPula: ownPrice,
      highPula: ownPrice,
      peers: 0,
      position: 'only-offer',
      advice: 'Only offer of this product in the mall right now.',
    }
  }
  const sorted = [...peerPrices].sort((a, b) => a - b)
  const low = round2(sorted[0])
  const high = round2(sorted[sorted.length - 1])
  const mid = sorted.length % 2
    ? sorted[(sorted.length - 1) / 2]
    : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
  const median = round2(mid)
  let position: PriceBand['position'] = 'in-band'
  if (ownPrice > high * 1.05) position = 'above'
  else if (ownPrice < low * 0.95) position = 'below'
  const advice =
    position === 'above'
      ? `P${round2(ownPrice - high)} above the highest comparable offer. Consider a special — the mall funds platform promotions.`
      : position === 'below'
        ? `P${round2(low - ownPrice)} below the lowest comparable offer. Strong, but check your margin.`
        : `In line with ${sorted.length} other ${sorted.length === 1 ? 'offer' : 'offers'} in the mall.`
  return { matchKey, lowPula: low, medianPula: median, highPula: high, peers: sorted.length, position, advice }
}

export function serviceFee(subtotalPula: number): number {
  return round2(Math.min(SERVICE_FEE_CAP_PULA, subtotalPula * SERVICE_FEE_RATE))
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100
}

export function formatPula(n: number): string {
  return `P${n.toFixed(2)}`
}
