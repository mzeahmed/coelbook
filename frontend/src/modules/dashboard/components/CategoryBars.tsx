import { Link } from 'react-router-dom'

import type { NamedCount } from '../api'

// CategoryBars is a horizontal bar chart of incidents per category: one
// series, so no legend; each value is written at the bar's tip and each
// row links to the list filtered by that category.
export default function CategoryBars({ categories }: { categories: NamedCount[] }) {
  const max = Math.max(1, ...categories.map((c) => c.incident_count))

  return (
    <ul className="list-unstyled mb-0 d-flex flex-column gap-1">
      {categories.map((c) => {
        const pct = (c.incident_count / max) * 100

        return (
          <li key={c.slug}>
            <Link
              to={`/dashboard?category=${encodeURIComponent(c.slug)}`}
              className="pb-bar-row d-grid align-items-center gap-3 rounded-2 px-2 py-1 text-decoration-none small"
              style={{ gridTemplateColumns: 'minmax(6rem, 10rem) 1fr', color: 'inherit' }}
            >
              <span className="text-truncate">{c.name}</span>
              <span className="d-flex align-items-center gap-2">
                {/* Zero gets no bar at all rather than a sliver that reads as "a few". */}
                {c.incident_count > 0 && <span className="pb-bar" style={{ width: `${pct}%` }}></span>}
                <span className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--pb-text-muted)' }}>
                  {c.incident_count}
                </span>
              </span>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
