import { Link } from 'react-router-dom'

import type { IncidentSummary } from '../api'
import { categoryBadgeClass, STATUS_BADGE, STATUS_LABEL, timeAgo } from '../lib/format'

interface IncidentCardProps {
  incident: IncidentSummary
}

// The whole card links to the incident's detail page.
export default function IncidentCard({ incident }: IncidentCardProps) {
  return (
    <div className="col">
      <Link
        to={`/incidents/${incident.slug}`}
        className="pb-card pb-card-link card h-100 border rounded-4 p-4 text-decoration-none"
        style={{ color: 'inherit' }}
      >
        <div className="d-flex align-items-center gap-2 mb-2 flex-wrap">
          <span className={`badge-soft ${categoryBadgeClass(incident.category.slug)}`}>
            {incident.category.name}
          </span>
          <span className={`badge-soft ${STATUS_BADGE[incident.status]}`}>
            <span className="badge-dot"></span> {STATUS_LABEL[incident.status]}
          </span>
        </div>

        <h3 className="fs-6 fw-semibold mb-0" style={{ lineHeight: 1.35 }}>
          {incident.title}
        </h3>

        <p className="small mt-3 mb-3" style={{ color: 'var(--pb-text-muted)', lineHeight: 1.5 }}>
          {incident.summary}
        </p>

        {incident.tags.length > 0 && (
          <div className="d-flex flex-wrap gap-2 mb-3">
            {incident.tags.map((tag) => (
              <span key={tag} className="tag-pill px-2 py-1 rounded-2" style={{ fontSize: '0.625rem' }}>
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="d-flex align-items-center justify-content-between pt-2 border-top mt-auto">
          <div className="d-flex align-items-center gap-2">
            <div
              className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 fw-semibold"
              style={{ width: '1.25rem', height: '1.25rem', backgroundColor: 'var(--pb-surface-hover)', fontSize: '0.6rem' }}
            >
              {incident.author.first_name[0]?.toUpperCase()}
            </div>
            <span style={{ fontSize: '0.7rem', color: 'var(--pb-text-muted)' }} className="fw-medium">
              {incident.author.first_name} {incident.author.last_name[0]}.
            </span>
          </div>
          <span style={{ fontSize: '0.7rem', color: 'var(--pb-text-muted)' }} className="d-flex align-items-center gap-1">
            <i className="fa-regular fa-clock" style={{ fontSize: '0.55rem' }}></i> {timeAgo(incident.updated_at)}
          </span>
        </div>
      </Link>
    </div>
  )
}
