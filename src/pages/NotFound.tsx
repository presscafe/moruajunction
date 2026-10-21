import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="wrap section" style={{ minHeight: '60vh', display: 'grid', placeItems: 'center' }}>
      <div className="card" style={{ maxWidth: '520px', textAlign: 'center', padding: '2.6rem' }}>
        <div
          style={{
            fontSize: '3.2rem',
            lineHeight: 1,
            marginBottom: '0.6rem',
          }}
          aria-hidden
        >
          🧭
        </div>
        <div className="eyebrow">Wrong corridor</div>
        <h1 style={{ fontSize: 'clamp(1.6rem, 3.2vw, 2.2rem)' }}>That aisle is not on the plan</h1>
        <p className="muted" style={{ margin: '0.8rem auto 1.6rem', maxWidth: '42ch' }}>
          The page you were after is not in the mall. Open the Concourse, or look at the Mall Map to
          see every pavilion in the country.
        </p>
        <div className="row gap" style={{ justifyContent: 'center' }}>
          <Link to="/" className="btn btn-primary">
            Back to the Concourse
          </Link>
          <Link to="/map" className="btn btn-ghost">
            Open the Mall Map
          </Link>
        </div>
      </div>
    </div>
  )
}
