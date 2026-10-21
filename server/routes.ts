import { Router } from 'express'
import { db } from './db.ts'
import { seed } from './seed.ts'
import {
  COMMISSION_RATE,
  FREE_DELIVERY_THRESHOLD_PULA,
  deliveryQuote,
  landedQuote,
  priceBand,
  round2,
  serviceFee,
} from './pricing.ts'
import { balances, post, recentEntries } from './ledger.ts'

export const api = Router()

/* ------------------------------------------------------------------ *
 * Helpers
 * ------------------------------------------------------------------ */

const nowIso = () => new Date().toISOString()

function rows<T = Record<string, unknown>>(sql: string, ...params: unknown[]): T[] {
  return db.prepare(sql).all(...(params as never[])) as T[]
}

function row<T = Record<string, unknown>>(sql: string, ...params: unknown[]): T | undefined {
  return db.prepare(sql).get(...(params as never[])) as T | undefined
}

function parseJson<T>(value: unknown, fallback: T): T {
  if (typeof value !== 'string') return fallback
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

/* ------------------------------------------------------------------ *
 * Types
 * ------------------------------------------------------------------ */

interface StoreRow {
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
  verified_by: string | null
  rating: number
  review_count: number
  fulfilment_accuracy: number
  median_prep_minutes: number
  tags: string
  staff: string
  sections: string
  card_stamps: number
  card_target: number
  unit_label: string
  unit_x: number
  unit_y: number
  opened_on: string
}

interface ProductRow {
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
  is_special: number
  special_pula: number | null
  tags: string
  active: number
}

function decorateStore(s: StoreRow) {
  return {
    ...s,
    tags: parseJson<string[]>(s.tags, []),
    staff: parseJson<{ name: string; role: string }[]>(s.staff, []),
    sections: parseJson<{ title: string; kind: string }[]>(s.sections, []),
  }
}

function shelfFreshness(stock_synced_at: string | null) {
  if (!stock_synced_at) return { label: 'Never synced', minutes: 99999, live: false }
  const minutes = Math.max(0, Math.round((Date.now() - new Date(stock_synced_at).getTime()) / 60000))
  const label =
    minutes < 1 ? 'Just now' : minutes < 60 ? `${minutes} min ago` : minutes < 1440 ? `${Math.floor(minutes / 60)} h ago` : `${Math.floor(minutes / 1440)} d ago`
  return { label, minutes, live: minutes <= 240 }
}

function decorateProduct(p: ProductRow, store?: StoreRow) {
  const quote = landedQuote({
    localPula: p.price_pula,
    saPriceZar: p.sa_price_zar,
    weightKg: p.weight_kg,
    dutyRate: p.duty_rate,
  })
  const peers = rows<{ price_pula: number }>(
    `SELECT price_pula FROM products WHERE match_key = ? AND active = 1 AND id != ?`,
    p.match_key,
    p.id,
  ).map((r) => r.price_pula)
  const band = priceBand(p.match_key, p.price_pula, peers)
  return {
    ...p,
    tags: parseJson<string[]>(p.tags, []),
    is_special: p.is_special === 1,
    landed: quote,
    band,
    shelf: shelfFreshness(p.stock_synced_at),
    store: store ? decorateStore(store) : undefined,
  }
}

/* ------------------------------------------------------------------ *
 * The mall
 * ------------------------------------------------------------------ */

api.get('/mall', (_req, res) => {
  seed()
  const floors = rows('SELECT * FROM floors ORDER BY sort')
  const aisles = rows<{ id: number; floor_id: number; code: string; name: string; blurb: string; sort: number }>(
    'SELECT * FROM aisles ORDER BY sort',
  )
  const storeRows = rows<StoreRow>('SELECT * FROM stores ORDER BY name')
  const stores = storeRows.map(decorateStore)
  const specials = rows<ProductRow>(
    `SELECT * FROM products WHERE is_special = 1 AND active = 1 ORDER BY special_pula LIMIT 8`,
  ).map((p) => decorateProduct(p, storeRows.find((s) => s.id === p.store_id)))
  const counts = row<{ products: number; stores: number }>(
    `SELECT (SELECT COUNT(*) FROM products WHERE active=1) AS products, (SELECT COUNT(*) FROM stores) AS stores`,
  )
  const orders = row<{ c: number; gmv: number }>(
    `SELECT COUNT(*) AS c, COALESCE(SUM(total_pula),0) AS gmv FROM orders`,
  )
  res.json({
    floors,
    aisles,
    stores,
    specials,
    stats: {
      stores: counts?.stores ?? 0,
      products: counts?.products ?? 0,
      orders: orders?.c ?? 0,
      gmv: round2(orders?.gmv ?? 0),
      verified: stores.filter((s) => s.verified_status === 'verified').length,
    },
  })
})

api.get('/stores', (req, res) => {
  const { aisle, q, tag } = req.query as Record<string, string>
  let sql = `SELECT s.* FROM stores s JOIN aisles a ON a.id = s.aisle_id WHERE 1=1`
  const params: unknown[] = []
  if (aisle) {
    sql += ` AND a.code = ?`
    params.push(aisle)
  }
  if (q) {
    sql += ` AND (s.name LIKE ? OR s.tagline LIKE ? OR s.tags LIKE ?)`
    params.push(`%${q}%`, `%${q}%`, `%${q}%`)
  }
  if (tag) {
    sql += ` AND s.tags LIKE ?`
    params.push(`%"${tag}"%`)
  }
  sql += ` ORDER BY s.kind = 'hub' DESC, s.name`
  const stores = rows<StoreRow>(sql, ...params).map(decorateStore)
  res.json({ stores })
})

api.get('/stores/:slug', (req, res) => {
  const store = row<StoreRow>('SELECT * FROM stores WHERE slug = ?', req.params.slug)
  if (!store) return res.status(404).json({ error: 'Store not found' })
  const products = rows<ProductRow>(
    'SELECT * FROM products WHERE store_id = ? AND active = 1 ORDER BY is_special DESC, name',
    store.id,
  )
  const reviews = rows<{ id: number; author: string; rating: number; body: string; created_at: string }>(
    'SELECT id, author, rating, body, created_at FROM reviews WHERE store_id = ? ORDER BY created_at DESC LIMIT 12',
    store.id,
  )
  const peers = products
    .map((p) => {
      const others = rows<{ price_pula: number }>(
        'SELECT price_pula FROM products WHERE match_key = ? AND active = 1 AND store_id != ?',
        p.match_key,
        store.id,
      ).map((r) => r.price_pula)
      return { matchKey: p.match_key, count: others.length, prices: others }
    })
    .filter((x) => x.count > 0)

  res.json({
    store: decorateStore(store),
    products: products.map((p) => decorateProduct(p, store)),
    reviews,
    shelfFreshness: shelfFreshness(
      row<{ max: string | null }>(
        'SELECT MAX(stock_synced_at) AS max FROM products WHERE store_id = ?',
        store.id,
      )?.max ?? null,
    ),
    peerCompetition: peers,
  })
})

api.get('/products/:id', (req, res) => {
  const product = row<ProductRow>('SELECT * FROM products WHERE id = ?', Number(req.params.id))
  if (!product) return res.status(404).json({ error: 'Product not found' })
  const store = row<StoreRow>('SELECT * FROM stores WHERE id = ?', product.store_id)
  const peers = rows<ProductRow & { store_name: string; store_slug: string; store_area: string }>(
    `SELECT p.*, s.name AS store_name, s.slug AS store_slug, s.area AS store_area
     FROM products p JOIN stores s ON s.id = p.store_id
     WHERE p.match_key = ? AND p.active = 1 AND p.id != ? ORDER BY p.price_pula`,
    product.match_key,
    product.id,
  )
  res.json({
    product: decorateProduct(product, store),
    peers: peers.map((p) => ({
      id: p.id,
      name: p.name,
      price_pula: p.price_pula,
      was_price_pula: p.was_price_pula,
      icon: p.icon,
      stock: p.stock,
      store_name: p.store_name,
      store_slug: p.store_slug,
      store_area: p.store_area,
      unit: p.unit,
    })),
  })
})

api.get('/aisles/:code', (req, res) => {
  const aisle = row<{ id: number; code: string; name: string; blurb: string; floor_id: number }>(
    'SELECT * FROM aisles WHERE code = ?',
    req.params.code,
  )
  if (!aisle) return res.status(404).json({ error: 'Aisle not found' })
  const stores = rows<StoreRow>(
    `SELECT * FROM stores WHERE aisle_id = ? ORDER BY kind = 'hub' DESC, name`,
    aisle.id,
  ).map(decorateStore)
  const products = rows<ProductRow>(
    `SELECT p.* FROM products p JOIN stores s ON s.id = p.store_id
     WHERE s.aisle_id = ? AND p.active = 1 ORDER BY p.is_special DESC, p.sold_count DESC LIMIT 40`,
    aisle.id,
  )
  res.json({ aisle, stores, products: products.map((p) => decorateProduct(p)) })
})

/** Walking distances between shops in the mall — the Mall Compass. */
api.get('/walk', (_req, res) => {
  const stores = rows<StoreRow>('SELECT * FROM stores')
  const areaCoords: Record<string, { x: number; y: number }> = {
    'Gaborone Central': { x: 0.5, y: 0.5 },
    'Block B': { x: 0.58, y: 0.44 },
    Kgale: { x: 0.38, y: 0.56 },
    'Extension 10': { x: 0.3, y: 0.42 },
    'Gaborone West': { x: 0.22, y: 0.5 },
    Village: { x: 0.42, y: 0.38 },
    Phakalane: { x: 0.33, y: 0.34 },
    'Gaborone North': { x: 0.5, y: 0.24 },
    Ramokgwebana: { x: 0.56, y: 0.18 },
    Tlokweng: { x: 0.2, y: 0.66 },
    Motswedi: { x: 0.64, y: 0.62 },
  }
  const hub = { x: 0.5, y: 0.5 }
  const coords = (s: StoreRow) => {
    const c = areaCoords[s.area] ?? hub
    return { x: c.x + s.unit_x * 0.02, y: c.y + s.unit_y * 0.02 }
  }
  const walkMinutes = (a: { x: number; y: number }, b: { x: number; y: number }) => {
    const km = Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2) * 22
    return Math.max(1, Math.round((km / 4.5) * 60))
  }
  res.json({
    from: stores.map((s) => {
      const c = coords(s)
      return {
        id: s.id,
        slug: s.slug,
        name: s.name,
        area: s.area,
        unit_label: s.unit_label,
        minutesFromHub: walkMinutes(c, hub),
        minutesTo: Object.fromEntries(
          stores.map((o) => [o.slug, walkMinutes(c, coords(o))]),
        ),
      }
    }),
  })
})

/* ------------------------------------------------------------------ *
 * Cart and checkout — the server owns the money
 * ------------------------------------------------------------------ */

interface CartLine {
  productId: number
  qty: number
}

function buildQuote(lines: CartLine[], area: string, fulfilment: 'delivery' | 'pickup') {
  const resolved = lines
    .map((l) => {
      const product = row<ProductRow>('SELECT * FROM products WHERE id = ? AND active = 1', l.productId)
      if (!product) return null
      const store = row<StoreRow>('SELECT * FROM stores WHERE id = ?', product.store_id)
      const qty = Math.max(1, Math.min(50, Math.floor(l.qty)))
      const lineTotal = round2(product.price_pula * qty)
      const commission = round2(lineTotal * COMMISSION_RATE)
      return {
        product,
        store,
        qty,
        unitPrice: product.price_pula,
        lineTotal,
        commission,
        sellerNet: round2(lineTotal - commission),
        landed: landedQuote({
          localPula: product.price_pula,
          saPriceZar: product.sa_price_zar,
          weightKg: product.weight_kg,
          dutyRate: product.duty_rate,
        }),
      }
    })
    .filter(Boolean) as {
    product: ProductRow
    store: StoreRow
    qty: number
    unitPrice: number
    lineTotal: number
    commission: number
    sellerNet: number
    landed: ReturnType<typeof landedQuote>
  }[]

  const subtotal = round2(resolved.reduce((s, l) => s + l.lineTotal, 0))
  const delivery = fulfilment === 'pickup' ? 0 : deliveryQuote(area, subtotal).feePula
  const fee = serviceFee(subtotal)
  const total = round2(subtotal + delivery + fee)
  const savedVsLanded = round2(
    resolved.reduce((s, l) => s + (l.landed.localWins ? l.landed.savingPula * l.qty : 0), 0),
  )
  const stores = [...new Set(resolved.map((l) => l.store.id))].map((id) =>
    decorateStore(resolved.find((l) => l.store.id === id)!.store),
  )
  return {
    lines: resolved.map((l) => ({
      productId: l.product.id,
      sku: l.product.sku,
      name: l.product.name,
      blurb: l.product.blurb,
      icon: l.product.icon,
      unit: l.product.unit,
      qty: l.qty,
      unitPrice: l.unitPrice,
      lineTotal: l.lineTotal,
      commission: l.commission,
      sellerNet: l.sellerNet,
      stock: l.product.stock,
      store: decorateStore(l.store),
      landed: l.landed,
    })),
    stores,
    subtotal,
    delivery,
    serviceFee: fee,
    total,
    savedVsLanded,
    deliveryQuote: deliveryQuote(area, subtotal),
    fulfilment,
    area,
  }
}

api.post('/cart/quote', (req, res) => {
  const { lines = [], area = 'Gaborone Central', fulfilment = 'delivery' } = req.body ?? {}
  res.json(buildQuote(lines, area, fulfilment))
})

api.post('/orders', (req, res) => {
  const {
    lines = [],
    area = 'Gaborone Central',
    fulfilment = 'delivery',
    customerName = 'Guest',
    customerPhone = '+267 000 0000',
    address = 'Gaborone',
    notes = '',
    paymentMethod = 'cod',
    collectPoint = 'Morua Junction Hub — Gaborone West',
  } = req.body ?? {}

  if (!Array.isArray(lines) || lines.length === 0) {
    return res.status(400).json({ error: 'Your basket is empty.' })
  }
  const quote = buildQuote(lines, area, fulfilment)
  if (quote.lines.length === 0) {
    return res.status(400).json({ error: 'None of those items are available.' })
  }
  const short = quote.lines.find((l) => l.stock < l.qty)
  if (short) {
    return res.status(400).json({
      error: `${short.store.name} only has ${short.stock} of ${short.name} on the shelf right now.`,
    })
  }

  const code = `MJ-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 8999)}`
  const ts = nowIso()
  const eta = fulfilment === 'pickup' ? 30 : quote.deliveryQuote.etaMax
  const riderPool = ['Ivy M.', 'Tshepo K.', 'Karabo B.', 'Refilwe S.', 'Tumelo D.', 'Naledi P.']

  const info = db
    .prepare(
      `INSERT INTO orders (code, customer_name, customer_phone, customer_area, fulfilment, status, payment_method,
        payment_state, escrow_state, subtotal_pula, delivery_pula, service_pula, total_pula, saved_pula, address, notes,
        rider_name, rider_phone, eta_minutes, placed_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    )
    .run(
      code,
      customerName,
      customerPhone,
      area,
      fulfilment,
      'placed',
      paymentMethod,
      paymentMethod === 'cod' ? 'due_on_delivery' : 'authorised',
      'held',
      quote.subtotal,
      quote.delivery,
      quote.serviceFee,
      quote.total,
      quote.savedVsLanded,
      address,
      notes,
      riderPool[Math.floor(Math.random() * riderPool.length)],
      '+267 7' + String(Math.floor(10000000 + Math.random() * 89999999)),
      eta,
      ts,
      ts,
    )
  const orderId = Number(info.lastInsertRowid)

  const insItem = db.prepare(
    `INSERT INTO order_items (order_id, product_id, store_id, qty, unit_price_pula, line_total_pula, commission_pula, seller_net_pula)
     VALUES (?,?,?,?,?,?,?,?)`,
  )
  for (const l of quote.lines) {
    insItem.run(orderId, l.productId, l.store.id, l.qty, l.unitPrice, l.lineTotal, l.commission, l.sellerNet)
    db.prepare(`UPDATE products SET stock = MAX(0, stock - ?), sold_count = sold_count + ? WHERE id = ?`).run(
      l.qty,
      l.qty,
      l.productId,
    )
  }

  // Money comes in and is held in escrow.
  post([
    { ts, order_id: orderId, account: 'platform_cash', direction: 'debit', amount_pula: quote.total, kind: 'order', memo: `Order ${code} collected` },
    { ts, order_id: orderId, account: 'escrow_held', direction: 'credit', amount_pula: quote.total, kind: 'order', memo: `Order ${code} held in escrow` },
  ])

  res.json({ code, orderId, quote })
})

/* ------------------------------------------------------------------ *
 * Order lifecycle
 * ------------------------------------------------------------------ */

const ORDER_FLOW = [
  'placed',
  'confirmed',
  'picking',
  'picked_up',
  'in_transit',
  'out_for_delivery',
  'delivered',
] as const

const STATUS_COPY: Record<string, string> = {
  placed: 'Order received by the mall',
  confirmed: 'Shops confirmed the items and reserved them on the shelf',
  picking: 'Items are being picked and packed',
  picked_up: 'Rider collected from the shop',
  in_transit: 'Rider is on the way',
  out_for_delivery: 'Rider is at your door',
  delivered: 'Delivered — payment released',
  failed: 'Delivery could not be completed',
  cancelled: 'Order cancelled',
}

api.get('/orders/:code', (req, res) => {
  const order = row<Record<string, unknown>>('SELECT * FROM orders WHERE code = ?', req.params.code)
  if (!order) return res.status(404).json({ error: 'Order not found' })
  const items = rows<{ id: number; product_id: number; store_id: number; qty: number; unit_price_pula: number; line_total_pula: number; commission_pula: number; seller_net_pula: number; name: string; icon: string; sku: string }>(
    `SELECT oi.*, p.name, p.icon, p.sku FROM order_items oi JOIN products p ON p.id = oi.product_id WHERE oi.order_id = ?`,
    order.id,
  )
  const stores = rows<StoreRow>(
    `SELECT DISTINCT s.* FROM stores s JOIN order_items oi ON oi.store_id = s.id WHERE oi.order_id = ?`,
    order.id,
  ).map(decorateStore)
  res.json({ order, items, stores, statusCopy: STATUS_COPY })
})

api.post('/orders/:code/advance', (req, res) => {
  const order = row<{ id: number; code: string; status: string; total_pula: number; escrow_state: string }>(
    'SELECT * FROM orders WHERE code = ?',
    req.params.code,
  )
  if (!order) return res.status(404).json({ error: 'Order not found' })
  const to = String(req.body?.status ?? '')
  if (!ORDER_FLOW.includes(to as (typeof ORDER_FLOW)[number])) {
    return res.status(400).json({ error: 'Unknown status' })
  }
  const currentIndex = ORDER_FLOW.indexOf(order.status as (typeof ORDER_FLOW)[number])
  const nextIndex = ORDER_FLOW.indexOf(to as (typeof ORDER_FLOW)[number])
  if (nextIndex !== currentIndex + 1) {
    return res.status(400).json({ error: `Cannot move from ${order.status} to ${to}` })
  }
  const ts = nowIso()
  db.prepare(`UPDATE orders SET status = ?, updated_at = ? WHERE id = ?`).run(to, ts, order.id)

  if (to === 'delivered' && order.escrow_state === 'held') {
    const items = rows<{ commission_pula: number; seller_net_pula: number }>(
      'SELECT commission_pula, seller_net_pula FROM order_items WHERE order_id = ?',
      order.id,
    )
    const commission = round2(items.reduce((s, i) => s + i.commission_pula, 0))
    const sellerNet = round2(items.reduce((s, i) => s + i.seller_net_pula, 0))
    const delivery = round2(
      (row<{ delivery_pula: number }>('SELECT delivery_pula FROM orders WHERE id = ?', order.id)?.delivery_pula ?? 0),
    )
    const service = round2(
      (row<{ service_pula: number }>('SELECT service_pula FROM orders WHERE id = ?', order.id)?.service_pula ?? 0),
    )
    db.prepare(`UPDATE orders SET escrow_state = 'released' WHERE id = ?`).run(order.id)
    post([
      { ts, order_id: order.id, account: 'escrow_held', direction: 'debit', amount_pula: order.total_pula, kind: 'release', memo: `Escrow released for ${order.code}` },
      { ts, order_id: order.id, account: 'revenue', direction: 'credit', amount_pula: round2(commission + service), kind: 'release', memo: `Commission and service fee on ${order.code}` },
      { ts, order_id: order.id, account: 'seller_payable', direction: 'credit', amount_pula: sellerNet, kind: 'release', memo: `Seller proceeds for ${order.code}` },
      { ts, order_id: order.id, account: 'delivery_costs', direction: 'credit', amount_pula: delivery, kind: 'release', memo: `Delivery settlement for ${order.code}` },
    ])
  }
  res.json({ ok: true, status: to })
})

/* ------------------------------------------------------------------ *
 * Seller console
 * ------------------------------------------------------------------ */

api.get('/seller/:slug', (req, res) => {
  const store = row<StoreRow>('SELECT * FROM stores WHERE slug = ?', req.params.slug)
  if (!store) return res.status(404).json({ error: 'Store not found' })
  const products = rows<ProductRow>('SELECT * FROM products WHERE store_id = ? AND active = 1 ORDER BY name', store.id)
  const decorated = products.map((p) => decorateProduct(p, store))
  const orders = rows<{ id: number; code: string; status: string; total_pula: number; placed_at: string; customer_name: string }>(
    `SELECT o.id, o.code, o.status, o.total_pula, o.placed_at, o.customer_name
     FROM orders o JOIN order_items oi ON oi.order_id = o.id WHERE oi.store_id = ?
     GROUP BY o.id ORDER BY o.placed_at DESC LIMIT 20`,
    store.id,
  )
  const revenue = row<{ gmv: number; orders: number }>(
    `SELECT COALESCE(SUM(oi.line_total_pula),0) AS gmv, COUNT(DISTINCT oi.order_id) AS orders
     FROM order_items oi WHERE oi.store_id = ?`,
    store.id,
  )
  const payout = row<{ net: number; count: number }>(
    `SELECT COALESCE(SUM(net_pula),0) AS net, COUNT(*) AS count FROM payouts WHERE store_id = ? AND state = 'scheduled'`,
    store.id,
  )
  const lowStock = decorated.filter((p) => p.stock <= 5).length
  res.json({
    store: decorateStore(store),
    products: decorated,
    orders,
    revenue: { gmv: round2(revenue?.gmv ?? 0), orders: revenue?.orders ?? 0, commission: round2((revenue?.gmv ?? 0) * COMMISSION_RATE) },
    payout: { net: round2(payout?.net ?? 0), count: payout?.count ?? 0 },
    alerts: {
      lowStock,
      staleShelf: decorated.filter((p) => !p.shelf.live).length,
      aboveBand: decorated.filter((p) => p.band.position === 'above').length,
    },
  })
})

api.post('/seller/:slug/products', (req, res) => {
  const store = row<StoreRow>('SELECT * FROM stores WHERE slug = ?', req.params.slug)
  if (!store) return res.status(404).json({ error: 'Store not found' })
  const { id, name, blurb, pricePula, saPriceZar, weightKg, stock, unit, icon } = req.body ?? {}
  if (id) {
    const existing = row<ProductRow>('SELECT * FROM products WHERE id = ? AND store_id = ?', id, store.id)
    if (!existing) return res.status(404).json({ error: 'Product not found in your store' })
    db.prepare(
      `UPDATE products SET name = COALESCE(?, name), blurb = COALESCE(?, blurb), price_pula = COALESCE(?, price_pula),
       stock = COALESCE(?, stock), stock_synced_at = ?, is_special = 0, special_pula = NULL WHERE id = ?`,
    ).run(
      name ?? null,
      blurb ?? null,
      pricePula != null ? Number(pricePula) : null,
      stock != null ? Number(stock) : null,
      nowIso(),
      id,
    )
    return res.json({ ok: true, id })
  }
  const key = String(name ?? 'new-product').toLowerCase().replace(/[^a-z0-9]+/g, '-')
  const info = db
    .prepare(
      `INSERT INTO products (sku, store_id, name, blurb, match_key, category, unit, icon, price_pula, sa_price_zar,
        weight_kg, duty_rate, origin, stock, stock_synced_at, rating, review_count, sold_count, is_special, special_pula, tags)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    )
    .run(
      `MJ-${Date.now().toString().slice(-6)}`,
      store.id,
      name ?? 'New product',
      blurb ?? '',
      key,
      'Services',
      unit ?? 'each',
      icon ?? '📦',
      Number(pricePula ?? 0),
      Number(saPriceZar ?? 0),
      Number(weightKg ?? 0.5),
      0.15,
      'Gaborone',
      Number(stock ?? 0),
      nowIso(),
      0,
      0,
      0,
      0,
      null,
      '[]',
    )
  res.json({ ok: true, id: Number(info.lastInsertRowid) })
})

/** Live Shelf — the shop tells the mall what is actually on the shelf right now. */
api.post('/seller/:slug/shelf', (req, res) => {
  const store = row<StoreRow>('SELECT * FROM stores WHERE slug = ?', req.params.slug)
  if (!store) return res.status(404).json({ error: 'Store not found' })
  const { productId, stock } = req.body ?? {}
  if (productId == null) {
    db.prepare(`UPDATE products SET stock_synced_at = ? WHERE store_id = ?`).run(nowIso(), store.id)
    return res.json({ ok: true, synced: 'all' })
  }
  db.prepare(`UPDATE products SET stock = ?, stock_synced_at = ? WHERE id = ? AND store_id = ?`).run(
    Math.max(0, Math.floor(Number(stock ?? 0))),
    nowIso(),
    productId,
    store.id,
  )
  res.json({ ok: true })
})

api.post('/seller/:slug/special', (req, res) => {
  const store = row<StoreRow>('SELECT * FROM stores WHERE slug = ?', req.params.slug)
  if (!store) return res.status(404).json({ error: 'Store not found' })
  const { productId, specialPula, clear } = req.body ?? {}
  if (clear) {
    db.prepare(`UPDATE products SET is_special = 0, special_pula = NULL WHERE id = ? AND store_id = ?`).run(
      productId,
      store.id,
    )
  } else {
    db.prepare(`UPDATE products SET is_special = 1, special_pula = ? WHERE id = ? AND store_id = ?`).run(
      Number(specialPula),
      productId,
      store.id,
    )
  }
  res.json({ ok: true })
})

/* ------------------------------------------------------------------ *
 * Admin console
 * ------------------------------------------------------------------ */

api.get('/admin', (_req, res) => {
  const verification = rows<StoreRow>('SELECT * FROM stores ORDER BY verified_status = "pending" DESC, name').map(decorateStore)
  const disputes = rows<{ id: number; subject: string; detail: string; state: string; raised_by: string; created_at: string; order_code: string | null; store_name: string | null }>(
    `SELECT d.*, o.code AS order_code, s.name AS store_name FROM disputes d
     LEFT JOIN orders o ON o.id = d.order_id LEFT JOIN stores s ON s.id = d.store_id
     ORDER BY d.state = 'open' DESC, d.created_at DESC`,
  )
  const anomalies = rows<ProductRow & { store_name: string; store_slug: string; match_key: string }>(
    `SELECT p.*, s.name AS store_name, s.slug AS store_slug FROM products p JOIN stores s ON s.id = p.store_id
     WHERE p.active = 1`,
  )
    .map((p) => ({ ...decorateProduct(p), store_name: p.store_name, store_slug: p.store_slug }))
    .filter((p) => p.band.position === 'above')

  const platform = row<{ gmv: number; orders: number; shoppers: number }>(
    `SELECT COALESCE(SUM(total_pula),0) AS gmv, COUNT(*) AS orders, COUNT(DISTINCT customer_phone) AS shoppers FROM orders`,
  )
  const savings = row<{ saved: number }>('SELECT COALESCE(SUM(saved_pula),0) AS saved FROM orders')
  res.json({
    verification,
    disputes,
    anomalies,
    promotions: rows('SELECT * FROM promotions ORDER BY state, id DESC'),
    balances: balances(),
    entries: recentEntries(30),
    platform: {
      gmv: round2(platform?.gmv ?? 0),
      orders: platform?.orders ?? 0,
      shoppers: platform?.shoppers ?? 0,
      savedVsLanded: round2(savings?.saved ?? 0),
    },
  })
})

api.post('/admin/verify', (req, res) => {
  const { storeId, approve, reviewer } = req.body ?? {}
  const store = row<StoreRow>('SELECT * FROM stores WHERE id = ?', storeId)
  if (!store) return res.status(404).json({ error: 'Store not found' })
  db.prepare(`UPDATE stores SET verified_status = ?, verified_at = ?, verified_by = ? WHERE id = ?`).run(
    approve ? 'verified' : 'declined',
    nowIso(),
    reviewer ?? 'Botswana Verification Desk',
    storeId,
  )
  res.json({ ok: true })
})

api.post('/admin/disputes/:id/resolve', (req, res) => {
  const { resolution, state } = req.body ?? {}
  db.prepare(`UPDATE disputes SET resolution = ?, state = ? WHERE id = ?`).run(
    resolution ?? 'Resolved',
    state ?? 'resolved',
    req.params.id,
  )
  res.json({ ok: true })
})

api.post('/admin/disputes', (req, res) => {
  const { orderCode, subject, detail, raisedBy = 'customer' } = req.body ?? {}
  const order = row<{ id: number }>('SELECT id FROM orders WHERE code = ?', orderCode)
  db.prepare(
    `INSERT INTO disputes (order_id, store_id, subject, detail, state, raised_by, resolution, created_at) VALUES (?,?,?,?,?,?,?,?)`,
  ).run(order?.id ?? null, null, subject ?? 'Issue with an order', detail ?? '', 'open', raisedBy, null, nowIso())
  res.json({ ok: true })
})

/**
 * Platform-funded promotions. This is what replaces the admin's ability to
 * change a seller's price: the mall sets the discount and pays for it.
 */
api.post('/admin/promotions', (req, res) => {
  const { name, scopeType, scopeId, pct, budgetPula, fundedBy } = req.body ?? {}
  if (!name) return res.status(400).json({ error: 'Promotion needs a name' })
  db.prepare(
    `INSERT INTO promotions (name, scope_type, scope_id, pct, amount_pula, funded_by, budget_pula, spent_pula, state, starts_at, ends_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
  ).run(
    name,
    scopeType ?? 'aisle',
    scopeId ?? null,
    Number(pct ?? 0),
    0,
    fundedBy ?? 'Morua Junction',
    Number(budgetPula ?? 0),
    0,
    'live',
    nowIso().slice(0, 10),
    new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10),
  )
  res.json({ ok: true })
})

api.get('/ledger', (_req, res) => {
  res.json({ balances: balances(), entries: recentEntries(80) })
})

api.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'morua-junction', time: nowIso() })
})
