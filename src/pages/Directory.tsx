import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../lib/api'
import type { Store } from '../lib/api'
import { Badge, Empty, SectionHead, Spinner, StoreCard } from '../components/bits'

export default function Directory() {
  const [params, setParams] = useSearchParams()
  const [stores, setStores] = useState<Store[]>([])
  const [towns, setTowns] = useState<{ town: string; district: string; region: string; stores: number }[]>([])
  const [loading, setLoading] = useState(true)

  const town = params.get('town') ?? ''
  const q = params.get('q') ?? ''
  const category = params.get('category') ?? ''

  useEffect(() => {
    api
      .get<{ towns: any[] }>('/mall')
      .then((m) => setTowns(m.towns ?? []))
      .catch(() => setTowns([]))
  }, [])

  useEffect(() => {
    setLoading(true)
    const search = new URLSearchParams()
    if (town) search.set('town', town)
    if (q) search.set('q', q)
    api
      .get<{ stores: Store[] }>(`/stores${search.toString() ? `?${search}` : ''}`)
      .then((r) => setStores(r.stores ?? []))
      .catch(() => setStores([]))
      .finally(() => setLoading(false))
  }, [town, q])

  const visible = useMemo(() => {
    if (!category) return stores
    const needle = category.toLowerCase().split(' ')[0].toLowerCase()
    return stores.filter((s) => JSON.stringify(s.tags).toLowerCase().includes(needle))
  }, [stores, category])

  const grouped = useMemo(() => {
    const map = new Map<string, Store[]>()
    for (const s of visible) {
      const list = map.get(s.town) ?? []
      list.push(s)
      map.set(s.town, list)
    }
    return [...map.entries()].sort((a, b) => b[1].length - a[1].length)
  }, [visible])

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next)
  }

  return (
    <div className="wrap section">
      <SectionHead
        eyebrow="The directory"
        title="Every shop on the Junction"
        lede={`${visible.length} shops across ${grouped.length} towns. Nothing is hidden: a shop still waiting on the admin approval queue is listed and badged, never quietly dropped.`}
      />

      <div className="row gap wrapflex" style={{ marginBottom: '1.2rem' }}>
        <input
          className="input"
          style={{ maxWidth: '280px' }}
          placeholder="Search shops…"
          value={q}
          onChange={(e) => setParam('q', e.target.value)}
        />
        <button
          className={`pill-toggle${!town ? ' active' : ''}`}
          onClick={() => setParam('town', '')}
        >
          All towns
        </button>
        {towns.map((t) => (
          <button
            key={t.town}
            className={`pill-toggle${town === t.town ? ' active' : ''}`}
            onClick={() => setParam('town', t.town)}
          >
            {t.town} <span style={{ opacity: 0.7 }}>· {t.stores}</span>
          </button>
        ))}
      </div>

      {category && (
        <div className="row gap" style={{ marginBottom: '1rem' }}>
          <Badge tone="gold">{category}</Badge>
          <button className="btn btn-ghost btn-sm" onClick={() => setParam('category', '')}>
            Clear
          </button>
        </div>
      )}

      {loading ? (
        <Spinner label="Walking the aisles" />
      ) : visible.length === 0 ? (
        <Empty glyph="🔍" title="Nothing matches that" body="Try a different town or search term." />
      ) : (
        grouped.map(([townName, list]) => (
          <div key={townName} style={{ marginBottom: '2.2rem' }}>
            <div className="row-between" style={{ marginBottom: '0.8rem' }}>
              <h3>{townName}</h3>
              <Badge tone="violet">{list.length} shops</Badge>
            </div>
            <div className="grid grid-3">
              {list.map((s) => (
                <StoreCard key={s.id} store={s} />
              ))}
            </div>
          </div>
        ))
      )}

      <div className="card center" style={{ marginTop: '2rem' }}>
        <h3>Trade on Morua Junction</h3>
        <p className="muted small" style={{ maxWidth: '52ch', margin: '0.6rem auto 1rem' }}>
          Every shop starts as an application. The Junction admin reviews it, checks the trade
          licence and the stock, then approves the shop to trade. Approved shops get a verified
          badge, a place on the floor plan and a place in the ledger.
        </p>
        <Link to="/seller" className="btn btn-primary">
          Open a seller console
        </Link>
      </div>
    </div>
  )
}
