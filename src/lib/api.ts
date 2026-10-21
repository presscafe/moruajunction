import {
  markCached,
  markLive,
  readCache,
  writeCache,
} from './offline'

const BASE = (import.meta as any).env?.VITE_API_BASE ?? ''

/**
 * Every catalogue read is written to IndexedDB, so a shopper with no signal
 * still sees the shop they walked into. Writes — orders, approvals,
 * markups, dispatches — are never cached and never served from cache.
 */
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const method = (init?.method ?? 'GET').toUpperCase()
  const cacheable = method === 'GET'
  try {
    const res = await fetch(`${BASE}/api${path}`, {
      headers: { 'content-type': 'application/json' },
      ...init,
    })
    const text = await res.text()
    let data: any = null
    try {
      data = text ? JSON.parse(text) : null
    } catch {
      data = { error: text }
    }
    if (!res.ok) throw new Error(data?.error ?? `Request failed (${res.status})`)
    if (cacheable) {
      markLive()
      void writeCache(path, data)
    }
    return data as T
  } catch (error) {
    if (cacheable) {
      const cached = await readCache<T>(path)
      if (cached) {
        markCached()
        return cached.data
      }
    }
    throw error
  }
}

export const api = {
  get: <T = any,>(path: string) => request<T>(path),
  post: <T = any,>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body ?? {}) }),
}

export interface Store {
  id: number
  slug: string
  name: string
  aisle_id: number | null
  kind: string
  tagline: string
  story: string
  accent: string
  accent_soft: string
  icon: string
  banner: string
  area: string
  address: string
  phone: string
  hours: string
  return_policy: string
  delivery_promise: string
  verified_status: string
  verified_at: string | null
  rating: number
  review_count: number
  fulfilment_accuracy: number
  median_prep_minutes: number
  tags: string[] | string
  staff: { name: string; role: string }[]
  sections: { title: string; kind: string }[]
  card_stamps: number
  card_target: number
  unit_label: string
  unit_x: number
  unit_y: number
  town: string
  district: string
  region: string
  opened_on: string
  approval_status: string
  approval_note: string
  markup_pct: number
  markup_note: string
  markup_set_by: string | null
  markup_set_at: string | null
}

export interface Landed {
  localPula: number
  saPula: number
  freightPula: number
  dutyPula: number
  vatPula: number
  clearingPula: number
  landedPula: number
  savingPula: number
  savingPct: number
  leadDaysMin: number
  leadDaysMax: number
  localWins: boolean
  landedMultiple: number
  crossBorderViable: boolean
}

export interface Band {
  matchKey: string
  lowPula: number
  medianPula: number
  highPula: number
  peers: number
  position: 'in-band' | 'above' | 'below' | 'only-offer'
  advice: string
}

export interface Product {
  id: number
  sku: string
  store_id: number
  name: string
  blurb: string
  match_key: string
  category: string
  unit: string
  icon: string
  price_pula: number
  was_price_pula: number | null
  sa_price_zar: number
  weight_kg: number
  duty_rate: number
  origin: string
  stock: number
  stock_synced_at: string | null
  rating: number
  review_count: number
  sold_count: number
  is_special: boolean
  special_pula: number | null
  tags: string[]
  landed: Landed
  band: Band
  shelf: { label: string; minutes: number; live: boolean }
  payable_pula: number
  markup_pct: number
  store?: Store
}

export interface Floor {
  id: number
  code: string
  name: string
  tagline: string
  town?: string
  sort: number
}

export interface Aisle {
  id: number
  floor_id: number
  code: string
  name: string
  blurb: string
  sort: number
}

export interface Mall {
  floors: Floor[]
  aisles: Aisle[]
  stores: Store[]
  specials: Product[]
  stats: {
    stores: number
    products: number
    approved: number
    pendingApproval: number
    orders: number
    gmv: number
  }
}

export interface MallPlan {
  floors: (Floor & { town?: string })[]
  aisles: Aisle[]
  units: {
    id: number
    slug: string
    name: string
    icon: string
    accent: string
    area: string
    town: string
    floorId: number
    kind: string
    approval: string
    unitLabel: string
    x: number
    y: number
    aisle: string
    minutesFromHub: number
  }[]
  hubs: { floorId: number; x: number; y: number; label: string }[]
  hub: { x: number; y: number; label: string }
}

export interface QuoteLine {
  productId: number
  sku: string
  name: string
  blurb: string
  icon: string
  unit: string
  qty: number
  unitPrice: number
  payableUnit: number
  markupPula: number
  lineTotal: number
  commission: number
  sellerNet: number
  stock: number
  store: Store
  landed: Landed
}

export interface Quote {
  lines: QuoteLine[]
  stores: Store[]
  subtotal: number
  delivery: number
  serviceFee: number
  total: number
  savedVsLanded: number
  deliveryQuote: {
    zone: string
    km: number
    band: string
    feePula: number
    etaMin: number
    etaMax: number
    freeApplied: boolean
    note: string
  }
  fulfilment: 'delivery' | 'pickup'
  area: string
}

export interface Provider {
  id: number
  name: string
  contact: string
  vehicle: string
  areas: string
  rating: number
  commission_pct: number
  active: number
  registered_on: string
  license_ref: string
  notes: string
}

export interface Order {
  id: number
  code: string
  customer_name: string
  customer_phone: string
  customer_area: string
  fulfilment: string
  status: string
  payment_method: string
  payment_state: string
  escrow_state: string
  subtotal_pula: number
  delivery_pula: number
  service_pula: number
  total_pula: number
  saved_pula: number
  address: string
  notes: string
  rider_name: string | null
  rider_phone: string | null
  eta_minutes: number | null
  placed_at: string
  updated_at: string
  delivery_provider_id: number | null
  delivery_provider_name: string | null
  dispatch_note: string | null
  dispatched_at: string | null
  collect_point: string
}

export interface AdminData {
  stores: Store[]
  pendingApprovals: number
  disputes: any[]
  anomalies: (Product & { store_name: string; store_slug: string })[]
  promotions: any[]
  providers: Provider[]
  balances: { account: string; debit: number; credit: number; balance: number }[]
  entries: any[]
  actions: any[]
  platform: {
    gmv: number
    orders: number
    shoppers: number
    savedVsLanded: number
    pendingApprovals: number
    ordersAwaitingDispatch: number
  }
}
