import { Link } from 'react-router-dom'
import { useCart } from '../App'
import { Empty, Spinner } from '../components/bits'
import { pula } from '../lib/format'

export default function Basket() {
  const { quote, quoting, lines, setQty, remove, area, setArea, fulfilment, setFulfilment, count } =
    useCart()

  if (!lines.length) {
    return (
      <div className="wrap section">
        <Empty
          glyph="🧺"
          title="Your basket is empty"
          body="Walk the mall and add what you need — one delivery fee covers every shop."
        />
        <div className="center">
          <Link to="/shop" className="btn btn-primary">
            Browse the shops
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="wrap section">
      <div className="eyebrow">One Basket, Many Shops&trade;</div>
      <h1 style={{ fontSize: 'clamp(1.8rem, 3.4vw, 2.6rem)', marginBottom: '0.5rem' }}>
        Your basket
      </h1>
      <p className="muted" style={{ maxWidth: '62ch' }}>
        {count} item{count === 1 ? '' : 's'} from {quote?.stores.length ?? 0} shop
        {quote?.stores.length === 1 ? '' : 's'}. One delivery, one receipt, one ledger.
      </p>

      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1.6fr) minmax(300px, 1fr)', marginTop: '1.8rem' }}>
        <div className="stack gap">
          {quote?.lines.map((line) => (
            <div key={line.productId} className="card">
              <div className="row gap" style={{ alignItems: 'flex-start' }}>
                <div
                  style={{
                    width: '58px',
                    height: '58px',
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: '1.7rem',
                    background: line.store.accent_soft,
                    borderRadius: '12px',
                    flex: 'none',
                  }}
                >
                  {line.icon}
                </div>
                <div className="grow">
                  <div className="row-between gap-s">
                    <Link to={`/product/${line.productId}`} className="strong">
                      {line.name}
                    </Link>
                    <span className="strong nowrap">{pula(line.lineTotal)}</span>
                  </div>
                  <div className="tiny muted" style={{ marginTop: '0.2rem' }}>
                    {line.store.name} · {line.store.area} · {line.unit} at {pula(line.payableUnit)}
                    {line.markupPula > 0 && (
                      <span className="gold"> · includes a P{line.markupPula.toFixed(2)} mall levy</span>
                    )}
                  </div>
                  {line.tradeable === false && (
                    <div className="tiny" style={{ color: 'var(--gold)', marginTop: '0.35rem' }}>
                      ⏳ This shop is waiting for the Junction admin to approve it, so it cannot take
                      orders yet.
                    </div>
                  )}
                  <div className="row gap-s" style={{ marginTop: '0.6rem' }}>
                    <div className="row gap-s">
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => setQty(line.productId, line.qty - 1)}
                      >
                        −
                      </button>
                      <span className="strong small" style={{ minWidth: '1.6rem', textAlign: 'center' }}>
                        {line.qty}
                      </span>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => setQty(line.productId, line.qty + 1)}
                      >
                        +
                      </button>
                    </div>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => remove(line.productId)}
                      style={{ color: 'var(--text-dim)' }}
                    >
                      Remove
                    </button>
                    {line.stock <= 5 && (
                      <span className="tiny" style={{ color: 'var(--gold)' }}>
                        only {line.stock} left
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {quote && (
            <div className="card">
              <h3 style={{ marginBottom: '0.6rem' }}>What you are saving</h3>
              <p className="small muted">
                {quote.savedVsLanded > 0 ? (
                  <>
                    Buying these from shops in Botswana instead of importing them saves{' '}
                    <strong className="green">{pula(quote.savedVsLanded)}</strong> once freight,
                    duty and VAT are counted. That is what <strong>Land Local&trade;</strong> is for.
                  </>
                ) : (
                  <>These are items you can only get here — there is no cheaper import.</>
                )}
              </p>
            </div>
          )}
        </div>

        <div className="stack gap" style={{ position: 'sticky', top: '86px', alignSelf: 'start' }}>
          <div className="panel">
            <div className="panel-head">
              <span className="strong">Delivery</span>
              <span className="tiny muted">Pula Promise&trade;</span>
            </div>
            <div className="panel-body">
              <div className="row gap-s" style={{ marginBottom: '0.8rem' }}>
                {(['delivery', 'pickup'] as const).map((f) => (
                  <button
                    key={f}
                    className={`pill-toggle${fulfilment === f ? ' active' : ''}`}
                    onClick={() => setFulfilment(f)}
                  >
                    {f === 'delivery' ? '🚚 Deliver' : '🏬 Collect'}
                  </button>
                ))}
              </div>
              <div className="field">
                <label>Deliver to</label>
                <input
                  className="input"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  placeholder="Gaborone West"
                />
              </div>
              {quote?.deliveryQuote && (
                <div className="card" style={{ marginTop: '0.8rem', padding: '0.8rem' }}>
                  <div className="row-between small">
                    <span className="strong">{quote.deliveryQuote.zone}</span>
                    <span className="strong">
                      {quote.deliveryQuote.feePula > 0
                        ? pula(quote.deliveryQuote.feePula)
                        : 'FREE'}
                    </span>
                  </div>
                  <div className="tiny muted" style={{ marginTop: '0.25rem' }}>
                    {quote.deliveryQuote.band}
                  </div>
                  <div className="tiny muted">{quote.deliveryQuote.note}</div>
                </div>
              )}
            </div>
          </div>

          <div className="panel">
            <div className="panel-head">
              <span className="strong">Summary</span>
              {quoting && <span className="spin tiny">◐</span>}
            </div>
            <div className="panel-body">
              <div className="kv">
                <span className="muted">Subtotal</span>
                <span className="strong">{pula(quote?.subtotal ?? 0)}</span>
              </div>
              <div className="kv">
                <span className="muted">Delivery</span>
                <span className="strong">
                  {quote?.deliveryQuote?.feePula ? pula(quote.deliveryQuote.feePula) : 'FREE'}
                </span>
              </div>
              <div className="kv">
                <span className="muted">Mall service fee</span>
                <span className="strong">{pula(quote?.serviceFee ?? 0)}</span>
              </div>
              <div className="divider" />
              <div className="kv">
                <span className="strong">Total</span>
                <span className="strong" style={{ fontSize: '1.2rem' }}>
                  {pula(quote?.total ?? 0)}
                </span>
              </div>
              <p className="tiny muted" style={{ marginTop: '0.6rem' }}>
                Cash on delivery, Orange Money or card at checkout. The money is held in escrow
                until you confirm the goods arrived.
              </p>
              <Link
                to="/checkout"
                className="btn btn-primary btn-block"
                style={{ marginTop: '0.9rem' }}
              >
                Continue to checkout
              </Link>
              <Link to="/shop" className="btn btn-ghost btn-block" style={{ marginTop: '0.5rem' }}>
                Keep shopping
              </Link>
            </div>
          </div>
        </div>
      </div>

      {!quote && quoting && <Spinner label="Pricing your basket" />}
    </div>
  )
}
