import { Link } from 'react-router-dom'

interface StatTileProps {
  label: string
  value: number
  // Status tiles carry their status dot (the same badge colors as the
  // incident cards) next to the label, never color alone.
  dotClass?: string
  to: string
}

const formatter = new Intl.NumberFormat('fr-FR')

// StatTile is one headline figure that links to the matching list.
export default function StatTile({ label, value, dotClass, to }: StatTileProps) {
  return (
    <Link to={to} className="pb-card pb-card-link border rounded-4 p-3 px-4 d-block text-decoration-none h-100" style={{ color: 'inherit' }}>
      <div className="small d-flex align-items-center gap-2" style={{ color: 'var(--pb-text-muted)' }}>
        {dotClass && (
          <span className={`badge-soft ${dotClass} p-0 border-0 bg-transparent`}>
            <span className="badge-dot"></span>
          </span>
        )}
        {label}
      </div>
      <div className="fs-3 fw-semibold mt-1">{formatter.format(value)}</div>
    </Link>
  )
}
