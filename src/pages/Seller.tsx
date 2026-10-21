import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../lib/api'
import type { Product, Store } from '../lib/api'
import { Badge, Empty, PriceBandBar, SectionHead, Spinner, Stat } from '../components/bits'
import { dateTime, pula, pulaShort } from '../lib/format'

export default function Seller() {
  const { slug } = useParams()
  if (!slug) return <SellerPicker />
  return <SellerConsole slug={slug} />
}

function SellerPicker() {
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .get<{ stores: Store[] }>('/stores')
      .then((r) => setStores(r.stores ?? []))
      .catch(() => setStores([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner label="Opening the seller console" />

  return (
    <div className="wrap section">
      <SectionHead
        eyebrow="Seller console"
        title="Your shop on the Junction"
        lede="Pick the shop you run. Every shop manager gets their own console: catalogue, prices, live shelf, orders and the ledger of what you have earned."
      />
      <div className="grid grid-3">
        {stores.map((s) => (
          <Link key={s.id} to={`/seller/${s.slug}`} className="card card-hover">
            <div className="row gap-s">
              <span style={{ fontSize: '1.8rem' }}>{s.icon}</span>
              <span className="grow">
                <span className="strong" style={{ display: 'block' }}>
                  {s.name}
                </span>
                <span className="tiny muted">
                  {s.town} · {s.area}
                </span>
              </span>
            </div>
            <div className="row gap-s wrapflex" style={{ marginTop: '0.7rem' }}>
              {s.approval_status === 'approved' ? (
                <Badge tone="green">Approved to trade</Badge>
              ) : s.approval_status === 'pending' ? (
                <Badge tone="gold">Awaiting admin approval</Badge>
              ) : (
                <Badge tone="red">Application declined</Badge>
              )}
              {(s.markup_pct ?? 0) > 0 && <Badge tone="gold">{s.markup_pct}% mall levy</Badge>}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

function SellerConsole({ slug }: { slug: string }) {
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [editing, setEditing] = useState<number | null>(null)
  const [price, setPrice] = useState('')
  const [flash, setFlash] = useState<string | null>(null)

  function say(m: string) {
    setFlash(m)
    setTimeout(() => setFlash(null), 2600)
  }

  function load() {
    api
      .get(`/seller/${slug}`)
      .then(setData)
      .catch((e) => setError(e.message))
  }

  useEffect(load, [slug])

  const unread = useMemo(
    () => (data?.notifications ?? []).filter((n: any) => !n.read_at).length,
    [data],
  )

  if (error) return <Empty glyph="⚠️" title="Shop not found" body={error} />
  if (!data) return <Spinner label="Opening the console" />

  const s: Store = data.store
  const pending = s.approval_status === 'pending'
  const declined = s.approval_status === 'declined'

  async function savePrice(product: Product) {
    setBusy(`price-${product.id}`)
    try {
      await api.post(`/seller/${slug}/products`, {
        id: product.id,
        pricePula: Number(price),
      })
      setEditing(null)
      load()
      say(`${product.name} is now ${pula(Number(price))}`)
    } catch (e: any) {
      say(e.message)
    } finally {
      setBusy(null)
    }
  }

  async function syncShelf() {
    setBusy('shelf')
    try {
      await api.post(`/seller/${slug}/shelf`, {})
      load()
      say('Live Shelf™ synced — stock is fresh again')
    } catch (e: any) {
      say(e.message)
    } finally {
      setBusy(null)
    }
  }

  async function toggleSpecial(product: Product) {
    setBusy(`special-${product.id}`)
    try {
      await api.post(`/seller/${slug}/special`,
        product.is_special
          ? { productId: product.id, clear: true }
          : { productId: product.id, specialPula: Math.round(product.price_pula * 0.9 * 100) / 100 },
      )
      load()
      say(product.is_special ? `${product.name} is off special` : `${product.name} is on special`)
    } catch (e: any) {
      say(e.message)
    } finally {
      setBusy(null)
    }
  }

  async function readNotifications() {
    await api.post(`/seller/${slug}/notifications/read`, {})
    load()
  }

  return (
    <div className="wrap section">
      {flash && <div className="toast">{flash}</div>}

      <div className="row-between wrapflex gap" style={{ marginBottom: '1.2rem' }}>
        <div className="row gap">
          <span style={{ fontSize: '2.4rem' }}>{s.icon}</span>
          <div>
            <div className="eyebrow">Seller console</div>
            <h1 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)' }}>{s.name}</h1>
            <div className="row gap-s wrapflex" style={{ marginTop: '0.4rem' }}>
              {pending ? (
                <Badge tone="gold">⏳ Awaiting admin approval</Badge>
              ) : declined ? (
                <Badge tone="red">Application declined</Badge>
              ) : (
                <Badge tone="green">✓ Approved to trade</Badge>
              )}
              <Badge tone="violet">{s.town}</Badge>
              <Badge tone="ink">unit {s.unit_label}</Badge>
              {(s.markup_pct ?? 0) > 0 && (
                <Badge tone="gold">
                  {s.markup_pct}% mall levy{s.markup_note ? ` — ${s.markup_note}` : ''}
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="row gap-s wrapflex">
          <button className="btn btn-ghost" onClick={syncShelf} disabled={busy === 'shelf'}>
            {busy === 'shelf' ? 'Syncing…' : '🔄 Sync Live Shelf'}
          </button>
          <Link to={`/store/${s.slug}`} className="btn btn-ghost">
            View storefront
          </Link>
        </div>
      </div>

      {(pending || declined) && (
        <div className="card" style={{ marginBottom: '1.4rem', borderColor: 'rgba(227,172,80,0.4)' }}>
          <div className="row gap">
            <span style={{ fontSize: '1.6rem' }}>{pending ? '⏳' : '🚫'}</span>
            <div>
              <div className="strong">
                {pending
                  ? 'Your application is with the Junction admin'
                  : 'Your application was declined'}
              </div>
              <p className="small muted" style={{ margin: '0.3rem 0 0' }}>
                {pending
                  ? 'You can prepare your catalogue while you wait. Nothing can be ordered until an admin approves the shop.'
                  : s.approval_note || 'The admin left no note. Speak to the Junction admin to reapply.'}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="hero-stats" style={{ marginTop: '0.6rem' }}>
        <Stat n={pulaShort(data.revenue.gmv)} l="Sales through the Junction" />
        <Stat n={data.revenue.orders} l="Orders" />
        <Stat n={pulaShort(data.revenue.commission)} l="Mall commission" />
        <Stat n={pulaShort(data.revenue.markup)} l="Mall levy collected" />
        <Stat n={pulaShort(data.payout.net)} l={`Payouts scheduled (${data.payout.count})`} />
        <Stat n={data.alerts.lowStock} l="Low stock lines" />
      </div>

      {(data.notifications?.length ?? 0) > 0 && (
        <div className="panel" style={{ marginTop: '1.6rem' }}>
          <div className="panel-head">
            <span className="strong">Messages from the Junction admin</span>
            <div className="row gap-s">
              {unread > 0 && <Badge tone="red">{unread} new</Badge>}
              <button className="btn btn-ghost btn-sm" onClick={readNotifications}>
                Mark all read
              </button>
            </div>
          </div>
          <div className="panel-body">
            {data.notifications.map((n: any) => (
              <div
                key={n.id}
                className="row gap"
                style={{
                  padding: '0.6rem 0',
                  borderBottom: '1px solid var(--line)',
                  opacity: n.read_at ? 0.6 : 1,
                }}
              >
                <Badge tone={n.kind === 'markup' ? 'gold' : n.kind === 'approval' ? 'green' : 'blue'}>
                  {n.kind}
                </Badge>
                <span className="grow">
                  <span className="small strong" style={{ display: 'block' }}>
                    {n.title}
                  </span>
                  <span className="tiny muted">{n.body}</span>
                </span>
                <span className="tiny muted nowrap">{dateTime(n.created_at)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1.6fr) minmax(280px, 1fr)', marginTop: '1.8rem' }}>
        <div className="panel">
          <div className="panel-head">
            <span className="strong">Catalogue</span>
            <span className="tiny muted">{data.products.length} lines</span>
          </div>
          <div className="panel-body" style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Your price</th>
                  <th>Peers</th>
                  <th>Stock</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {data.products.map((p: Product) => (
                  <tr key={p.id}>
                    <td>
                      <span className="row gap-s">
                        <span>{p.icon}</span>
                        <span>
                          <span className="strong small" style={{ display: 'block' }}>
                            {p.name}
                          </span>
                          <span className="tiny muted">{p.category}</span>
                        </span>
                      </span>
                    </td>
                    <td>
                      {editing === p.id ? (
                        <span className="row gap-s">
                          <input
                            className="input"
                            style={{ width: '110px' }}
                            type="number"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                          />
                          <button
                            className="btn btn-primary btn-sm"
                            disabled={busy === `price-${p.id}`}
                            onClick={() => savePrice(p)}
                          >
                            Save
                          </button>
                        </span>
                      ) : (
                        <span className="row gap-s">
                          <span className="strong">{pula(p.price_pula)}</span>
                          {(p.markup_pct ?? 0) > 0 && (
                            <span className="tiny gold">
                              +{p.markup_pct}% → billed {pula(p.payable_pula)}
                            </span>
                          )}
                        </span>
                      )}
                    </td>
                    <td className="tiny muted">
                      {p.band?.peers ?? 0} peer
                      {p.band?.peers === 1 ? '' : 's'}
                      <br />
                      <span
                        style={{
                          color:
                            p.band?.position === 'above'
                              ? 'var(--red)'
                              : p.band?.position === 'below'
                                ? 'var(--blue)'
                                : 'var(--green)',
                        }}
                      >
                        {p.band?.position}
                      </span>
                    </td>
                    <td>
                      {p.stock <= 5 ? (
                        <Badge tone="red">{p.stock} left</Badge>
                      ) : (
                        <span className="muted small">{p.stock}</span>
                      )}
                    </td>
                    <td>
                      <span className="row gap-s nowrap">
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => {
                            setEditing(p.id)
                            setPrice(String(p.price_pula))
                          }}
                        >
                          Price
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          disabled={busy === `special-${p.id}`}
                          onClick={() => toggleSpecial(p)}
                        >
                          {p.is_special ? 'Unspecial' : 'Special'}
                        </button>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="stack gap">
          <div className="panel">
            <div className="panel-head">
              <span className="strong">Recent orders</span>
            </div>
            <div className="panel-body">
              {data.orders.length === 0 && <p className="muted small">No orders yet.</p>}
              {data.orders.map((o: any) => (
                <div key={o.id} className="kv">
                  <span>
                    <span className="mono small strong">{o.code}</span>
                    <span className="tiny muted" style={{ display: 'block' }}>
                      {o.customer_name} · {o.customer_area} · {dateTime(o.placed_at)}
                    </span>
                  </span>
                  <span className="row gap-s">
                    <Badge tone={o.status === 'delivered' ? 'green' : 'gold'}>{o.status}</Badge>
                    <span className="small strong">{pula(o.total_pula)}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h3 style={{ marginBottom: '0.6rem' }}>Price Guard&trade;</h3>
            <p className="small muted">
              Morua compares your price with what the same item costs at other shops in Botswana.
              It never changes your price — it shows the shopper what else is on the shelf, and
              warns the admin when a price sits above the band.
            </p>
            {data.products[0] && <PriceBandBar band={data.products[0].band} />}
          </div>

          <div className="card">
            <h3 style={{ marginBottom: '0.6rem' }}>Your payout</h3>
            <div className="kv">
              <span className="muted">Scheduled</span>
              <span className="strong">{pula(data.payout.net)}</span>
            </div>
            <div className="kv">
              <span className="muted">Commission paid</span>
              <span className="strong">{pula(data.revenue.commission)}</span>
            </div>
            <div className="kv">
              <span className="muted">Mall levy collected</span>
              <span className="strong gold">{pula(data.revenue.markup)}</span>
            </div>
            <p className="tiny muted" style={{ marginTop: '0.6rem' }}>
              Keeper&rsquo;s Ledger&trade; posts a balanced entry for every order. Your net is
              released when the shopper confirms delivery.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
