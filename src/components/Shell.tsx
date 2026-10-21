import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useCart } from '../App'
import { api } from '../lib/api'
import { subscribeLinkState, type LinkState } from '../lib/offline'

const NAV = [
  { to: '/', label: 'Concourse', end: true },
  { to: '/map', label: 'Mall Map' },
  { to: '/shop', label: 'Shops' },
  { to: '/basket', label: 'Basket' },
  { to: '/seller', label: 'Seller' },
  { to: '/admin', label: 'Admin' },
]

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function Shell({ children }: { children: React.ReactNode }) {
  const { count, area, setArea } = useCart()
  const [term, setTerm] = useState('')
  const [areas, setAreas] = useState<string[]>([])
  const [link, setLink] = useState<LinkState>('live')
  const [install, setInstall] = useState<InstallPromptEvent | null>(null)
  const installRef = useRef<InstallPromptEvent | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    api
      .get<{ areas: string[] }>('/areas')
      .then((r) => setAreas(r.areas ?? []))
      .catch(() => setAreas([]))
  }, [])

  useEffect(() => subscribeLinkState(setLink), [])

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault()
      installRef.current = e as InstallPromptEvent
      setInstall(installRef.current)
    }
    const onInstalled = () => {
      installRef.current = null
      setInstall(null)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  async function addToHome() {
    const prompt = installRef.current
    if (!prompt) return
    await prompt.prompt()
    const choice = await prompt.userChoice
    if (choice.outcome === 'accepted') {
      installRef.current = null
      setInstall(null)
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!term.trim()) return
    navigate(`/shop?q=${encodeURIComponent(term.trim())}`)
  }

  return (
    <>
      {link !== 'live' && (
        <div className="offline-bar" role="status">
          <span>
            {link === 'offline' ? '📡 You are offline' : '📦 Showing saved prices'} — the mall still
            works. Orders need a connection.
          </span>
          <button className="btn btn-ghost btn-sm" onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      )}

      <header className="topbar">
        <div className="wrap topbar-inner">
          <Link to="/" className="brand">
            <span className="brand-mark">MJ</span>
            <span>
              <span className="brand-name">Morua Junction</span>
              <span className="brand-sub">Botswana&rsquo;s virtual mall</span>
            </span>
          </Link>

          <nav className="nav">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                className={({ isActive }) => (isActive ? 'active' : '')}
              >
                {n.label}
              </NavLink>
            ))}
          </nav>

          <form className="search" onSubmit={submit} role="search">
            <span className="muted" aria-hidden>
              ⌕
            </span>
            <input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Search the mall"
              aria-label="Search the mall"
            />
          </form>

          <select
            className="select"
            style={{ width: 'auto', minWidth: '140px' }}
            value={area}
            onChange={(e) => setArea(e.target.value)}
            aria-label="Delivery area"
          >
            {(areas.length ? areas : [area]).map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>

          {install && (
            <button className="btn btn-ghost btn-sm nowrap" onClick={addToHome}>
              ⬇ Install
            </button>
          )}

          <Link to="/basket" className="cart-pill">
            <span aria-hidden>🧺</span>
            <span>Basket</span>
            <span className="count">{count}</span>
          </Link>
        </div>
      </header>

      <main>{children}</main>

      {/* Mobile tab bar — the PWA's bottom navigation on a phone. */}
      <nav className="tabbar" aria-label="Primary">
        {[
          { to: '/', label: 'Concourse', icon: '🏛️' },
          { to: '/map', label: 'Map', icon: '🗺️' },
          { to: '/shop', label: 'Shops', icon: '🏬' },
          { to: '/basket', label: 'Basket', icon: '🧺', badge: count },
        ].map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.to === '/'}
            className={({ isActive }) => (isActive ? 'active' : '')}
          >
            <span className="tab-icon">{t.icon}</span>
            <span className="tab-label">{t.label}</span>
            {t.badge ? <span className="tab-badge">{t.badge}</span> : null}
          </NavLink>
        ))}
      </nav>

      <footer className="footer">
        <div className="wrap">
          <div className="footer-grid">
            <div>
              <h4>Morua Junction</h4>
              <p className="small">
                A virtual mall for Botswana. Every product is already in the country — bought from a
                verified shop, delivered by a named rider, or collected today.
              </p>
              <p className="tiny muted" style={{ marginTop: '0.8rem' }}>
                Forty towns, from Gaborone to Kasane, and every district in between.
              </p>
            </div>
            <div>
              <h4>Shoppers</h4>
              <Link to="/">Concourse</Link>
              <Link to="/map">Mall Map — God&rsquo;s-eye view</Link>
              <Link to="/shop">All shops</Link>
              <Link to="/basket">Your basket</Link>
            </div>
            <div>
              <h4>Traders</h4>
              <Link to="/seller">Seller console</Link>
              <Link to="/admin">Admin console</Link>
              <Link to="/admin#dispatch">Dispatch desk</Link>
            </div>
            <div>
              <h4>What we promise</h4>
              <p className="small">
                Prices quoted up front. Escrow until you confirm. Land Local&trade; shows what an
                import would really cost. Pula Promise&trade; publishes the delivery fee and the
                window.
              </p>
            </div>
          </div>
          <div className="row-between wrapflex gap" style={{ marginTop: '2rem' }}>
            <span className="tiny muted">
              © {new Date().getFullYear()} Morua Junction · Prices in Botswana Pula (BWP)
            </span>
            <span className="tiny muted">Built for Botswana · Works offline once loaded</span>
          </div>
        </div>
      </footer>
    </>
  )
}
