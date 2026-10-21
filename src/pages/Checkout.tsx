import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useCart } from '../App'
import { Empty, Spinner } from '../components/bits'
import { pula } from '../lib/format'

const PAYMENTS = [
  { id: 'cod', label: 'Cash on delivery', icon: '💵', note: 'Pay the rider in cash when the order arrives' },
  { id: 'orange', label: 'Orange Money', icon: '🟠', note: 'We send a mobile-money request to your number' },
  { id: 'card', label: 'Card on delivery', icon: '💳', note: 'Card machine carried by the rider' },
]

export default function Checkout() {
  const { quote, lines, area, fulfilment, clear } = useCart()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [notes, setNotes] = useState('')
  const [payment, setPayment] = useState('cod')
  const [placing, setPlacing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!lines.length) {
    return (
      <div className="wrap section">
        <Empty glyph="🧺" title="Nothing to check out" body="Add something to your basket first." />
        <div className="center">
          <Link to="/shop" className="btn btn-primary">
            Browse the shops
          </Link>
        </div>
      </div>
    )
  }

  async function place() {
    setPlacing(true)
    setError(null)
    try {
      const order = await api.post<{ code: string }>('/orders', {
        customerName: name,
        customerPhone: phone,
        customerArea: area,
        address: address || area,
        notes,
        payment_method: payment,
        fulfilment,
        lines: lines.map((l) => ({ productId: l.productId, qty: l.qty })),
      })
      clear()
      navigate(`/order/${order.code}`)
    } catch (e: any) {
      setError(e.message)
      setPlacing(false)
    }
  }

  const ready = name.trim().length > 1 && phone.trim().length > 5

  return (
    <div className="wrap section">
      <div className="eyebrow">Checkout</div>
      <h1 style={{ fontSize: 'clamp(1.8rem, 3.4vw, 2.6rem)', marginBottom: '0.5rem' }}>
        Where should it go?
      </h1>
      <p className="muted" style={{ maxWidth: '62ch' }}>
        One order across {quote?.stores.length ?? 0} shop{quote?.stores.length === 1 ? '' : 's'}. The
        Junction admin assigns the rider, and the money stays in escrow until you confirm.
      </p>

      <div
        className="grid"
        style={{ gridTemplateColumns: 'minmax(0, 1.5fr) minmax(300px, 1fr)', marginTop: '1.8rem' }}
      >
        <div className="stack gap">
          <div className="card">
            <h3 style={{ marginBottom: '1rem' }}>Your details</h3>
            <div className="grid grid-2" style={{ gap: '0.9rem' }}>
              <div className="field">
                <label>Full name</label>
                <input
                  className="input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Thandi Mokoena"
                />
              </div>
              <div className="field">
                <label>Phone</label>
                <input
                  className="input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+267 7X XXX XXX"
                />
              </div>
            </div>
            <div className="field" style={{ marginTop: '0.9rem' }}>
              <label>Delivery address</label>
              <input
                className="input"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder={`House number, street, ${area}`}
              />
            </div>
            <div className="field" style={{ marginTop: '0.9rem' }}>
              <label>Notes for the rider (optional)</label>
              <textarea
                className="textarea"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Gate code, landmark, preferred time…"
              />
            </div>
          </div>

          <div className="card">
            <h3 style={{ marginBottom: '0.9rem' }}>How you will pay</h3>
            <div className="stack gap-s">
              {PAYMENTS.map((pm) => (
                <button
                  key={pm.id}
                  onClick={() => setPayment(pm.id)}
                  className="row gap"
                  style={{
                    border: `1px solid ${payment === pm.id ? 'var(--gold)' : 'var(--line)'}`,
                    background:
                      payment === pm.id ? 'rgba(227,172,80,0.12)' : 'rgba(255,255,255,0.03)',
                    borderRadius: '12px',
                    padding: '0.8rem 1rem',
                    cursor: 'pointer',
                    color: 'inherit',
                    textAlign: 'left',
                    width: '100%',
                  }}
                >
                  <span style={{ fontSize: '1.4rem' }}>{pm.icon}</span>
                  <span className="grow">
                    <span className="strong small" style={{ display: 'block' }}>
                      {pm.label}
                    </span>
                    <span className="tiny muted">{pm.note}</span>
                  </span>
                  {payment === pm.id && <span className="gold">●</span>}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="stack gap" style={{ position: 'sticky', top: '86px', alignSelf: 'start' }}>
          <div className="panel">
            <div className="panel-head">
              <span className="strong">Order</span>
              <span className="tiny muted">{quote?.stores.length ?? 0} shops</span>
            </div>
            <div className="panel-body">
              {quote?.lines.map((line) => (
                <div key={line.productId} className="kv">
                  <span className="muted small">
                    {line.qty} × {line.name}
                  </span>
                  <span className="small strong">{pula(line.lineTotal)}</span>
                </div>
              ))}
              <div className="divider" />
              <div className="kv">
                <span className="muted">Subtotal</span>
                <span className="strong">{pula(quote?.subtotal ?? 0)}</span>
              </div>
              <div className="kv">
                <span className="muted">Delivery to {area}</span>
                <span className="strong">
                  {quote?.deliveryQuote?.feePula ? pula(quote.deliveryQuote.feePula) : 'FREE'}
                </span>
              </div>
              <div className="kv">
                <span className="muted">Service fee</span>
                <span className="strong">{pula(quote?.serviceFee ?? 0)}</span>
              </div>
              <div className="divider" />
              <div className="kv">
                <span className="strong">Total</span>
                <span className="strong" style={{ fontSize: '1.2rem' }}>
                  {pula(quote?.total ?? 0)}
                </span>
              </div>

              {error && (
                <p className="small" style={{ color: 'var(--red)', marginTop: '0.8rem' }}>
                  {error}
                </p>
              )}

              <button
                className="btn btn-primary btn-block btn-lg"
                style={{ marginTop: '1rem' }}
                disabled={!ready || placing}
                onClick={place}
              >
                {placing ? 'Placing your order…' : `Place the order · ${pula(quote?.total ?? 0)}`}
              </button>
              {!ready && (
                <p className="tiny muted" style={{ marginTop: '0.5rem' }}>
                  Add your name and a phone number so the rider can reach you.
                </p>
              )}
              <p className="tiny muted" style={{ marginTop: '0.7rem' }}>
                Escrow &amp; Return-to-Shop&trade;: if the order is wrong, you can send it back to the
                shop, not to a courier depot. The money is released when you say so.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
