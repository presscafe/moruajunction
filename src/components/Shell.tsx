import { useEffect, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useCart } from '../App'
import { api } from '../lib/api'

const NAV = [
  { to: '/', label: 'Concourse', end: true },
  { to: '/map', label: "Mall Map" },
  { to: '/shop', label: 'Shops' },
  { to: '/basket', label: 'Basket' },
  { to: '/seller', label: 'Seller' },
  { to: '/admin', label: 'Admin' },
]

export default function Shell({ children }: { children: React.ReactNode }) {
  const { count, area, setArea } = useCart()
  const [term, setTerm] = useState('')
  const [areas, setAreas] = useState<string[]>([])
  const navigate = useNavigate()

  useEffect(() => {
    api
      .get<{ areas: string[] }>('/areas')
      .then((r) => setAreas(r.areas ?? []))
      .catch(() => setAreas([]))
  }, [])

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!term.trim()) return
    navigate(`/shop?q=${encodeURIComponent(term.trim())}`)
  }

  return (
    <>
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
              placeholder="Search 381 products in 18 towns"
              aria-label="Search the mall"
            />
          </form>

          <select
            className="select"
            style={{ width: 'auto', minWidth: '150px' }}
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

          <Link to="/basket" className="cart-pill">
            <span aria-hidden>🧺</span>
            <span>Basket</span>
            <span className="count">{count}</span>
          </Link>
        </div>
      </header>

      <main>{children}</main>

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
                Gaborone · Francistown · Lobatse · Kanye · Serowe · Mahalapye · Mochudi · Palapye ·
                Letlhakeng · Tsabong · Ghanzi · Selebi Phikwe · Maun · Kasane · Tsumeb · Nata ·
                Mogoditshane · Tlokweng
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
