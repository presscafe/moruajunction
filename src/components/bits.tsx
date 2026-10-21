import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../App'
import type { Band, Landed, Product, Store } from '../lib/api'
import { minutes, pula, pulaShort } from '../lib/format'

/* ---------------------------------- badges --------------------------------- */

export function Badge({
  children,
  tone = 'default',
}: {
  children: React.ReactNode
  tone?: 'default' | 'gold' | 'green' | 'red' | 'blue' | 'violet' | 'ink'
}) {
  const cls = tone === 'default' ? 'badge' : `badge badge-${tone}`
  return <span className={cls}>{children}</span>
}

export function VerifiedBadge({ store }: { store: Partial<Store> }) {
  if (store.approval_status && store.approval_status !== 'approved') {
    return <Badge tone="gold">⏳ Awaiting admin approval</Badge>
  }
  if (store.verified_status === 'verified') {
    return <Badge tone="green">✓ Verified retailer</Badge>
  }
  return <Badge tone="blue">Applying to trade</Badge>
}

export function TownBadge({ town }: { town?: string }) {
  if (!town || town === 'Gaborone') return null
  return <Badge tone="violet">📍 {town}</Badge>
}

/* --------------------------------- store card -------------------------------- */

export function StoreCard({ store }: { store: Store }) {
  const pending = store.approval_status && store.approval_status !== 'approved'
  return (
    <Link to={`/store/${store.slug}`} className="store-card card-hover">
      <div
        className="store-banner"
        style={{ background: `linear-gradient(135deg, ${store.accent}, ${store.accent}55)` }}
      >
        <span className="glyph">{store.icon}</span>
        {store.unit_label && <span className="unit">{store.unit_label}</span>}
      </div>
      <div className="store-body">
        <div className="row-between gap-s">
          <span className="store-name">{store.name}</span>
          <span className="small gold">★ {store.rating?.toFixed(1)}</span>
        </div>
        <p className="store-tag">{store.tagline}</p>
        <div className="store-meta">
          <span>🏬 {store.area}</span>
          {store.town && store.town !== 'Gaborone' && <span>· {store.town}</span>}
          {store.median_prep_minutes > 0 && <span>· ⏱ {minutes(store.median_prep_minutes)}</span>}
        </div>
        <div className="store-foot">
          <VerifiedBadge store={store} />
          {pending ? (
            <span className="tiny muted">Not trading yet</span>
          ) : (
            <span className="tiny muted">{store.review_count} reviews</span>
          )}
        </div>
      </div>
    </Link>
  )
}

/* -------------------------------- product card ------------------------------- */

export function ProductCard({ product, store }: { product: Product; store?: Store }) {
  const sellable = product.stock > 0
  const special = product.is_special && product.special_pula
  const { add } = useCart()
  const [added, setAdded] = useState(false)
  function quickAdd(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!sellable) return
    add(product.id, 1)
    setAdded(true)
    setTimeout(() => setAdded(false), 1400)
  }
  return (
    <Link to={`/product/${product.id}`} className="product-card">
      <div
        className="product-top"
        style={{ background: `linear-gradient(150deg, ${store?.accent_soft ?? '#eef1f5'}, #ffffff)` }}
      >
        <span>{product.icon}</span>
        {special ? <span className="ribbon">Special · {pula(special)}</span> : null}
        {!sellable ? <span className="ribbon">Out of stock</span> : null}
        {sellable && (
          <button
            className={`quick-add${added ? ' done' : ''}`}
            onClick={quickAdd}
            aria-label={`Add ${product.name} to the basket`}
          >
            {added ? '✓' : '+'}
          </button>
        )}
      </div>
      <div className="product-body">
        <span className="product-name">{product.name}</span>
        <span className="product-blurb">{product.blurb}</span>
        <div className="price-row">
          <span className="price">{pula(product.price_pula)}</span>
          {product.was_price_pula && product.was_price_pula > product.price_pula && (
            <>
              <span className="price-was">{pula(product.was_price_pula)}</span>
              <span className="price-save">
                save {pula(product.was_price_pula - product.price_pula)}
              </span>
            </>
          )}
        </div>
        {product.landed?.localWins && (
          <span className="tiny" style={{ color: '#1c7a4a' }}>
            {pulaShort(product.landed.savingPula)} cheaper than importing
          </span>
        )}
        <div className="product-foot">
          <span className="tiny muted-ink">{store?.name ?? 'Morua Junction'}</span>
          <span className="tiny muted-ink">★ {product.rating?.toFixed(1)}</span>
        </div>
      </div>
    </Link>
  )
}

/* ------------------------------ Land Local panel ----------------------------- */

export function LandLocalPanel({ landed }: { landed: Landed }) {
  if (!landed) return null
  const wins = landed.localWins
  return (
    <div className="land-panel">
      <div
        className="land-head"
        style={{ background: wins ? 'rgba(61,145,96,0.16)' : 'rgba(207,83,64,0.16)' }}
      >
        <span className="land-verdict" style={{ color: wins ? '#7fd3a3' : '#f09483' }}>
          {wins ? '🏠 Buy it here' : '✈️ Importing is cheaper'}
        </span>
        <span className="tiny muted">
          {wins ? `${landed.savingPct}% below landed cost` : `${landed.landedMultiple}× landed cost`}
        </span>
      </div>
      <div className="land-rows">
        <div className="land-row">
          <span className="muted">Price here in Botswana</span>
          <span className="strong">{pula(landed.localPula)}</span>
        </div>
        <div className="land-row">
          <span className="muted">Same item in South Africa</span>
          <span>{pula(landed.saPula)}</span>
        </div>
        <div className="land-row">
          <span className="muted">Freight &amp; clearing</span>
          <span>+{pula(landed.freightPula + landed.clearingPula)}</span>
        </div>
        <div className="land-row">
          <span className="muted">Import duty</span>
          <span>+{pula(landed.dutyPula)}</span>
        </div>
        <div className="land-row">
          <span className="muted">VAT at 14%</span>
          <span>+{pula(landed.vatPula)}</span>
        </div>
        <div className="land-row land-total">
          <span>Landed cost if you imported it</span>
          <span>{pula(landed.landedPula)}</span>
        </div>
        <div className="land-row">
          <span className="muted">Lead time if you imported it</span>
          <span>
            {landed.leadDaysMin}–{landed.leadDaysMax} days
          </span>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------ Price Guard band ----------------------------- */

export function PriceBandBar({ band }: { band: Band }) {
  if (!band) return null
  const low = band.lowPula
  const high = band.highPula
  const span = Math.max(high - low, 1)
  const marker = band.position === 'only-offer' ? 50 : Math.min(96, Math.max(4, ((band.medianPula - low) / span) * 100))
  const tone =
    band.position === 'above' ? 'badge-red' : band.position === 'below' ? 'badge-blue' : 'badge-green'
  return (
    <div>
      <div className="row-between small">
        <span className="muted">Price Guard — what other shops charge</span>
        <Badge tone={tone as any}>
          {band.position === 'above'
            ? 'Above the band'
            : band.position === 'below'
              ? 'Below the band'
              : band.position === 'only-offer'
                ? 'Only offer'
                : 'Fair price'}
        </Badge>
      </div>
      <div className="band-bar">
        <div className="band-fill" />
        <div className="band-marker" style={{ left: `${marker}%` }} />
      </div>
      <div className="band-scale">
        <span>{pula(band.lowPula)}</span>
        <span>{pula(band.medianPula)} typical</span>
        <span>{pula(band.highPula)}</span>
      </div>
      <p className="tiny muted" style={{ marginTop: '0.5rem' }}>
        {band.advice}
      </p>
    </div>
  )
}

/* ----------------------------------- misc ---------------------------------- */

/** A skeleton card, used while the mall loads rather than a spinner. */
export function Skeleton({ paper = false, lines = 3 }: { paper?: boolean; lines?: number }) {
  return (
    <div className={paper ? 'skeleton-paper' : 'skeleton-card'}>
      <div className="skeleton-line tall" />
      <div className="sk-body">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={`skeleton-line ${i === 0 ? 'w-70' : i === lines - 1 ? 'w-40' : 'w-90'}`}
          />
        ))}
      </div>
    </div>
  )
}

export function SkeletonGrid({
  count = 8,
  paper = false,
}: {
  count?: number
  paper?: boolean
}) {
  return (
    <div className="grid grid-4">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} paper={paper} />
      ))}
    </div>
  )
}

export function Spinner({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="centered" style={{ padding: '3rem', gap: '0.6rem' }}>
      <span className="spin gold">◐</span>
      <span className="muted">{label}…</span>
    </div>
  )
}

export function Empty({ glyph = '🧭', title, body }: { glyph?: string; title: string; body?: string }) {
  return (
    <div className="empty">
      <div className="glyph">{glyph}</div>
      <h3>{title}</h3>
      {body && <p className="muted small">{body}</p>}
    </div>
  )
}

export function Stat({ n, l }: { n: React.ReactNode; l: string }) {
  return (
    <div className="hero-stat">
      <div className="n">{n}</div>
      <div className="l">{l}</div>
    </div>
  )
}

export function SectionHead({
  eyebrow,
  title,
  lede,
  action,
}: {
  eyebrow?: string
  title: string
  lede?: string
  action?: React.ReactNode
}) {
  return (
    <div className="section-head">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h2>{title}</h2>
        {lede && <p>{lede}</p>}
      </div>
      {action}
    </div>
  )
}
