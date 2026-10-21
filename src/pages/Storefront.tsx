import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../lib/api'
import type { Product, Store } from '../lib/api'
import {
  Badge,
  Empty,
  LandLocalPanel,
  PriceBandBar,
  ProductCard,
  SectionHead,
  Spinner,
} from '../components/bits'
import { dateOnly, dateTime, minutes, pula } from '../lib/format'
import { useCart } from '../App'

export default function Storefront() {
  const { slug } = useParams()
  const { add } = useCart()
  const [data, setData] = useState<{
    store: Store
    products: Product[]
    reviews: any[]
    shelfFreshness: any
    peerCompetition: any[]
    tradeable: boolean
  } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<'catalogue' | 'dossier' | 'reviews'>('catalogue')

  useEffect(() => {
    api
      .get(`/stores/${slug}`)
      .then(setData)
      .catch((e) => setError(e.message))
  }, [slug])

  const sections = useMemo(() => {
    if (!data) return []
    const map = new Map<string, Product[]>()
    for (const p of data.products) {
      const list = map.get(p.category) ?? []
      list.push(p)
      map.set(p.category, list)
    }
    return [...map.entries()]
  }, [data])

  if (error) return <Empty glyph="🏬" title="Shop not found" body={error} />
  if (!data) return <Spinner label="Opening the shop" />

  const s = data.store
  const pending = s.approval_status && s.approval_status !== 'approved'
  const stamps = s.card_stamps ?? 0
  const target = s.card_target ?? 8

  return (
    <div>
      <section
        style={{
          background: `linear-gradient(130deg, ${s.accent} 0%, ${s.accent}66 42%, rgba(11,21,34,0.4) 100%)`,
          padding: '2.6rem 0 2rem',
        }}
      >
        <div className="wrap">
          <div className="row gap-l wrapflex" style={{ alignItems: 'flex-start' }}>
            <div
              style={{
                width: '84px',
                height: '84px',
                display: 'grid',
                placeItems: 'center',
                fontSize: '2.6rem',
                background: 'rgba(0,0,0,0.28)',
                borderRadius: '20px',
                border: '1px solid rgba(255,255,255,0.22)',
              }}
            >
              {s.icon}
            </div>
            <div style={{ flex: 1, minWidth: '260px' }}>
              <div className="eyebrow">
                {s.kind === 'hub' ? 'Junction hub' : `Unit ${s.unit_label} · ${s.town}`}
              </div>
              <h1 style={{ fontSize: 'clamp(1.9rem, 3.6vw, 2.8rem)' }}>{s.name}</h1>
              <p className="hero-lede" style={{ marginTop: '0.5rem' }}>
                {s.tagline}
              </p>
              <div className="row gap-s wrapflex" style={{ marginTop: '1rem' }}>
                {pending ? (
                  <Badge tone="gold">⏳ Awaiting admin approval</Badge>
                ) : (
                  <Badge tone="green">✓ Verified retailer</Badge>
                )}
                <Badge tone="gold">★ {s.rating?.toFixed(1)} ({s.review_count})</Badge>
                <Badge tone="blue">🎯 {s.fulfilment_accuracy}% accuracy</Badge>
                <Badge tone="violet">⏱ {minutes(s.median_prep_minutes)} prep</Badge>
                <Badge>🏬 {s.area}</Badge>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="wrap section" style={{ paddingTop: '1.6rem' }}>
        {pending && (
          <div className="card" style={{ borderColor: 'rgba(227,172,80,0.4)', marginBottom: '1.4rem' }}>
            <div className="row gap">
              <span style={{ fontSize: '1.6rem' }}>⏳</span>
              <div>
                <div className="strong">This shop is waiting for the admin to approve its application</div>
                <p className="small muted" style={{ margin: '0.3rem 0 0' }}>
                  You can look around, but nothing can be ordered until the Junction admin has checked
                  the trade licence and the stock. {s.approval_note ? `Note: ${s.approval_note}` : ''}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="row gap wrapflex" style={{ marginBottom: '1.4rem' }}>
          {(
            [
              ['catalogue', `Catalogue (${data.products.length})`],
              ['dossier', 'The shop'],
              ['reviews', `Reviews (${data.reviews.length})`],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              className={`pill-toggle${tab === key ? ' active' : ''}`}
              onClick={() => setTab(key as any)}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'catalogue' && (
          <>
            {sections.map(([category, items]) => (
              <div key={category} style={{ marginBottom: '2.2rem' }}>
                <div className="row-between" style={{ marginBottom: '0.8rem' }}>
                  <h3>{category}</h3>
                  <span className="tiny muted">{items.length} items</span>
                </div>
                <div className="grid grid-4">
                  {items.map((p) => (
                    <ProductCard key={p.id} product={p} store={s} />
                  ))}
                </div>
              </div>
            ))}
            {data.products.length === 0 && (
              <Empty glyph="📦" title="The shelves are empty" body="This shop has not listed stock yet." />
            )}
          </>
        )}

        {tab === 'dossier' && (
          <div className="grid grid-2">
            <div className="card">
              <h3 style={{ marginBottom: '0.8rem' }}>The shop</h3>
              <p className="muted small">{s.story}</p>
              <div className="divider" />
              <div className="kv">
                <span className="muted">Address</span>
                <span className="strong" style={{ textAlign: 'right' }}>{s.address}</span>
              </div>
              <div className="kv">
                <span className="muted">Phone</span>
                <span className="strong mono">{s.phone}</span>
              </div>
              <div className="kv">
                <span className="muted">Hours</span>
                <span className="strong" style={{ textAlign: 'right' }}>{s.hours}</span>
              </div>
              <div className="kv">
                <span className="muted">Trading since</span>
                <span className="strong">{dateOnly(s.opened_on)}</span>
              </div>
              <div className="kv">
                <span className="muted">Verified</span>
                <span className="strong">{dateOnly(s.verified_at)}</span>
              </div>
              <div className="kv">
                <span className="muted">Delivery promise</span>
                <span className="strong" style={{ textAlign: 'right' }}>{s.delivery_promise}</span>
              </div>
              <div className="kv">
                <span className="muted">Returns</span>
                <span className="strong" style={{ textAlign: 'right' }}>{s.return_policy}</span>
              </div>
            </div>

            <div className="stack gap">
              <div className="card">
                <h3 style={{ marginBottom: '0.8rem' }}>Who you will meet</h3>
                {s.staff.map((person) => (
                  <div key={person.name} className="row-between" style={{ padding: '0.45rem 0' }}>
                    <span className="small strong">{person.name}</span>
                    <span className="tiny muted">{person.role}</span>
                  </div>
                ))}
              </div>

              <div className="card">
                <h3 style={{ marginBottom: '0.6rem' }}>Store Card&trade;</h3>
                <p className="small muted">
                  {stamps} of {target} stamps collected. Every ten completed orders earns a P50
                  credit against the next basket.
                </p>
                <div className="band-bar">
                  <div
                    className="band-fill"
                    style={{ width: `${Math.min(100, (stamps / Math.max(target, 1)) * 100)}%` }}
                  />
                </div>
                <div className="band-scale">
                  <span>{stamps} stamps</span>
                  <span>{target - stamps} to go</span>
                </div>
              </div>

              <div className="card">
                <h3 style={{ marginBottom: '0.6rem' }}>Live Shelf&trade;</h3>
                <p className="small muted">
                  Stock is synced from the shop&rsquo;s own system. Last sync{' '}
                  {data.shelfFreshness?.label ?? '—'}
                  {data.shelfFreshness?.minutes != null && ` (${data.shelfFreshness.minutes} min ago)`}.
                </p>
              </div>

              {data.peerCompetition.length > 0 && (
                <div className="card">
                  <h3 style={{ marginBottom: '0.6rem' }}>Same item elsewhere</h3>
                  {data.peerCompetition.slice(0, 6).map((peer: any) => (
                    <div key={peer.matchKey} className="kv">
                      <span className="muted small">{peer.matchKey.replace(/-/g, ' ')}</span>
                      <span className="small strong">
                        {peer.count} other {peer.count === 1 ? 'shop' : 'shops'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'reviews' && (
          <div className="stack gap">
            {data.reviews.map((r) => (
              <div key={r.id} className="card">
                <div className="row-between">
                  <span className="strong small">{r.author}</span>
                  <span className="gold small">{'★'.repeat(r.rating)}</span>
                </div>
                <p className="small" style={{ margin: '0.5rem 0 0' }}>{r.body}</p>
                <p className="tiny muted" style={{ margin: '0.4rem 0 0' }}>{dateTime(r.created_at)}</p>
              </div>
            ))}
            {data.reviews.length === 0 && (
              <Empty glyph="💬" title="No reviews yet" body="Be the first to say how it went." />
            )}
          </div>
        )}

        <div className="card" style={{ marginTop: '2rem' }}>
          <div className="row-between wrapflex gap">
            <div>
              <div className="strong">Ready to order from {s.name}?</div>
              <div className="small muted">
                Add items to the basket and check out once — one delivery fee across every shop.
              </div>
            </div>
            <Link to="/basket" className="btn btn-primary">
              Go to the basket
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
