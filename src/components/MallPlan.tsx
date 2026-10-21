import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { MallPlan as Plan } from '../lib/api'

export interface PlanProps {
  plan: Plan
  /** Floor id to start on; when null the first floor with units is used. */
  initialFloor?: number | null
  onFloorChange?: (floorId: number) => void
}

/**
 * Mall Compass — the God's-eye view.
 *
 * Every pavilion of the Junction is drawn from directly above: the hub at the
 * centre, the shop units in their real positions, and the walk from the hub
 * to every unit. Pick a floor and the map moves with you.
 */
export default function MallPlan({ plan, initialFloor, onFloorChange }: PlanProps) {
  const navigate = useNavigate()
  const floorsWithUnits = useMemo(() => {
    const used = new Set(plan.units.map((u) => u.floorId))
    return plan.floors.filter((f) => used.has(f.id))
  }, [plan])

  const [floorId, setFloorId] = useState<number | null>(initialFloor ?? null)
  const activeFloor = useMemo(() => {
    if (floorId && floorsWithUnits.some((f) => f.id === floorId)) return floorId
    return floorsWithUnits[0]?.id ?? plan.floors[0]?.id ?? 0
  }, [floorId, floorsWithUnits, plan.floors])

  const units = plan.units.filter((u) => u.floorId === activeFloor)
  const hub = plan.hubs.find((h) => h.floorId === activeFloor) ?? plan.hub
  const floor = plan.floors.find((f) => f.id === activeFloor)

  function pick(id: number) {
    setFloorId(id)
    onFloorChange?.(id)
  }

  return (
    <div>
      <div className="floor-tabs" role="tablist" aria-label="Mall floors">
        {floorsWithUnits.map((f) => {
          const count = plan.units.filter((u) => u.floorId === f.id).length
          const town = (f as any).town ?? 'Gaborone'
          return (
            <button
              key={f.id}
              className={`floor-tab${f.id === activeFloor ? ' active' : ''}`}
              onClick={() => pick(f.id)}
              role="tab"
              aria-selected={f.id === activeFloor}
            >
              <span className="code">
                {f.code} · {town}
              </span>
              {f.name}
              <span className="tiny" style={{ opacity: 0.65 }}>
                {count} units
              </span>
            </button>
          )
        })}
      </div>

      <div className="plan-wrap">
        <div className="plan-canvas">
          <div className="plan-floor-label">
            {floor?.name} <span className="muted">· {(floor as any)?.town ?? 'Gaborone'}</span>
          </div>

          <svg className="plan-walk" viewBox="0 0 100 100" preserveAspectRatio="none">
            {units
              .filter((u) => u.kind !== 'hub')
              .map((u) => (
                <line
                  key={`w-${u.id}`}
                  x1={hub.x * 100}
                  y1={hub.y * 100}
                  x2={u.x * 100}
                  y2={u.y * 100}
                />
              ))}
          </svg>

          {units.map((u) => {
            const isHub = u.kind === 'hub'
            const pending = u.approval && u.approval !== 'approved'
            if (isHub) {
              return (
                <div
                  key={u.id}
                  className="plan-hub"
                  style={{ left: `${u.x * 100}%`, top: `${u.y * 100}%` }}
                  title={`${u.name} — ${u.minutesFromHub} min from the hub`}
                >
                  <span>JUNCTION<br />HUB</span>
                </div>
              )
            }
            return (
              <button
                key={u.id}
                className="plan-unit"
                style={{
                  left: `${u.x * 100}%`,
                  top: `${u.y * 100}%`,
                  background: `${u.accent}33`,
                  borderColor: pending ? 'rgba(227,172,80,0.5)' : `${u.accent}aa`,
                }}
                onClick={() => navigate(`/store/${u.slug}`)}
                title={`${u.name} — unit ${u.unitLabel}, ${u.minutesFromHub} min walk`}
              >
                <span className="glyph">{u.icon}</span>
                <span className="nm">{u.name}</span>
                <span className="mins">{u.minutesFromHub} min</span>
              </button>
            )
          })}

          <div className="plan-legend">
            <span>
              <i style={{ background: '#e3ac50' }} />
              Hub
            </span>
            <span>
              <i style={{ background: 'rgba(255,255,255,0.2)' }} />
              Shop unit
            </span>
            <span>── walk from hub</span>
          </div>
        </div>
      </div>

      <div className="row-between wrapflex gap small muted" style={{ marginTop: '0.7rem' }}>
        <span>
          {units.length} units on this floor · {hub.label} at the centre · walk times are at a
          comfortable 4.5 km/h
        </span>
        <span>Click any unit to walk in.</span>
      </div>
    </div>
  )
}
