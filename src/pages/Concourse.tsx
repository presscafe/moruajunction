import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import type { Mall, Product } from '../lib/api'
import { pula, pulaShort } from '../lib/format'
import {
  Badge,
  Empty,
  ProductCard,
  SectionHead,
  SkeletonGrid,
  Spinner,
  Stat,
  StoreCard,
} from '../components/bits'

const CATEGORIES = [
  { key: 'Groceries & Staples', icon: '🛒' },
  { key: 'Fresh Produce & Butchery', icon: '🥩' },
  { key: 'Bakery & Deli', icon: '🥖' },
  { key: 'Beverages & Cellar', icon: '🥤' },
  { key: 'Home & Kitchen', icon: '🍳' },
  { key: 'Hardware & DIY', icon: '🔨' },
  { key: 'Health & Beauty', icon: '💊' },
  { key: 'Fashion', icon: '👗' },
  { key: 'Footwear', icon: '👟' },
  { key: 'Mobile & Tablets', icon: '📱' },
  { key: 'Computing & Gaming', icon: '💻' },
  { key: 'Tourism & Safari', icon: '🦁' },
  { key: 'Mining & Industrial', icon: '⛏️' },
  { key: 'Farm & Poultry', icon: '🐔' },
]

export default function Concourse() {
  const [mall, setMall] = useState<Mall | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [plan, setPlan] = useState<any>(null)
  const [greeting, setGreeting] = useState('')

  useEffect(() => {
    api
      .get<Mall>('/mall')
      .then(setMall)
      .catch((e) => setError(e.message))
    api.get('/mall/plan').then(setPlan).catch(() => setPlan(null))
    const hour = new Date().getHours()
    setGreeting(hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening')
  }, [])

  const storesByTown = useMemo(() => {
    if (!mall) return []
    const map = new Map<string, typeof mall.stores>()
    for (const s of mall.stores) {
      const list = map.get(s.town) ?? []
      list.push(s)
      map.set(s.town, list)
    }
    return [...map.entries()].sort((a, b) => b[1].length - a[1].length)
  }, [mall])

  const featured = useMemo(() => (mall?.stores ?? []).filter((s) => s.kind !== 'hub').slice(0, 8), [mall])
  const hub = useMemo(
    () =>
      (mall?.stores ?? []).find((s) => s.kind === 'hub' && s.town === 'Gaborone') ??
      (mall?.stores ?? []).find((s) => s.kind === 'hub'),
    [mall],
  )

  if (error) return <Empty glyph="⚠️" title="The mall is closed" body={error} />
  if (!mall) {
    return (
      <div className="wrap section">
        <div className="hero-stats" style={{ marginBottom: '2rem' }}>
          <Stat n="—" l="Shops trading" />
          <Stat n="—" l="Products listed" />
          <Stat n="—" l="Towns covered" />
        </div>
        <SkeletonGrid count={8} />
      </div>
    )
  }

  const landLocal = mall.specials.filter((p: Product) => p.landed?.localWins).length

  return (
    <>
      <section className="hero">
        <div className="wrap">
          <div className="eyebrow">{greeting} · {new Date().toLocaleDateString('en-BW', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
          <h1>
            Botswana&rsquo;s shops,
            <br />
            <span className="gold">all in one junction.</span>
          </h1>
          <p className="hero-lede">
            Morua Junction is a working mall you can walk through from your phone. Every product on
            it is already inside the country — bought from a verified shop in your own town, priced
            honestly, delivered by a named rider, or collected today.
          </p>
          <div className="row gap wrapflex" style={{ marginTop: '1.6rem' }}>
            <Link to="/map" className="btn btn-primary btn-lg">
              🗺 Open the Mall Map
            </Link>
            <Link to="/shop" className="btn btn-ghost btn-lg">
              Browse all {mall.stats.stores} shops
            </Link>
          </div>

          <div className="hero-stats">
            <Stat n={mall.stats.stores} l="Shops trading" />
            <Stat n={mall.stats.products} l="Products listed" />
            <Stat n={storesByTown.length} l="Towns covered" />
            <Stat n={mall.stats.orders} l="Orders placed" />
          </div>
        </div>
      </section>

      <div className="ticker">
        <div className="wrap" style={{ display: 'flex', gap: '2.5rem' }}>
          <span>Land Local™: {landLocal} specials on the board cost less here than landed</span>
          <span>Pula Promise™: delivery quoted before you pay</span>
          <span>Keeper&rsquo;s Ledger™: escrow held until you confirm</span>
          <span>One Basket, Many Shops™: one delivery fee across every shop</span>
        </div>
      </div>

      {hub && (
        <section className="section">
          <div className="wrap">
            <div
              className="card"
              style={{
                background: `linear-gradient(120deg, ${hub.accent}44, rgba(255,255,255,0.03))`,
                borderColor: `${hub.accent}66`,
                display: 'grid',
                gap: '1.4rem',
                gridTemplateColumns: 'minmax(240px, 1fr) minmax(280px, 1.4fr)',
              }}
            >
              <div>
                <div className="eyebrow">The hub</div>
                <h2 style={{ marginBottom: '0.6rem' }}>
                  {hub.icon} {hub.name}
                </h2>
                <p className="muted small">{hub.story}</p>
                <div className="row gap-s wrapflex" style={{ marginTop: '1rem' }}>
                  <Badge tone="green">✓ Verified retailer</Badge>
                  <Badge tone="gold">🏬 {hub.area}</Badge>
                  <Badge tone="blue">⏱ {hub.median_prep_minutes} min prep</Badge>
                </div>
              </div>
              <div>
                <div className="small muted" style={{ marginBottom: '0.6rem' }}>
                  <strong className="gold">Land Local&trade;</strong> — what importing the same item
                  would really cost, freight, duty and VAT included.
                </div>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Item on the board</th>
                      <th>Here</th>
                      <th>Landed cost</th>
                      <th>You keep</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mall.specials.slice(0, 5).map((p: Product) => (
                      <tr key={p.id}>
                        <td>
                          {p.icon} {p.name}
                        </td>
                        <td className="strong">{pula(p.price_pula)}</td>
                        <td className="muted">{pula(p.landed?.landedPula ?? 0)}</td>
                        <td className="green strong">
                          {p.landed?.localWins ? pula(p.landed.savingPula) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="section">
        <div className="wrap">
          <SectionHead
            eyebrow="Aisles"
            title="What are you after?"
            lede="Every aisle in the Junction, from the Gaborone flagship to the branch pavilions."
            action={
              <Link to="/shop" className="btn btn-ghost btn-sm">
                All shops →
              </Link>
            }
          />
          <div className="grid grid-4">
            {CATEGORIES.map((c) => (
              <Link
                key={c.key}
                to={`/shop?category=${encodeURIComponent(c.key)}`}
                className="card card-hover row gap"
                style={{ padding: '0.85rem 1rem' }}
              >
                <span style={{ fontSize: '1.5rem' }}>{c.icon}</span>
                <span className="small strong">{c.key}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {mall.specials.length > 0 && (
        <section className="section">
          <div className="wrap">
            <SectionHead
              eyebrow="The specials board"
              title="This week at the Junction"
              lede="Prices set by the shop, checked against what the same item costs elsewhere in Botswana."
              action={
                <Link to="/shop" className="btn btn-ghost btn-sm">
                  See everything →
                </Link>
              }
            />
            <div className="grid grid-4">
              {mall.specials.map((p: Product) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  store={mall.stores.find((s) => s.id === p.store_id)}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="section">
        <div className="wrap">
          <SectionHead
            eyebrow="The Junction"
            title="Shops worth walking into"
            lede="A cross-section of the traders on the platform right now."
            action={
              <Link to="/shop" className="btn btn-ghost btn-sm">
                All {mall.stats.stores} →
              </Link>
            }
          />
          <div className="grid grid-3">
            {featured.map((s) => (
              <StoreCard key={s.id} store={s} />
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <SectionHead
            eyebrow="Every district"
            title="Eighteen towns, one platform"
            lede="The Junction is not one building. Each town has its own pavilion, its own branch hub and its own delivery zone — and the same prices, ledger and promise everywhere."
          />
          <div className="town-grid">
            {storesByTown.map(([town, stores]) => (
              <Link
                key={town}
                to={`/shop?town=${encodeURIComponent(town)}`}
                className="town-chip"
                title={stores.map((s) => s.name).join(' · ')}
              >
                <span className="town-name">{town}</span>
                <span className="town-count">{stores.length}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {plan && (
        <section className="section">
          <div className="wrap">
            <SectionHead
              eyebrow="Mall Compass™"
              title="See the whole junction from above"
              lede="God's-eye view: every pavilion, every unit, and how far it is from the hub."
              action={
                <Link to="/map" className="btn btn-gold btn-ghost btn-sm">
                  Open the map →
                </Link>
              }
            />
            <div className="grid grid-3">
              {plan.floors.slice(0, 6).map((f: any) => {
                const units = plan.units.filter((u: any) => u.floorId === f.id)
                return (
                  <div key={f.id} className="card">
                    <div className="row-between">
                      <span className="strong">{f.name}</span>
                      <Badge tone="gold">{f.town ?? 'Gaborone'}</Badge>
                    </div>
                    <p className="tiny muted" style={{ margin: '0.4rem 0 0' }}>
                      {units.length} units · {f.tagline}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      <section className="section">
        <div className="wrap">
          <div className="card" style={{ textAlign: 'center', padding: '2.4rem' }}>
            <div className="eyebrow">Keeper&rsquo;s Ledger&trade;</div>
            <h2>Every pula accounted for</h2>
            <p className="muted" style={{ maxWidth: '60ch', margin: '0.8rem auto 1.4rem' }}>
              Morua keeps a double-entry ledger of every order: what the shopper paid, what the
              shop earns, what the rider is paid, and what the platform keeps. The money sits in
              escrow until you confirm the goods arrived.
            </p>
            <Link to="/admin#ledger" className="btn btn-ghost">
              See the ledger
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
