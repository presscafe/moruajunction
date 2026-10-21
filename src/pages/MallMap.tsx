import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import MallPlan from '../components/MallPlan'
import { Badge, Empty, SectionHead, Spinner } from '../components/bits'
import { minutes } from '../lib/format'

export default function MallMap() {
  const [plan, setPlan] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [floorId, setFloorId] = useState<number | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [town, setTown] = useState<string | null>(null)

  useEffect(() => {
    api
      .get('/mall/plan')
      .then((p) => {
        setPlan(p)
        const first = p.floors.find((f: any) => p.units.some((u: any) => u.floorId === f.id))
        if (first) setFloorId(first.id)
      })
      .catch((e) => setError(e.message))
  }, [])

  const activeFloor = useMemo(() => {
    const floors = (plan?.floors ?? []).filter(
      (f: any) => !town || (f.town ?? 'Gaborone') === town,
    )
    const withUnits = floors.filter((f: any) => plan?.units.some((u: any) => u.floorId === f.id))
    const match = withUnits.find((f: any) => f.id === floorId)
    return (match ?? withUnits[0])?.id ?? floorId
  }, [plan, floorId, town])

  const units = useMemo(
    () => (plan?.units ?? []).filter((u: any) => u.floorId === activeFloor),
    [plan, activeFloor],
  )
  const aisles = useMemo(
    () => (plan?.aisles ?? []).filter((a: any) => units.some((u: any) => u.aisle === a.code)),
    [plan, units],
  )

  if (error) return <Empty glyph="⚠️" title="No map today" body={error} />
  if (!plan) return <Spinner label="Drawing the floor plan" />

  return (
    <div className="wrap section">
      <SectionHead
        eyebrow="Mall Compass™"
        title="The Junction, from above"
        lede="Every pavilion floor of Morua Junction — Gaborone's five floors and the branch pavilions in forty towns. The hub sits at the centre; the dashed line is your walk from it. Tap a unit to walk in."
      />

      <MallPlan
        plan={plan}
        initialFloor={floorId}
        onFloorChange={setFloorId}
        town={town}
        onTownChange={setTown}
      />

      <div className="grid grid-2" style={{ marginTop: '1.6rem' }}>
        <div className="panel">
          <div className="panel-head">
            <span className="strong">Units on this floor</span>
            <Badge tone="gold">{units.length}</Badge>
          </div>
          <div className="panel-body" style={{ maxHeight: '340px', overflow: 'auto' }}>
            {units.length === 0 && <p className="muted small">No units on this floor.</p>}
            {units.map((u: any) => (
              <button
                key={u.id}
                className="row-between"
                onClick={() => setSelected(u.slug)}
                style={{
                  width: '100%',
                  background: selected === u.slug ? 'rgba(227,172,80,0.12)' : 'transparent',
                  border: 'none',
                  borderBottom: '1px solid var(--line)',
                  padding: '0.6rem 0.3rem',
                  cursor: 'pointer',
                  color: 'inherit',
                  textAlign: 'left',
                }}
              >
                <span className="row gap-s">
                  <span style={{ fontSize: '1.2rem' }}>{u.icon}</span>
                  <span>
                    <span className="small strong">{u.name}</span>
                    <span className="tiny muted" style={{ display: 'block' }}>
                      Unit {u.unitLabel} · {u.town}
                    </span>
                  </span>
                </span>
                <span className="tiny muted nowrap">{minutes(u.minutesFromHub)} walk</span>
              </button>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <span className="strong">Aisles on this floor</span>
          </div>
          <div className="panel-body">
            {aisles.length === 0 && <p className="muted small">No aisles on this floor.</p>}
            {aisles.map((a: any) => (
              <div key={a.code} className="row-between" style={{ padding: '0.55rem 0' }}>
                <span>
                  <span className="mono gold small">{a.code}</span>
                  <span className="small strong" style={{ marginLeft: '0.6rem' }}>
                    {a.name}
                  </span>
                  <span className="tiny muted" style={{ display: 'block', marginLeft: '2.1rem' }}>
                    {a.blurb}
                  </span>
                </span>
                <Link className="btn btn-ghost btn-sm" to={`/aisle/${a.code}`}>
                  Visit
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
