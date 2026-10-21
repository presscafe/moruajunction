import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../lib/api'
import type { Product } from '../lib/api'
import { Badge, Empty, LandLocalPanel, PriceBandBar, Spinner } from '../components/bits'
import { pula, rand } from '../lib/format'
import { useCart } from '../App'

export default function ProductPage() {
  const { id } = useParams()
  const { add } = useCart()
  const [data, setData] = useState<{ product: Product; peers: any[]; tradeable: boolean } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)

  useEffect(() => {
    api
      .get(`/products/${id}`)
      .then(setData)
      .catch((e) => setError(e.message))
  }, [id])

  if (error) return <Empty glyph="⚠️" title="Product not found" body={error} />
  if (!data) return <Spinner label="Pulling the item off the shelf" />

  const p = data.product
  const s = p.store

  function addToBasket() {
    add(p.id, qty)
    setAdded(true)
    setTimeout(() => setAdded(false), 2200)
  }

  return (
    <div className="wrap section">
      <div className="row gap-s small muted" style={{ marginBottom: '1rem' }}>
        <Link to="/">Concourse</Link>
        <span>·</span>
        {s && <Link to={`/store/${s.slug}`}>{s.name}</Link>}
        <span>·</span>
        <span>{p.category}</span>
      </div>

      <div className="grid grid-2" style={{ alignItems: 'start' }}>
        <div>
          <div
            className="card center"
            style={{
              background: `linear-gradient(150deg, ${s?.accent_soft ?? '#eef1f5'}, #ffffff)`,
              minHeight: '260px',
              fontSize: '5.2rem',
            }}
          >
            {p.icon}
          </div>
          <div className="row gap-s wrapflex" style={{ marginTop: '0.9rem' }}>
            {p.is_special && <Badge tone="gold">Special price</Badge>}
            {p.landed?.localWins && <Badge tone="green">🏠 Cheaper than importing</Badge>}
            {p.shelf?.live && <Badge tone="blue">Live Shelf · {p.shelf.minutes} min</Badge>}
            {p.stock > 0 ? (
              <Badge tone="ink">{p.stock} in stock</Badge>
            ) : (
              <Badge tone="red">Out of stock</Badge>
            )}
          </div>
        </div>

        <div>
          <div className="eyebrow">{p.category}</div>
          <h1 style={{ fontSize: 'clamp(1.7rem, 3.2vw, 2.4rem)' }}>{p.name}</h1>
          <p className="muted" style={{ marginTop: '0.5rem' }}>{p.blurb}</p>

          <div className="row gap wrapflex" style={{ marginTop: '1rem', alignItems: 'baseline' }}>
            <span style={{ fontFamily: 'var(--serif)', fontSize: '2rem', fontWeight: 700 }}>
              {pula(p.price_pula)}
            </span>
            {p.was_price_pula && p.was_price_pula > p.price_pula && (
              <>
                <span className="price-was">{pula(p.was_price_pula)}</span>
                <span className="price-save">
                  save {pula(p.was_price_pula - p.price_pula)}
                </span>
              </>
            )}
            <span className="muted small">per {p.unit}</span>
          </div>

          <div className="row gap-s wrapflex" style={{ marginTop: '0.8rem' }}>
            <Badge tone="gold">★ {p.rating?.toFixed(1)} ({p.review_count})</Badge>
            <Badge tone="violet">{p.sold_count} sold</Badge>
            <Badge>{p.origin}</Badge>
            {s && <Badge tone="blue">🏬 {s.area}</Badge>}
          </div>

          <div className="card" style={{ marginTop: '1.3rem' }}>
            {data.tradeable === false ? (
              <div className="row gap">
                <span style={{ fontSize: '1.5rem' }}>⏳</span>
                <div>
                  <div className="strong">Waiting for admin approval</div>
                  <p className="small muted" style={{ margin: '0.3rem 0 0' }}>
                    This shop&rsquo;s application is still in the queue, so it cannot take orders yet.
                  </p>
                </div>
              </div>
            ) : (
              <div className="row gap wrapflex">
                <div className="row gap-s">
                  <button
                    className="btn btn-ghost"
                    onClick={() => setQty(Math.max(1, qty - 1))}
                    aria-label="Less"
                  >
                    −
                  </button>
                  <span className="strong" style={{ minWidth: '2rem', textAlign: 'center' }}>
                    {qty}
                  </span>
                  <button className="btn btn-ghost" onClick={() => setQty(qty + 1)} aria-label="More">
                    +
                  </button>
                </div>
                <button className="btn btn-primary grow" onClick={addToBasket}>
                  {added ? '✓ Added to the basket' : `Add to basket · ${pula(p.price_pula * qty)}`}
                </button>
              </div>
            )}
          </div>

          {s && (
            <Link
              to={`/store/${s.slug}`}
              className="card card-hover row gap"
              style={{ marginTop: '0.8rem' }}
            >
              <span style={{ fontSize: '2rem' }}>{s.icon}</span>
              <span className="grow">
                <span className="strong small" style={{ display: 'block' }}>{s.name}</span>
                <span className="tiny muted">{s.tagline}</span>
              </span>
              <span className="tiny gold nowrap">★ {s.rating?.toFixed(1)}</span>
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-2" style={{ marginTop: '2.4rem', alignItems: 'start' }}>
        <div>
          <h3 style={{ marginBottom: '0.8rem' }}>Land Local&trade;</h3>
          <LandLocalPanel landed={p.landed} />
          <p className="tiny muted" style={{ marginTop: '0.7rem' }}>
            Land Local compares the Botswana shelf price with the same item bought in South Africa
            and shipped in: freight, clearing, import duty and VAT at 14%, at today&rsquo;s rate.
          </p>
        </div>

        <div>
          <h3 style={{ marginBottom: '0.8rem' }}>Price Guard&trade;</h3>
          <div className="card">
            <PriceBandBar band={p.band} />
          </div>
          <p className="tiny muted" style={{ marginTop: '0.7rem' }}>
            Morua never rewrites a shop&rsquo;s price. It shows you what the same item costs at
            other shops in Botswana, so you can judge the price yourself.
          </p>
        </div>
      </div>

      {data.peers.length > 0 && (
        <div style={{ marginTop: '2.4rem' }}>
          <SectionHeadSmall title="The same item, elsewhere in Botswana" />
          <div className="panel">
            <table className="table">
              <thead>
                <tr>
                  <th>Shop</th>
                  <th>Town</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {data.peers.map((peer: any) => (
                  <tr key={peer.id}>
                    <td>
                      <span className="row gap-s">
                        <span>{peer.icon}</span>
                        <Link to={`/product/${peer.id}`} className="strong">
                          {peer.store_name}
                        </Link>
                      </span>
                    </td>
                    <td className="muted">{peer.store_area}</td>
                    <td className="strong">{pula(peer.price_pula)}</td>
                    <td className="muted">{peer.stock}</td>
                    <td>
                      <Link to={`/product/${peer.id}`} className="btn btn-ghost btn-sm">
                        Look
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="tiny muted" style={{ marginTop: '0.6rem' }}>
            South African shelf comparison: {rand(p.sa_price_zar)} at the source.
          </p>
        </div>
      )}
    </div>
  )
}

function SectionHeadSmall({ title }: { title: string }) {
  return <h3 style={{ marginBottom: '0.8rem' }}>{title}</h3>
}
