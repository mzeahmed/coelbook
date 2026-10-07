import { useState } from 'react'

const CHART_HEIGHT = 112 // px, plot area only

const dayMonth = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' })

function weekLabel(weekStart: string): string {
  // week_start is a plain date; parse it as local midnight, not UTC.
  return dayMonth.format(new Date(`${weekStart}T00:00:00`))
}

function coelbooks(n: number): string {
  return `${n} coelbook${n > 1 ? 's' : ''}`
}

interface ActivityChartProps {
  weeks: { week_start: string; total: number }[]
}

// ActivityChart is a column chart of incidents created per week. Hovering
// or focusing a column shows its week and count; the same data is in a
// visually hidden table for screen readers.
export default function ActivityChart({ weeks }: ActivityChartProps) {
  const [active, setActive] = useState<number | null>(null)
  const max = Math.max(1, ...weeks.map((w) => w.total))
  const current = active !== null ? weeks[active] : undefined

  return (
    <div>
      <div className="d-flex align-items-start gap-2">
        {/* Single recessive tick: the max, so heights have a scale. */}
        <div className="font-mono text-end" style={{ width: '1.5rem', fontSize: '0.65rem', color: 'var(--pb-text-muted)' }}>
          {max}
        </div>

        <div className="flex-grow-1 position-relative">
          <div
            className="pb-columns d-flex align-items-end"
            style={{ height: CHART_HEIGHT }}
            onMouseLeave={() => setActive(null)}
            aria-hidden="true"
          >
            {weeks.map((w, i) => (
              <div
                key={w.week_start}
                className={`pb-column-slot flex-grow-1 d-flex align-items-end justify-content-center h-100 ${active === i ? 'is-active' : ''}`}
                onMouseEnter={() => setActive(i)}
              >
                {w.total > 0 && <div className="pb-column" style={{ height: `${(w.total / max) * 100}%` }}></div>}
              </div>
            ))}
          </div>

          {current && active !== null && (
            <div
              className="pb-tooltip small"
              style={{ left: `${((active + 0.5) / weeks.length) * 100}%` }}
              role="status"
            >
              <div style={{ color: 'var(--pb-text-muted)' }}>Semaine du {weekLabel(current.week_start)}</div>
              <div className="fw-semibold">{coelbooks(current.total)}</div>
            </div>
          )}

          <div className="d-flex justify-content-between mt-1" style={{ fontSize: '0.65rem', color: 'var(--pb-text-muted)' }}>
            <span>{weeks[0] && weekLabel(weeks[0].week_start)}</span>
            <span>Cette semaine</span>
          </div>
        </div>
      </div>

      <table className="visually-hidden">
        <caption>Coelbooks créés par semaine</caption>
        <thead>
          <tr>
            <th scope="col">Semaine du</th>
            <th scope="col">Coelbooks créés</th>
          </tr>
        </thead>
        <tbody>
          {weeks.map((w) => (
            <tr key={w.week_start}>
              <td>{weekLabel(w.week_start)}</td>
              <td>{w.total}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
