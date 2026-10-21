import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import type { AdminData, Provider, Store } from '../lib/api'
import { Badge, Empty, SectionHead, Spinner, Stat } from '../components/bits'
import { dateTime, pula, pulaShort } from '../lib/format'

type Tab = 'queue' | 'markup' | 'dispatch' | 'prices' | 'ledger' | 'audit'

const TABS: { key: Tab; label: string }[] = [
  { key: 'queue', label: 'Approval queue' },
  { key: 'markup', label: 'Price markup' },
  { key: 'dispatch', label: 'Dispatch desk' },
  { key: 'prices', label: 'Price watch' },
  { key: 'ledger', label: 'Keeper’s Ledger' },
  { key: 'audit', label: 'Audit trail' },
]

export default function Admin() {
  const [data, setData] = useState<AdminData | null>(null)
  const [orders, setOrders] = useState<any[]>([])
  const [tab, setTab] = useState<Tab>('queue')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [flash, setFlash] = useState<string | null>(null)

  const load = useCallback(() => {
    api
      .get<AdminData>('/admin')
      .then((d) => {
        setData(d)
        setOrders((d as any).orders ?? [])
      })
      .catch((e) => setError(e.message))
  }, [])

  useEffect(load, [load])

  function say(msg: string) {
    setFlash(msg)
    setTimeout(() => setFlash(null), 2600)
  }

  async function act(key: string, fn: () => Promise<any>, msg: string) {
    setBusy(key)
    try {
      await fn()
      load()
      say(msg)
    } catch (e: any) {
      say(e.message)
    } finally {
      setBusy(null)
    }
  }

  if (error) return <Empty glyph="⚠️" title="Admin console unavailable" body={error} />
  if (!data) return <Spinner label="Opening the admin console" />

  const pending = data.stores.filter((s) => s.approval_status === 'pending')
  const approved = data.stores.filter((s) => s.approval_status === 'approved')
  const withMarkup = data.stores.filter((s) => (s.markup_pct ?? 0) > 0)
  const unassigned = orders.filter(
    (o) => !o.delivery_provider_id && !['delivered', 'cancelled'].includes(o.status),
  )

  return (
    <div className="wrap section">
      {flash && <div className="toast">{flash}</div>}

      <div className="eyebrow">Junction administration</div>
      <h1 style={{ fontSize: 'clamp(1.8rem, 3.4vw, 2.6rem)', marginBottom: '0.4rem' }}>
        The admin desk
      </h1>
      <p className="muted" style={{ maxWidth: '64ch' }}>
        Three powers live here: who is allowed to trade, what the mall adds to a shop&rsquo;s
        price, and which delivery provider carries each order. Everything is written to the audit
        trail.
      </p>

      <div className="hero-stats" style={{ marginTop: '1.6rem' }}>
        <Stat n={pulaShort(data.platform.gmv)} l="Gross merchandise value" />
        <Stat n={data.platform.orders} l="Orders" />
        <Stat n={data.platform.shoppers} l="Shoppers" />
        <Stat n={pulaShort(data.platform.savedVsLanded)} l="Saved vs importing" />
        <Stat n={data.platform.pendingApprovals} l="Awaiting approval" />
        <Stat n={data.platform.ordersAwaitingDispatch} l="Awaiting a rider" />
      </div>

      <div className="row gap wrapflex" style={{ margin: '1.6rem 0' }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`pill-toggle${tab === t.key ? ' active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
            {t.key === 'queue' && pending.length > 0 && ` · ${pending.length}`}
            {t.key === 'dispatch' && unassigned.length > 0 && ` · ${unassigned.length}`}
          </button>
        ))}
      </div>

      {tab === 'queue' && (
        <div className="stack gap">
          <SectionHead
            eyebrow="Shop manager approval"
            title="Who is allowed to trade"
            lede="Every shop starts as an application. Approving one puts it on the floor plan, in the directory and in the ledger. Declining keeps it visible but closed for business."
          />
          {pending.length === 0 && (
            <Empty glyph="✅" title="The queue is clear" body="No shop is waiting on a decision." />
          )}
          {pending.map((s) => (
            <ApprovalCard
              key={s.id}
              store={s}
              busy={busy === `approve-${s.id}`}
              onDecide={(decision, note) =>
                act(
                  `approve-${s.id}`,
                  () =>
                    api.post(`/admin/stores/${s.id}/approval`, {
                      decision,
                      note,
                      actor: 'Mall Admin',
                    }),
                  decision === 'approve'
                    ? `${s.name} approved — the seller has been notified`
                    : `${s.name} declined — the seller has been notified`,
                )
              }
            />
          ))}

          {approved.length > 0 && (
            <>
              <h3 style={{ marginTop: '1.4rem' }}>Trading today ({approved.length})</h3>
              <div className="grid grid-3">
                {approved.slice(0, 12).map((s) => (
                  <div key={s.id} className="card">
                    <div className="row gap-s">
                      <span style={{ fontSize: '1.4rem' }}>{s.icon}</span>
                      <span className="grow">
                        <span className="strong small" style={{ display: 'block' }}>
                          {s.name}
                        </span>
                        <span className="tiny muted">
                          {s.town} · {s.area}
                        </span>
                      </span>
                    </div>
                    <div className="row gap-s wrapflex" style={{ marginTop: '0.6rem' }}>
                      <Badge tone="green">Approved</Badge>
                      {(s.markup_pct ?? 0) > 0 && (
                        <Badge tone="gold">{s.markup_pct}% markup</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {tab === 'markup' && (
        <div className="stack gap">
          <SectionHead
            eyebrow="Mall levy on price"
            title="What the Junction adds to a shop’s price"
            lede="A markup set here is applied to the shopper’s bill at quote time and paid to the shop. It is clamped between 0% and 25%, recorded in the audit trail, and the seller is notified."
          />
          {withMarkup.length > 0 && (
            <div className="panel">
              <div className="panel-head">
                <span className="strong">Shops carrying a markup</span>
                <Badge tone="gold">{withMarkup.length}</Badge>
              </div>
              <div className="panel-body">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Shop</th>
                      <th>Town</th>
                      <th>Markup</th>
                      <th>Note</th>
                      <th>Set by</th>
                      <th>When</th>
                    </tr>
                  </thead>
                  <tbody>
                    {withMarkup.map((s) => (
                      <tr key={s.id}>
                        <td className="strong">{s.name}</td>
                        <td className="muted">{s.town}</td>
                        <td className="gold strong">{s.markup_pct}%</td>
                        <td className="muted small">{s.markup_note || '—'}</td>
                        <td className="muted small">{s.markup_set_by ?? '—'}</td>
                        <td className="muted small">{dateTime(s.markup_set_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="panel">
            <div className="panel-head">
              <span className="strong">Set or change a markup</span>
            </div>
            <div className="panel-body">
              <MarkupEditor stores={data.stores} onDone={load} onSay={say} busy={busy} setBusy={setBusy} />
            </div>
          </div>
        </div>
      )}

      {tab === 'dispatch' && (
        <div className="stack gap">
          <SectionHead
            eyebrow="Delivery assignment"
            title="Which provider carries each order"
            lede="The Junction does not auction deliveries. The admin picks a registered provider for every order, and the shopper sees the name on the tracking screen."
          />
          <div className="grid grid-3">
            {data.providers.map((p) => (
              <ProviderCard key={p.id} provider={p} />
            ))}
          </div>

          <div className="panel">
            <div className="panel-head">
              <span className="strong">Order book</span>
              <Badge tone={unassigned.length ? 'red' : 'green'}>
                {unassigned.length} unassigned
              </Badge>
            </div>
            <div className="panel-body" style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>To</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Provider</th>
                    <th>Assign</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id}>
                      <td className="mono strong">{o.code}</td>
                      <td className="muted small">
                        {o.customer_name}
                        <br />
                        {o.customer_area}
                      </td>
                      <td className="strong">{pula(o.total_pula)}</td>
                      <td>
                        <Badge tone={o.status === 'delivered' ? 'green' : 'gold'}>{o.status}</Badge>
                      </td>
                      <td className="small">{o.delivery_provider_name ?? '—'}</td>
                      <td>
                        <DispatchForm
                          order={o}
                          providers={data.providers}
                          busy={busy === `dispatch-${o.code}`}
                          onAssign={(providerId, riderName, note) =>
                            act(
                              `dispatch-${o.code}`,
                              () =>
                                api.post(`/admin/orders/${o.code}/dispatch`, {
                                  providerId,
                                  riderName,
                                  note,
                                  actor: 'Dispatch Desk',
                                }),
                              `${o.code} assigned to ${data.providers.find((p) => p.id === providerId)?.name}`,
                            )
                          }
                        />
                      </td>
                    </tr>
                  ))}
                  {orders.length === 0 && (
                    <tr>
                      <td colSpan={6} className="muted center" style={{ padding: '2rem' }}>
                        No orders yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'prices' && (
        <div className="stack gap">
          <SectionHead
            eyebrow="Price Guard™"
            title="Prices above the going rate"
            lede="Advisory only. Morua never rewrites a shop’s price — it shows the shopper what the same item costs elsewhere, and shows the admin where a shop may be pricing above its peers."
          />
          {data.anomalies.length === 0 && (
            <Empty glyph="📊" title="No price anomalies" body="Every listed price sits inside its band." />
          )}
          <div className="panel">
            <div className="panel-body" style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Shop</th>
                    <th>Price</th>
                    <th>Band</th>
                    <th>Peers</th>
                  </tr>
                </thead>
                <tbody>
                  {data.anomalies.map((p: any) => (
                    <tr key={p.id}>
                      <td>
                        <span className="row gap-s">
                          <span>{p.icon}</span>
                          <span className="strong">{p.name}</span>
                        </span>
                      </td>
                      <td className="muted small">
                        {p.store_name}
                        <br />
                        <Link to={`/store/${p.store_slug}`} className="tiny gold">
                          open shop
                        </Link>
                      </td>
                      <td className="strong">{pula(p.price_pula)}</td>
                      <td className="small">
                        {pula(p.band?.lowPula)} – {pula(p.band?.highPula)}
                      </td>
                      <td className="muted">{p.band?.peers}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'ledger' && (
        <div className="stack gap" id="ledger">
          <SectionHead
            eyebrow="Keeper’s Ledger™"
            title="Where every pula sits"
            lede="A double-entry ledger: every order posts a balanced set of lines, so the platform can always show what it holds, what it owes sellers and what it has earned."
          />
          <div className="grid grid-3">
            {data.balances.map((b) => (
              <div key={b.account} className="card">
                <div className="tiny muted">{b.account.replace(/_/g, ' ')}</div>
                <div style={{ fontFamily: 'var(--serif)', fontSize: '1.6rem' }}>{pula(b.balance)}</div>
                <div className="tiny muted">
                  debit {pulaShort(b.debit)} · credit {pulaShort(b.credit)}
                </div>
              </div>
            ))}
          </div>
          <div className="panel">
            <div className="panel-head">
              <span className="strong">Recent entries</span>
            </div>
            <div className="panel-body" style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>When</th>
                    <th>Account</th>
                    <th>Direction</th>
                    <th>Amount</th>
                    <th>Kind</th>
                    <th>Memo</th>
                  </tr>
                </thead>
                <tbody>
                  {data.entries.map((e: any) => (
                    <tr key={e.id}>
                      <td className="muted small nowrap">{dateTime(e.ts)}</td>
                      <td className="small">{String(e.account).replace(/_/g, ' ')}</td>
                      <td className="small">{e.direction}</td>
                      <td className="strong">{pula(e.amount_pula)}</td>
                      <td className="muted small">{e.kind}</td>
                      <td className="muted small">{e.memo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'audit' && (
        <div className="stack gap">
          <SectionHead
            eyebrow="Audit trail"
            title="Every admin decision, in order"
            lede="Approvals, declines, markups and dispatches — each with the person who made it and the reason they gave."
          />
          <div className="panel">
            <div className="panel-body">
              {data.actions.map((a: any) => (
                <div key={a.id} className="row gap" style={{ padding: '0.55rem 0', borderBottom: '1px solid var(--line)' }}>
                  <Badge
                    tone={
                      a.action?.includes('approve')
                        ? 'green'
                        : a.action?.includes('decline')
                          ? 'red'
                          : a.action?.includes('markup')
                            ? 'gold'
                            : 'blue'
                    }
                  >
                    {String(a.action).replace(/_/g, ' ')}
                  </Badge>
                  <span className="grow small">
                    {a.detail}
                    {a.reason ? <span className="muted"> — {a.reason}</span> : null}
                  </span>
                  <span className="tiny muted nowrap">{a.actor}</span>
                  <span className="tiny muted nowrap">{dateTime(a.created_at ?? a.ts)}</span>
                </div>
              ))}
              {data.actions.length === 0 && <p className="muted small">No admin actions yet.</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ApprovalCard({
  store,
  onDecide,
  busy,
}: {
  store: Store
  onDecide: (decision: string, note: string) => void
  busy: boolean
}) {
  const [note, setNote] = useState('')
  return (
    <div className="card" style={{ borderColor: 'rgba(227,172,80,0.35)' }}>
      <div className="row gap wrapflex" style={{ alignItems: 'flex-start' }}>
        <div style={{ fontSize: '2.2rem' }}>{store.icon}</div>
        <div className="grow" style={{ minWidth: '240px' }}>
          <div className="row gap-s wrapflex">
            <span className="strong">{store.name}</span>
            <Badge tone="gold">Awaiting approval</Badge>
            <Badge tone="violet">{store.town}</Badge>
          </div>
          <p className="small muted" style={{ margin: '0.4rem 0' }}>
            {store.tagline}
          </p>
          <p className="tiny muted" style={{ margin: 0 }}>
            {store.address} · {store.phone} · trading since {store.opened_on}
          </p>
          <div className="row gap-s wrapflex" style={{ marginTop: '0.6rem' }}>
            <Badge tone="blue">★ {store.rating?.toFixed(1)}</Badge>
            <Badge tone="ink">{store.fulfilment_accuracy}% accuracy</Badge>
            <Badge tone="ink">unit {store.unit_label}</Badge>
          </div>
        </div>
        <div className="stack gap-s" style={{ minWidth: '260px' }}>
          <input
            className="input"
            placeholder="Reason / note (kept in the audit trail)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <div className="row gap-s">
            <button
              className="btn btn-green grow"
              disabled={busy}
              onClick={() => onDecide('approve', note)}
            >
              Approve to trade
            </button>
            <button
              className="btn btn-red grow"
              disabled={busy}
              onClick={() => onDecide('decline', note)}
            >
              Decline
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function MarkupEditor({
  stores,
  onDone,
  onSay,
  busy,
  setBusy,
}: {
  stores: Store[]
  onDone: () => void
  onSay: (m: string) => void
  busy: string | null
  setBusy: (v: string | null) => void
}) {
  const [storeId, setStoreId] = useState<string>('')
  const [pct, setPct] = useState('0')
  const [note, setNote] = useState('')
  const selected = useMemo(() => stores.find((s) => String(s.id) === storeId), [stores, storeId])

  async function save() {
    if (!selected) return
    setBusy(`markup-${selected.id}`)
    try {
      await api.post(`/admin/stores/${selected.id}/markup`, {
        markup_pct: Number(pct),
        note,
        actor: 'Mall Admin',
      })
      onDone()
      onSay(`Markup on ${selected.name} set to ${pct}% — the seller has been notified`)
    } catch (e: any) {
      onSay(e.message)
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="stack gap">
      <div className="grid grid-2" style={{ gap: '0.9rem' }}>
        <div className="field">
          <label>Shop</label>
          <select
            className="select"
            value={storeId}
            onChange={(e) => {
              setStoreId(e.target.value)
              const s = stores.find((x) => String(x.id) === e.target.value)
              setPct(String(s?.markup_pct ?? 0))
              setNote(s?.markup_note ?? '')
            }}
          >
            <option value="">Choose a shop…</option>
            {stores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} — {s.town}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Markup percentage (0–25%)</label>
          <input
            className="input"
            type="number"
            min={0}
            max={25}
            step={0.5}
            value={pct}
            onChange={(e) => setPct(e.target.value)}
          />
        </div>
      </div>
      <div className="field">
        <label>Note to the seller</label>
        <input
          className="input"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. Logistics levy for the far districts"
        />
      </div>
      {selected && (
        <div className="card" style={{ padding: '0.8rem' }}>
          <div className="small muted">
            A P100 item at this shop will be billed at{' '}
            <strong className="gold">
              {pula(100 * (1 + (Number(pct) || 0) / 100))}
            </strong>{' '}
            — the shop still receives P100, the difference is the mall levy.
          </div>
        </div>
      )}
      <button
        className="btn btn-primary"
        disabled={!selected || busy?.startsWith('markup')}
        onClick={save}
      >
        Save the markup
      </button>
    </div>
  )
}

function ProviderCard({ provider }: { provider: Provider }) {
  return (
    <div className="card">
      <div className="row-between">
        <span className="strong">{provider.name}</span>
        <Badge tone="gold">★ {provider.rating?.toFixed(1)}</Badge>
      </div>
      <div className="tiny muted" style={{ marginTop: '0.4rem' }}>
        {provider.vehicle} · {provider.areas}
      </div>
      <div className="row gap-s wrapflex" style={{ marginTop: '0.6rem' }}>
        <Badge tone="ink">{provider.commission_pct}% commission</Badge>
        <Badge tone="ink">{provider.license_ref}</Badge>
      </div>
      <div className="tiny muted" style={{ marginTop: '0.6rem' }}>
        {provider.contact} — {provider.notes}
      </div>
    </div>
  )
}

function DispatchForm({
  order,
  providers,
  onAssign,
  busy,
}: {
  order: any
  providers: Provider[]
  onAssign: (providerId: number, rider: string, note: string) => void
  busy: boolean
}) {
  const [providerId, setProviderId] = useState('')
  const [rider, setRider] = useState('')
  const [note, setNote] = useState('')
  return (
    <div className="stack gap-s" style={{ minWidth: '240px' }}>
      <select
        className="select"
        value={providerId}
        onChange={(e) => setProviderId(e.target.value)}
      >
        <option value="">Choose a provider…</option>
        {providers.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
      <input
        className="input"
        placeholder="Rider name"
        value={rider}
        onChange={(e) => setRider(e.target.value)}
      />
      <input
        className="input"
        placeholder="Dispatch note"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
      <button
        className="btn btn-primary btn-sm"
        disabled={!providerId || busy}
        onClick={() => onAssign(Number(providerId), rider || 'Dispatch desk', note)}
      >
        {busy ? 'Assigning…' : 'Assign'}
      </button>
    </div>
  )
}
