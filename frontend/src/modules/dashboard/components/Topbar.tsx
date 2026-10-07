import { Link } from 'react-router-dom'

interface TopbarProps {
  // section is the breadcrumb after "Coelbook" (default: the incident
  // list). current, when set, is shown as a last breadcrumb after it,
  // and section then links back to its page.
  section?: { label: string; to: string }
  current?: string
}

const INCIDENTS = { label: 'Coelbooks', to: '/dashboard' }

export default function Topbar({ section = INCIDENTS, current }: TopbarProps) {
  return (
    <header
      className="pb-header d-flex align-items-center justify-content-between px-4 px-lg-5 border-bottom sticky-top flex-shrink-0"
      style={{ height: '3.5rem', zIndex: 10 }}
    >
      <div className="d-flex align-items-center gap-2 small min-w-0">
        <span style={{ color: 'var(--pb-text-muted)' }}>Coelbook</span>
        <i className="fa-solid fa-chevron-right" style={{ fontSize: '0.55rem', color: 'var(--pb-border)' }}></i>
        {current ? (
          <>
            <Link to={section.to} className="text-decoration-none" style={{ color: 'var(--pb-text-muted)' }}>
              {section.label}
            </Link>
            <i className="fa-solid fa-chevron-right" style={{ fontSize: '0.55rem', color: 'var(--pb-border)' }}></i>
            <span className="fw-medium text-truncate">{current}</span>
          </>
        ) : (
          <span className="fw-medium">{section.label}</span>
        )}
      </div>
    </header>
  )
}
