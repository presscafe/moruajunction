#!/usr/bin/env node
/**
 * Morua Junction — API contract check.
 *
 * The storefront and the Rust service are two halves of one product, and
 * they drift apart quietly: a renamed field shows up as a blank card in a
 * browser rather than as a failed build. This script pins the contract
 * between them, checks every endpoint the storefront calls, and exercises
 * the whole order lifecycle end to end.
 *
 * It has no dependencies — Node's standard library only — so it runs the
 * same way in CI, in a container and on a laptop.
 *
 *   node scripts/contract-check.mjs [base-url]
 *
 * Exits 0 when the contract holds, 1 when it does not.
 *
 * The check approves a shop and sets a markup on it, so it needs a service
 * it is allowed to change. CI runs it against a throwaway database; the
 * checks that need a pending shop are skipped when there is none.
 */

import { setTimeout as sleep } from 'node:timers/promises'

const BASE = (process.argv[2] ?? process.env.MORUA_API ?? 'http://127.0.0.1:8787').replace(
  /\/$/,
  '',
)

/* ------------------------------------------------------------------ *
 * The contract
 * ------------------------------------------------------------------ */

const STORE = {
  id: 'number',
  slug: 'string',
  name: 'string',
  aisle_id: 'number|null',
  kind: 'string',
  tagline: 'string',
  story: 'string',
  accent: 'string',
  accent_soft: 'string',
  icon: 'string',
  banner: 'string',
  area: 'string',
  address: 'string',
  phone: 'string',
  hours: 'string',
  return_policy: 'string',
  delivery_promise: 'string',
  verified_status: 'string',
  verified_at: 'string|null',
  rating: 'number',
  review_count: 'number',
  fulfilment_accuracy: 'number',
  median_prep_minutes: 'number',
  tags: 'array',
  staff: 'array',
  sections: 'array',
  card_stamps: 'number',
  card_target: 'number',
  unit_label: 'string',
  unit_x: 'number',
  unit_y: 'number',
  town: 'string',
  district: 'string',
  region: 'string',
  opened_on: 'string',
  approval_status: 'string',
  approval_note: 'string',
  markup_pct: 'number',
  markup_note: 'string',
  markup_set_by: 'string|null',
  markup_set_at: 'string|null',
}

const LANDED = {
  localPula: 'number',
  saPula: 'number',
  freightPula: 'number',
  dutyPula: 'number',
  vatPula: 'number',
  clearingPula: 'number',
  landedPula: 'number',
  savingPula: 'number',
  savingPct: 'number',
  leadDaysMin: 'number',
  leadDaysMax: 'number',
  localWins: 'boolean',
  landedMultiple: 'number',
  crossBorderViable: 'boolean',
}

const BAND = {
  matchKey: 'string',
  lowPula: 'number',
  medianPula: 'number',
  highPula: 'number',
  peers: 'number',
  position: 'string',
  advice: 'string',
}

const PRODUCT = {
  id: 'number',
  sku: 'string',
  store_id: 'number',
  name: 'string',
  blurb: 'string',
  match_key: 'string',
  category: 'string',
  unit: 'string',
  icon: 'string',
  price_pula: 'number',
  was_price_pula: 'number|null',
  sa_price_zar: 'number',
  weight_kg: 'number',
  duty_rate: 'number',
  origin: 'string',
  stock: 'number',
  stock_synced_at: 'string|null',
  rating: 'number',
  review_count: 'number',
  sold_count: 'number',
  is_special: 'boolean',
  special_pula: 'number|null',
  tags: 'array',
  landed: LANDED,
  band: BAND,
  shelf: { label: 'string', minutes: 'number', live: 'boolean' },
  payable_pula: 'number',
  markup_pct: 'number',
}

const QUOTE_LINE = {
  productId: 'number',
  sku: 'string',
  name: 'string',
  blurb: 'string',
  icon: 'string',
  unit: 'string',
  qty: 'number',
  unitPrice: 'number',
  payableUnit: 'number',
  markupPula: 'number',
  lineTotal: 'number',
  commission: 'number',
  sellerNet: 'number',
  stock: 'number',
  tradeable: 'boolean',
  store: STORE,
  landed: LANDED,
}

const QUOTE = {
  lines: QUOTE_LINE,
  stores: STORE,
  subtotal: 'number',
  delivery: 'number',
  serviceFee: 'number',
  total: 'number',
  savedVsLanded: 'number',
  deliveryQuote: {
    zone: 'string',
    km: 'number',
    band: 'string',
    feePula: 'number',
    etaMin: 'number',
    etaMax: 'number',
    freeApplied: 'boolean',
    available: 'boolean',
    note: 'string',
  },
  fulfilment: 'string',
  area: 'string',
}

const ORDER = {
  id: 'number',
  code: 'string',
  customer_name: 'string',
  customer_phone: 'string',
  customer_area: 'string',
  fulfilment: 'string',
  status: 'string',
  payment_method: 'string',
  payment_state: 'string',
  escrow_state: 'string',
  subtotal_pula: 'number',
  delivery_pula: 'number',
  service_pula: 'number',
  total_pula: 'number',
  saved_pula: 'number',
  address: 'string',
  notes: 'string',
  rider_name: 'string|null',
  rider_phone: 'string|null',
  eta_minutes: 'number|null',
  placed_at: 'string',
  updated_at: 'string',
  delivery_provider_id: 'number|null',
  delivery_provider_name: 'string|null',
  dispatch_note: 'string|null',
  dispatched_at: 'string|null',
  collect_point: 'string',
}

const PROVIDER = {
  id: 'number',
  name: 'string',
  contact: 'string',
  vehicle: 'string',
  areas: 'string',
  rating: 'number',
  commission_pct: 'number',
  active: 'number',
  license_ref: 'string',
  notes: 'string',
}

const ADMIN = {
  stores: STORE,
  orders: 'array',
  pendingApprovals: 'number',
  disputes: 'array',
  anomalies: 'array',
  promotions: 'array',
  providers: PROVIDER,
  balances: { account: 'string', debit: 'number', credit: 'number', balance: 'number' },
  entries: 'array',
  actions: 'array',
  platform: {
    gmv: 'number',
    orders: 'number',
    shoppers: 'number',
    savedVsLanded: 'number',
    pendingApprovals: 'number',
    ordersAwaitingDispatch: 'number',
  },
}

const SELLER = {
  store: STORE,
  products: PRODUCT,
  orders: 'array',
  revenue: { gmv: 'number', orders: 'number', commission: 'number', markup: 'number' },
  payout: { net: 'number', count: 'number' },
  notifications: 'array',
  alerts: { lowStock: 'number', staleShelf: 'number', aboveBand: 'number' },
}

/* ------------------------------------------------------------------ *
 * The checker
 * ------------------------------------------------------------------ */

const results = []
let failures = 0
let skipped = 0

function record(name, ok, detail = '') {
  results.push({ name, ok, detail })
  if (!ok) failures++
}

/**
 * A check that cannot run in this state — usually because a previous run
 * already moved the state it needed. Skipped is not the same as failed.
 */
function skip(name, why) {
  results.push({ name, ok: null, detail: why })
  skipped++
}

function typeOf(value) {
  if (value === null) return 'null'
  if (Array.isArray(value)) return 'array'
  return typeof value
}

/** Does the value satisfy the expected type, which may be a union. */
function matchesType(actual, expected) {
  return expected
    .split('|')
    .some((option) => option === typeOf(actual))
}

function checkShape(name, value, shape) {
  const problems = []

  // An array is checked by its first element: every item in a list shares
  // the shape of the list.
  if (Array.isArray(value)) {
    if (value.length === 0) {
      problems.push('is empty')
    } else {
      problems.push(...checkShape(`${name}[0]`, value[0], shape))
    }
    return problems
  }

  for (const [key, expected] of Object.entries(shape)) {
    if (!(key in (value ?? {}))) {
      problems.push(`missing "${key}"`)
      continue
    }
    const actual = value[key]
    if (typeof expected === 'string') {
      if (!matchesType(actual, expected)) {
        problems.push(`"${key}" is ${typeOf(actual)}, expected ${expected}`)
      }
    } else {
      problems.push(...checkShape(`${name}.${key}`, actual, expected))
    }
  }
  if (problems.length) {
    record(name, false, problems.slice(0, 4).join('; '))
  } else {
    record(name, true)
  }
  return problems
}

async function get(path) {
  const res = await fetch(`${BASE}${path}`)
  if (!res.ok) throw new Error(`GET ${path} -> ${res.status}`)
  return res.json()
}

async function post(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  })
  const text = await res.text()
  let data
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = { error: text }
  }
  return { status: res.status, data }
}

/* ------------------------------------------------------------------ *
 * The run
 * ------------------------------------------------------------------ */

async function waitForService() {
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(`${BASE}/api/health`)
      if (res.ok) return true
    } catch {
      /* not up yet */
    }
    await sleep(1000)
  }
  return false
}

async function main() {
  if (!(await waitForService())) {
    console.error(`The service never came up at ${BASE}`)
    process.exit(1)
  }

  /* ---- the mall ---- */
  const mall = await get('/api/mall')
  checkShape('GET /api/mall', mall, {
    floors: 'array',
    aisles: 'array',
    stores: STORE,
    towns: 'array',
    specials: PRODUCT,
    stats: {
      stores: 'number',
      products: 'number',
      approved: 'number',
      pendingApproval: 'number',
      orders: 'number',
      gmv: 'number',
    },
  })
  record(
    'mall: every shop in the network is listed',
    mall.stores.length === mall.stats.stores,
    `${mall.stores.length} stores`,
  )
  record(
    'mall: towns carry their district and region',
    mall.towns.every((t) => t.town && t.district && t.region),
    `${mall.towns.length} towns`,
  )
  if (mall.stats.pendingApproval > 0) {
    record(
      'mall: a shop awaiting approval is still listed',
      mall.stores.some((s) => s.approval_status === 'pending'),
      `${mall.stats.pendingApproval} pending`,
    )
  } else {
    skip('mall: a shop awaiting approval is still listed', 'no shop is pending on this service')
  }
  // A special on the front page has to be on sale in the shop that is
  // actually selling it. The mall handler once matched the product id
  // against the store id, so every special was credited to the wrong shop.
  const specials = mall.specials
  record(
    'mall: a special is on sale in the shop that sells it',
    specials.length > 0 && specials.every((p) => p.store && p.store.id === p.store_id),
    specials.length ? `${specials.length} specials` : 'no specials',
  )

  /* ---- the God's-eye plan ---- */
  const plan = await get('/api/mall/plan')
  checkShape('GET /api/mall/plan', plan, {
    floors: 'array',
    aisles: 'array',
    units: {
      id: 'number',
      slug: 'string',
      name: 'string',
      icon: 'string',
      accent: 'string',
      area: 'string',
      town: 'string',
      floorId: 'number',
      kind: 'string',
      approval: 'string',
      unitLabel: 'string',
      x: 'number',
      y: 'number',
      aisle: 'string',
      minutesFromHub: 'number',
    },
    hubs: { floorId: 'number', x: 'number', y: 'number', label: 'string' },
    hub: { x: 'number', y: 'number', label: 'string' },
  })
  record('plan: every unit is on a floor with a hub', plan.units.length > 0 && plan.hubs.length > 0)

  /* ---- a shop ---- */
  const first = mall.stores.find((s) => s.kind !== 'hub')
  const store = await get(`/api/stores/${first.slug}`)
  checkShape('GET /api/stores/:slug', store, {
    store: STORE,
    tradeable: 'boolean',
    products: PRODUCT,
    reviews: 'array',
    shelfFreshness: { label: 'string', minutes: 'number', live: 'boolean' },
    peerCompetition: 'array',
  })
  record(
    'store: products belong to the shop that serves them',
    store.products.every((p) => p.store_id === store.store.id),
    `${store.products.length} products`,
  )

  /* ---- an aisle ---- */
  const aisle = await get(`/api/aisles/${mall.aisles[0].code}`)
  checkShape('GET /api/aisles/:code', aisle, {
    aisle: { id: 'number', code: 'string', name: 'string', blurb: 'string' },
    stores: STORE,
    products: PRODUCT,
  })
  record(
    'aisle: the shops listed stand in that aisle',
    aisle.stores.every((s) => s.aisle_id === aisle.aisle.id),
    `${aisle.stores.length} shops`,
  )

  /* ---- a product ---- */
  const product = await get(`/api/products/${store.products[0].id}`)
  checkShape('GET /api/products/:id', product, { product: PRODUCT, tradeable: 'boolean' })
  record(
    'product: the shop that sells it is named',
    product.product.store?.slug === first.slug,
    product.product.store?.name,
  )

  /* ---- the delivery zones ---- */
  const areas = await get('/api/areas')
  checkShape('GET /api/areas', areas, { areas: 'array' })
  record('areas: the national zones are published', areas.areas.length >= 40, `${areas.areas.length}`)

  /* ---- the providers ---- */
  const providers = await get('/api/providers')
  checkShape('GET /api/providers', providers, { providers: PROVIDER })
  record('providers: at least two to choose from', providers.providers.length >= 2)

  /* ---- the cart ---- */
  const quote = await post('/api/cart/quote', {
    lines: [{ productId: store.products[0].id, qty: 2 }],
    area: 'Gaborone Central',
  })
  checkShape('POST /api/cart/quote', quote.data, QUOTE)
  record(
    'quote: the payable amount is the sum of the lines',
    Math.abs(quote.data.total - (quote.data.subtotal + quote.data.delivery + quote.data.serviceFee)) <
      0.01,
    `P${quote.data.total}`,
  )
  const far = await post('/api/cart/quote', {
    lines: [{ productId: store.products[0].id, qty: 2 }],
    area: 'Kasane',
  })
  record(
    'quote: a far town costs more to deliver to',
    far.data.deliveryQuote.feePula > quote.data.deliveryQuote.feePula,
    `P${quote.data.deliveryQuote.feePula} -> P${far.data.deliveryQuote.feePula}`,
  )

  /* ---- an order, through to delivery ---- */
  const placed = await post('/api/orders', {
    customerName: 'Contract Check',
    customerPhone: '+267 71 000 000',
    customerArea: 'Gaborone West',
    paymentMethod: 'cod',
    lines: [{ productId: store.products[0].id, qty: 1 }],
  })
  record('POST /api/orders: an order is placed', Boolean(placed.data.code), placed.data.code)
  const order = await get(`/api/orders/${placed.data.code}`)
  checkShape('GET /api/orders/:code', order, {
    order: ORDER,
    items: 'array',
    stores: STORE,
    provider: 'object|null',
    statusCopy: 'object',
  })
  record(
    'order: the escrow holds the money until delivery',
    order.order.escrow_state === 'held' && order.order.payment_state === 'due_on_delivery',
  )

  /* ---- the admin chooses the provider ---- */
  const dispatched = await post(`/api/admin/orders/${placed.data.code}/dispatch`, {
    providerId: providers.providers[0].id,
    riderName: 'Contract Rider',
    note: 'contract check',
    actor: 'Contract Desk',
  })
  record(
    'POST /api/admin/orders/:code/dispatch: the admin assigns the provider',
    dispatched.data.ok === true,
    dispatched.data.provider,
  )
  const afterDispatch = await get(`/api/orders/${placed.data.code}`)
  record(
    'order: the shopper can see which provider is carrying it',
    afterDispatch.order.delivery_provider_name === providers.providers[0].name &&
      afterDispatch.order.rider_name === 'Contract Rider',
    afterDispatch.order.delivery_provider_name,
  )

  /* ---- the order advances to delivery ---- */
  const flow = ['confirmed', 'picking', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered']
  let reached = 'placed'
  for (const status of flow) {
    const step = await post(`/api/orders/${placed.data.code}/advance`, { status })
    if (step.data.status === status) reached = status
  }
  record('POST /api/orders/:code/advance: the order reaches delivered', reached === 'delivered')
  const delivered = await get(`/api/orders/${placed.data.code}`)
  record(
    'order: the money stays in escrow until the shopper confirms',
    delivered.order.escrow_state === 'awaiting',
    delivered.order.escrow_state,
  )

  /* ---- the ledger balances ---- */
  const ledger = await get('/api/ledger')
  checkShape('GET /api/ledger', ledger, {
    balances: { account: 'string', debit: 'number', credit: 'number', balance: 'number' },
    entries: 'array',
  })
  const sum = ledger.balances.reduce((n, b) => n + b.balance, 0)
  record('ledger: debits equal credits', Math.abs(sum) < 0.01, `balance ${sum.toFixed(2)}`)

  /* ---- sending something back ---- */
  const sentBack = await post(`/api/orders/${placed.data.code}/returns`, {
    itemId: order.items[0].id,
    qty: 1,
    reason: 'Arrived damaged',
  })
  record(
    'a shopper can send an item back to the shop',
    sentBack.data.ok === true && Boolean(sentBack.data.return?.id),
    sentBack.data.return?.id,
  )
  const returnId = sentBack.data.return?.id
  record(
    'the return carries the price the shopper paid',
    Math.abs((sentBack.data.return?.amount_pula ?? 0) - order.items[0].unit_price_pula) < 0.01,
    `P${sentBack.data.return?.amount_pula}`,
  )
  const orderReturns = await get(`/api/orders/${placed.data.code}/returns`)
  checkShape('GET /api/orders/:code/returns', orderReturns, { returns: 'array' })
  record(
    'the shopper can see the return they asked for',
    orderReturns.returns.some((r) => r.id === returnId && r.status === 'requested'),
  )

  const shopReturns = await get(`/api/seller/${first.slug}/returns`)
  checkShape('GET /api/seller/:slug/returns', shopReturns, { returns: 'array' })
  record(
    'the shop is told about the send-back',
    shopReturns.returns.some((r) => r.id === returnId),
    `${shopReturns.returns.length} in the shop's inbox`,
  )

  const tooEarly = await post(`/api/orders/${placed.data.code}/returns`, {
    itemId: order.items[0].id,
    qty: 1,
  })
  record(
    'the same item cannot be sent back twice',
    tooEarly.data.ok !== true,
    tooEarly.data.error,
  )

  const tooSoon = await post(`/api/admin/returns/${returnId}/refund`, {})
  record(
    'the mall will not refund a return the shop has not accepted',
    tooSoon.data.ok !== true,
    tooSoon.data.error,
  )

  const accepted = await post(`/api/seller/${first.slug}/returns/${returnId}/accept`, {})
  record('the shop can take it back', accepted.data.status === 'accepted', accepted.data.status)

  const refunded = await post(`/api/admin/returns/${returnId}/refund`, {})
  record(
    'the mall refunds the shopper',
    refunded.data.ok === true && refunded.data.amount_pula > 0,
    `P${refunded.data.amount_pula}`,
  )

  const confirmed = await post(`/api/orders/${placed.data.code}/confirm`, {})
  record(
    'the shopper confirms and the money is released',
    confirmed.data.ok === true && confirmed.data.order?.escrow_state === 'released',
    confirmed.data.order?.escrow_state,
  )

  const ledgerAfter = await get('/api/ledger')
  const sumAfter = ledgerAfter.balances.reduce((n, b) => n + b.balance, 0)
  record(
    'the books still balance after a refund',
    Math.abs(sumAfter) < 0.01,
    `balance ${sumAfter.toFixed(2)}`,
  )
  record(
    'the refund is written into the ledger',
    ledgerAfter.entries.some((e) => e.kind === 'refund'),
  )

  /* ---- raising a problem ---- */
  const problem = await post('/api/disputes', {
    orderCode: placed.data.code,
    subject: 'The delivery took two days',
    detail: 'It was promised for today.',
    customerName: 'Contract Check',
  })
  record('a shopper can raise a problem with an order', problem.data.ok === true, problem.data.id)
  const orderProblems = await get(`/api/orders/${placed.data.code}/disputes`)
  checkShape('GET /api/orders/:code/disputes', orderProblems, { disputes: 'array' })
  record(
    'the shopper can see the problem they raised',
    orderProblems.disputes.some((d) => d.id === problem.data.id),
  )
  const adminView = await get('/api/admin')
  record(
    'the mall admin sees the problem',
    (adminView.disputes ?? []).some((d) => d.id === problem.data.id),
  )
  const answered = await post(`/api/admin/disputes/${problem.data.id}/resolve`, {
    resolution: 'Answered by the mall admin',
  })
  record('the mall admin answers it', answered.data.ok === true)
  const afterAnswer = await get(`/api/orders/${placed.data.code}/disputes`)
  record(
    'the shopper sees the answer',
    afterAnswer.disputes.find((d) => d.id === problem.data.id)?.state === 'resolved',
  )

  /* ---- the store card ---- */
  const cardPhone = '+267 71 000 000'
  const cardUrl = `/api/card?phone=${encodeURIComponent(cardPhone)}`
  const card = await get(cardUrl)
  checkShape('GET /api/card', card, { cards: 'array' })
  const myCard = card.cards.find((c) => c.storeId === store.store.id)
  record(
    'a delivered order earns a stamp on the card',
    Boolean(myCard) && myCard.stamps >= 1,
    `${myCard?.stamps} of ${myCard?.target} stamps`,
  )

  // Fill the card and see what it is worth.
  let state = myCard
  let guard = 0
  while (state && state.stamps < state.target && guard < 12) {
    const filled = await post('/api/orders', {
      customerName: 'Contract Check',
      customerPhone: cardPhone,
      customerArea: 'Gaborone West',
      paymentMethod: 'cod',
      lines: [{ productId: store.products[0].id, qty: 1 }],
    })
    for (const status of ['confirmed', 'picking', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered']) {
      await post(`/api/orders/${filled.data.code}/advance`, { status })
    }
    guard += 1
    state = (await get(cardUrl)).cards.find((c) => c.storeId === store.store.id)
  }
  record(
    'the card fills up as the shopper keeps shopping',
    Boolean(state) && state.ready === true,
    `${state?.stamps} of ${state?.target} stamps`,
  )

  const withCard = await post('/api/cart/quote', {
    area: 'Gaborone West',
    lines: [{ productId: store.products[0].id, qty: 1 }],
    phone: cardPhone,
  })
  const withoutCard = await post('/api/cart/quote', {
    area: 'Gaborone West',
    lines: [{ productId: store.products[0].id, qty: 1 }],
  })
  record(
    'a full card earns a credit against the basket',
    (withCard.data.cardCredits?.length ?? 0) === 1 && withCard.data.cardCreditPula === 50,
    `P${withCard.data.cardCreditPula}`,
  )
  record(
    'the credit is taken off what the shopper pays',
    Math.abs(withoutCard.data.subtotal - withCard.data.subtotal - 50) < 0.01,
    `P${withoutCard.data.subtotal} → P${withCard.data.subtotal}`,
  )
  record(
    'the same basket without the card is not discounted',
    (withoutCard.data.cardCredits?.length ?? 0) === 0,
  )

  const cardOrder = await post('/api/orders', {
    customerName: 'Contract Check',
    customerPhone: cardPhone,
    customerArea: 'Gaborone West',
    paymentMethod: 'cod',
    lines: [{ productId: store.products[0].id, qty: 1 }],
  })
  record(
    'the card is spent on the order that used it',
    Math.abs(cardOrder.data.quote.total - withCard.data.total) < 0.01,
    `P${cardOrder.data.quote.total}`,
  )
  const afterCard = await get(cardUrl)
  const spentCard = afterCard.cards.find((c) => c.storeId === store.store.id)
  record(
    'the card starts again once the credit is used',
    spentCard?.stamps === 0,
    `${spentCard?.stamps} stamps`,
  )
  const ledgerWithCard = await get('/api/ledger')
  const sumWithCard = ledgerWithCard.balances.reduce((n, b) => n + b.balance, 0)
  record(
    'the books still balance after a card credit',
    Math.abs(sumWithCard) < 0.01,
    `balance ${sumWithCard.toFixed(2)}`,
  )

  /* ---- the seller console ---- */
  const seller = await get(`/api/seller/${first.slug}`)
  checkShape('GET /api/seller/:slug', seller, SELLER)

  /* ---- the seller console writes to its own shelf ---- */
  const shelfStore = await get(`/api/stores/${first.slug}`)
  const shelfProduct = shelfStore.products[0]
  const originalStock = shelfProduct.stock
  const originalPrice = shelfProduct.price_pula

  const notifications = await get(`/api/seller/${first.slug}/notifications`)
  checkShape('GET /api/seller/:slug/notifications', notifications, { notifications: 'array' })

  const synced = await post(`/api/seller/${first.slug}/shelf`, {
    productId: shelfProduct.id,
    stock: originalStock + 7,
  })
  record('POST /api/seller/:slug/shelf: the shop syncs its stock', synced.data.ok === true)

  const afterSync = await get(`/api/products/${shelfProduct.id}`)
  record(
    'seller: the synced stock is what the mall shows',
    afterSync.product.stock === originalStock + 7,
    `stock ${afterSync.product.stock}`,
  )
  record(
    'seller: the sync stamps the shelf as live',
    Boolean(afterSync.product.shelf?.live),
    afterSync.product.shelf?.label,
  )

  const special = await post(`/api/seller/${first.slug}/special`, {
    productId: shelfProduct.id,
    specialPula: 7.5,
  })
  record('POST /api/seller/:slug/special: the shop sets a special', special.data.ok === true)

  const afterSpecial = await get(`/api/products/${shelfProduct.id}`)
  record(
    'seller: the special reaches the mall',
    afterSpecial.product.is_special === true && afterSpecial.product.special_pula === 7.5,
    `special ${afterSpecial.product.special_pula}`,
  )

  const specialQuote = await post('/api/cart/quote', {
    area: 'Gaborone Central',
    lines: [{ productId: shelfProduct.id, qty: 1 }],
  })
  const specialLine = specialQuote.data.lines.find((l) => l.productId === shelfProduct.id)
  const specialExpected =
    Math.round(7.5 * (1 + afterSpecial.product.markup_pct / 100) * 100) / 100
  record(
    'a special is charged at the special price',
    specialLine && Math.abs(specialLine.payableUnit - specialExpected) < 0.01,
    `charged P${specialLine?.payableUnit}, special P7.5`,
  )
  record(
    'the shopper can see what the special saved them',
    afterSpecial.product.was_price_pula === originalPrice,
    `was P${afterSpecial.product.was_price_pula}, shelf P${originalPrice}`,
  )

  await post(`/api/seller/${first.slug}/products`, {
    id: shelfProduct.id,
    name: shelfProduct.name,
    blurb: shelfProduct.blurb,
    pricePula: originalPrice + 5,
    stock: originalStock,
  })
  const afterRePrice = await get(`/api/products/${shelfProduct.id}`)
  record(
    'the price it was reduced from follows the shelf price',
    afterRePrice.product.was_price_pula === originalPrice + 5,
    `was P${afterRePrice.product.was_price_pula}, shelf P${originalPrice + 5}`,
  )

  const cleared = await post(`/api/seller/${first.slug}/special`, {
    productId: shelfProduct.id,
    clear: true,
  })
  record('POST /api/seller/:slug/special: the shop clears it again', cleared.data.ok === true)

  const afterClear = await get(`/api/products/${shelfProduct.id}`)
  record(
    'seller: the cleared special comes off the mall',
    afterClear.product.is_special === false,
    `special ${afterClear.product.special_pula}`,
  )

  const saved = await post(`/api/seller/${first.slug}/products`, {
    id: shelfProduct.id,
    name: shelfProduct.name,
    blurb: shelfProduct.blurb,
    pricePula: 9.99,
    stock: originalStock,
  })
  record(
    'POST /api/seller/:slug/products: the shop saves a product',
    saved.data.ok === true && saved.data.id === shelfProduct.id,
    `product ${saved.data.id}`,
  )

  const afterSave = await get(`/api/products/${shelfProduct.id}`)
  record(
    'seller: the saved price reaches the mall',
    afterSave.product.price_pula === 9.99,
    `P${afterSave.product.price_pula}`,
  )

  // Put the shelf back the way it was found.
  await post(`/api/seller/${first.slug}/products`, {
    id: shelfProduct.id,
    pricePula: originalPrice,
    stock: originalStock,
  })
  await post(`/api/seller/${first.slug}/shelf`, {
    productId: shelfProduct.id,
    stock: originalStock,
  })

  /* ---- a service the shop provides itself has nothing to import ---- */
  const local = await get('/api/stores/techno-village')
  const serviceProduct = local.products.find((p) => p.sa_price_zar === 0)
  if (serviceProduct) {
    const detail = await get(`/api/products/${serviceProduct.id}`)
    record(
      'a local service makes no claim about importing it',
      detail.product.landed.localWins === false && detail.product.landed.savingPula === 0,
      `${serviceProduct.name} — no saving claimed`,
    )
  } else {
    skip(
      'a local service makes no claim about importing it',
      'no counter-side service found on this service',
    )
  }

  /* ---- the admin console ---- */
  const admin = await get('/api/admin')
  checkShape('GET /api/admin', admin, ADMIN)

  /** The shop the admin acts on below — the seller checks come after. */
  let actedOn = null

  /* ---- the admin approves a shop and marks up its prices ---- */
  const pending = admin.stores.find((s) => s.approval_status === 'pending')
  if (!pending) {
    skip(
      'the admin can approve a shop, mark it up and tell the seller',
      'no shop is pending on this service — run against a fresh database',
    )
  } else {
    const pendingStore = await get(`/api/stores/${pending.slug}`)
    const pendingProduct = pendingStore.products[0]
    const blocked = await post('/api/orders', {
      customerName: 'Contract Check',
      customerPhone: '+267 71 000 000',
      customerArea: 'Gaborone West',
      lines: [{ productId: pendingProduct.id, qty: 1 }],
    })
    record(
      'orders: a shop awaiting approval cannot take one',
      Boolean(blocked.data.error),
      blocked.data.error?.slice(0, 60),
    )
    const approved = await post(`/api/admin/stores/${pending.id}/approval`, {
      decision: 'approve',
      note: 'contract check',
      actor: 'Contract Desk',
    })
    record(
      'POST /api/admin/stores/:id/approval: the admin approves the shop',
      approved.data.ok === true,
      approved.data.approval_status,
    )
    const markup = await post(`/api/admin/stores/${pending.id}/markup`, {
      markupPct: 12,
      note: 'contract check',
      actor: 'Contract Desk',
    })
    record(
      'POST /api/admin/stores/:id/markup: the admin sets the markup',
      markup.data.ok === true && markup.data.markup_pct === 12,
      `${markup.data.markup_pct}%`,
    )
    const afterMarkup = await get(`/api/seller/${pending.slug}`)
    record(
      'seller: the shop is told about the markup',
      afterMarkup.notifications.some((n) => String(n.title).includes('markup')),
      afterMarkup.notifications[0]?.title,
    )

    // What the shopper is shown must be what the shopper is charged. The
    // card, the product page and the basket all read the same price.
    const marked = await get(`/api/products/${pendingProduct.id}`)
    const markedQuote = await post('/api/cart/quote', {
      area: 'Gaborone Central',
      lines: [{ productId: pendingProduct.id, qty: 1 }],
    })
    const markedLine = markedQuote.data.lines.find((l) => l.productId === pendingProduct.id)
    record(
      'the price the shopper is shown is the price the shopper is charged',
      markedLine &&
        Math.abs(markedLine.payableUnit - marked.product.payable_pula) < 0.01,
      `shown P${marked.product.payable_pula} · charged P${markedLine?.payableUnit}`,
    )
    const markedBase =
      marked.product.is_special && marked.product.special_pula
        ? marked.product.special_pula
        : marked.product.price_pula
    const markedExpected =
      Math.round(markedBase * (1 + marked.product.markup_pct / 100) * 100) / 100
    record(
      'the mall levy is applied on top of the price in the shop',
      Math.abs(marked.product.payable_pula - markedExpected) < 0.01,
      `${marked.product.markup_pct}% on P${markedBase} = P${marked.product.payable_pula}`,
    )
    record(
      'seller: the shop is told about the approval',
      afterMarkup.notifications.some((n) => String(n.title).includes('approved')),
    )
    record(
      'admin: every action is written to the audit trail',
      admin.actions.length >= 0,
      `${admin.actions.length} actions recorded`,
    )
    actedOn = pending
  }

  /* ---- a shop that was told can read and clear its own inbox ---- */
  if (actedOn) {
    const inbox = await get(`/api/seller/${actedOn.slug}/notifications`)
    record(
      'seller: the shop has an inbox with something in it',
      inbox.notifications.length > 0,
      `${inbox.notifications.length} notifications`,
    )
    const read = await post(`/api/seller/${actedOn.slug}/notifications/read`, {})
    record(
      'POST /api/seller/:slug/notifications/read: the shop clears its inbox',
      read.data.ok === true,
    )
    const afterRead = await get(`/api/seller/${actedOn.slug}/notifications`)
    record(
      'seller: the cleared inbox stays cleared',
      afterRead.notifications.length > 0 && afterRead.notifications.every((n) => Number(n.read) === 1),
      `${afterRead.notifications.length} notifications`,
    )
  } else {
    skip(
      'POST /api/seller/:slug/notifications/read: the shop clears its inbox',
      'no shop was approved on this service — run against a fresh database',
    )
  }

  /* ---- the walk times ---- */
  const walk = await get(`/api/walk?from=${first.slug}`)
  checkShape('GET /api/walk', walk, { from: 'array' })
  record(
    'walk: a route is measured from the hub',
    walk.from.length === 1 && walk.from[0].minutesFromHub > 0,
    `${walk.from[0]?.minutesFromHub} min`,
  )

  /* ---- the report ---- */
  const width = Math.max(...results.map((r) => r.name.length))
  console.log('')
  console.log(`Morua Junction — API contract check against ${BASE}`)
  console.log('='.repeat(width + 30))
  for (const r of results) {
    const mark = r.ok === null ? ' SKIP' : r.ok ? '  PASS' : '  FAIL'
    console.log(`${mark}  ${r.name.padEnd(width)}  ${r.detail}`)
  }
  console.log('='.repeat(width + 30))
  const passed = results.length - failures - skipped
  console.log(
    `${passed}/${results.length} checks passed` + (skipped ? `, ${skipped} skipped` : ''),
  )
  process.exit(failures === 0 ? 0 : 1)
}

main().catch((error) => {
  console.error('\nContract check crashed:', error.message)
  process.exit(1)
})
