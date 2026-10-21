import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../lib/api'
import type { Product, Store } from '../lib/api'
import { Empty, ProductCard, SectionHead, Spinner, StoreCard } from '../components/bits'
import { pula } from '../lib/format'

export default function Aisle() {
  const { code } = useParams()
  const [data, setData] = useState<{ aisle: any; stores: Store[]; products: Product[] } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api
      .get(`/aisle/${code}`)
      .then(setData)
      .catch((e) => setError(e.message))
  }, [code])

  if (error) return <Empty glyph="⚠️" title="Aisle not found" body={error} />
  if (!data) return <Spinner label="Finding the aisle" />

  return (
    <div className="wrap section">
      <SectionHead
        eyebrow={`Aisle ${data.aisle?.code ?? code}`}
        title={data.aisle?.name ?? 'Aisle'}
        lede={data.aisle?.blurb ?? ''}
        action={
          <Link to="/map" className="btn btn-ghost btn-sm">
            See it on the map
          </Link>
        }
      />

      <div className="grid grid-3" style={{ marginBottom: '2.4rem' }}>
        {data.stores.map((s) => (
          <StoreCard key={s.id} store={s} />
        ))}
      </div>

      <h3 style={{ marginBottom: '1rem' }}>Everything in this aisle</h3>
      <div className="grid grid-4">
        {data.products.map((p) => (
          <ProductCard
            key={p.id}
            product={p}
            store={data.stores.find((s) => s.id === p.store_id)}
          />
        ))}
      </div>

      {data.products.length === 0 && (
        <Empty glyph="🧺" title="This aisle is being restocked" body="Check back shortly." />
      )}

      <p className="tiny muted" style={{ marginTop: '1.6rem' }}>
        Aisle prices are set by each shop. Morua shows you what the same item costs elsewhere in
        Botswana so you can judge it — starting at {pula(data.products[0]?.price_pula ?? 0)}.
      </p>
    </div>
  )
}
