import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../lib/api'
import type { Order } from '../lib/api'
import { Badge, Empty, Spinner } from '../components/bits'
import { dateTime, minutes, pula } from '../lib/format'

const STEPS = [
  { key: 'placed', label: 'Order placed', note: 'The shop has it' },
  { key: 'confirmed', label: 'Confirmed by the shop', note: 'Stock checked, price agreed' },
  { key: 'picking', label: 'Being picked', note: 'The shop is putting the basket together' },
  { key: 'picked_up', label: 'Collected by the rider', note: 'A named provider has it' },
  { key: 'in_transit', label: 'On the road', note: 'Moving to your address' },
  { key: 'out_for_delivery', label: 'Out for delivery', note: 'Arriving today' },
  { key: 'delivered', label: 'Delivered', note: 'Money released from escrow' },
]

export default function OrderPage() {
  const { code } = useParams()
  const [order, setOrder] = useState<Order | null>(null)
  const [items, setItems] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    api
      .get(`/orders/${code}`)
      .then((r: any) => {
        setOrder(r.order)
        setItems(r.items ?? [])
      })
      .catch((e) => setError(e.message))
  }, [code])

  async function advance() {
    setBusy(true)
    try {
      const r: any = await api.post(`/orders/${code}/advance`, {})
      setOrder(r.order)
      setItems(r.items ?? [])
    } catch {
      /* leave the state as it is */
    } finally {
      setBusy(false)
    }
  }

  if (error) return <Empty glyph="⚠️" title="Order not found" body={error} />
  if (!order) return <Spinner label="Finding your order" />

  const index = STEPS.findIndex((s) => s.key === order.status)
  const active = index < 0 ? 0 : index

  return (
    <div className="wrap-narrow section">
      <div className="eyebrow">Order {order.code}</div>
      <h1 style={{ fontSize: 'clamp(1.7rem, 3.2vw, 2.4rem)', marginBottom: '0.4rem' }}>
        {order.status === 'delivered' ? 'Delivered' : 'On its way'}
      </h1>
      <p className="muted">
        Placed {dateTime(order.placed_at)} · {order.customer_area} · {order.fulfilment}
      </p>

      <div className="card" style={{ marginTop: '1.4rem' }}>
        <div className="timeline">
          {STEPS.map((step, i) => (
            <div key={step.key} className="tl-item">
              <div className="tl-rail">
                <div
                  className={`tl-dot${i < active ? ' done' : ''}${i === active ? ' current' : ''}`}
                />
                {i < STEPS.length - 1 && <div className="tl-line" />}
              </div>
              <div className="tl-body">
                <div className="tl-title">{step.label}</div>
                <div className="tl-meta">{step.note}</div>
              </div>
            </div>
          ))}
        </div>

        {order.status !== 'delivered' && (
          <div className="row gap wrapflex" style={{ marginTop: '0.6rem' }}>
            <button className="btn btn-primary btn-sm" onClick={advance} disabled={busy}>
              {busy ? 'Updating…' : 'Simulate the next step'}
            </button>
            <span className="tiny muted">
              In the live service the shop, the rider and the customer each advance the order
              themselves.
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-2" style={{ marginTop: '1.4rem', alignItems: 'start' }}>
        <div className="panel">
          <div className="panel-head">
            <span className="strong">What you ordered</span>
          </div>
          <div className="panel-body">
            {items.map((it: any) => (
              <div key={it.id} className="kv">
                <span className="muted small">
                  {it.qty} × {it.name}
                </span>
                <span className="small strong">{pula(it.line_total_pula)}</span>
              </div>
            ))}
            <div className="divider" />
            <div className="kv">
              <span className="muted">Subtotal</span>
              <span className="strong">{pula(order.subtotal_pula)}</span>
            </div>
            <div className="kv">
              <span className="muted">Delivery</span>
              <span className="strong">{pula(order.delivery_pula)}</span>
            </div>
            <div className="kv">
              <span className="muted">Service fee</span>
              <span className="strong">{pula(order.service_pula)}</span>
            </div>
            <div className="divider" />
            <div className="kv">
              <span className="strong">Total</span>
              <span className="strong" style={{ fontSize: '1.1rem' }}>
                {pula(order.total_pula)}
              </span>
            </div>
            {order.saved_pula > 0 && (
              <p className="tiny green" style={{ marginTop: '0.6rem' }}>
                You saved {pula(order.saved_pula)} against importing these items.
              </p>
            )}
          </div>
        </div>

        <div className="stack gap">
          <div className="card">
            <h3 style={{ marginBottom: '0.7rem' }}>Delivery</h3>
            {order.delivery_provider_name ? (
              <div className="row gap" style={{ marginBottom: '0.6rem' }}>
                <span style={{ fontSize: '1.6rem' }}>🚚</span>
                <span>
                  <span className="strong small" style={{ display: 'block' }}>
                    {order.delivery_provider_name}
                  </span>
                  <span className="tiny muted">
                    Assigned by the Junction admin — you always know who is carrying it.
                  </span>
                </span>
              </div>
            ) : (
              <p className="small muted">
                The Junction admin has not assigned a delivery provider yet. You will see the name
                here the moment they do.
              </p>
            )}
            {order.rider_name && (
              <div className="kv">
                <span className="muted">Rider</span>
                <span className="strong">
                  {order.rider_name} · {order.rider_phone}
                </span>
              </div>
            )}
            {order.eta_minutes && (
              <div className="kv">
                <span className="muted">Estimated</span>
                <span className="strong">{minutes(order.eta_minutes)}</span>
              </div>
            )}
            {order.dispatch_note && (
              <p className="tiny muted" style={{ marginTop: '0.5rem' }}>
                Dispatch note: {order.dispatch_note}
              </p>
            )}
          </div>

          <div className="card">
            <h3 style={{ marginBottom: '0.7rem' }}>Payment &amp; escrow</h3>
            <div className="row gap-s wrapflex">
              <Badge tone="blue">{order.payment_method.toUpperCase()}</Badge>
              <Badge tone={order.payment_state === 'paid' ? 'green' : 'gold'}>
                {order.payment_state}
              </Badge>
              <Badge tone={order.escrow_state === 'released' ? 'green' : 'gold'}>
                escrow {order.escrow_state}
              </Badge>
            </div>
            <p className="tiny muted" style={{ marginTop: '0.7rem' }}>
              Keeper&rsquo;s Ledger&trade; holds the money until you confirm the goods arrived. If
              something is wrong, Escrow &amp; Return-to-Shop&trade; sends it straight back to the
              shop that sold it.
            </p>
          </div>

          <Link to="/shop" className="btn btn-ghost">
            Back to the mall
          </Link>
        </div>
      </div>
    </div>
  )
}
