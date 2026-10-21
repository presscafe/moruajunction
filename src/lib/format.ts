export function pula(n: number | null | undefined): string {
  const v = Number(n ?? 0)
  return `P${v.toLocaleString('en-BW', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function pulaShort(n: number | null | undefined): string {
  const v = Number(n ?? 0)
  return `P${v.toLocaleString('en-BW', { maximumFractionDigits: 0 })}`
}

export function rand(n: number | null | undefined): string {
  return `R${Number(n ?? 0).toLocaleString('en-BW', { maximumFractionDigits: 0 })}`
}

export function minutes(n: number | null | undefined): string {
  const v = Number(n ?? 0)
  if (v < 60) return `${v} min`
  if (v < 1440) return `${Math.round(v / 60)} h`
  return `${Math.round(v / 1440)} day${Math.round(v / 1440) > 1 ? 's' : ''}`
}

export function dateTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString('en-BW', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function dateOnly(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-BW', { day: '2-digit', month: 'short', year: 'numeric' })
}
