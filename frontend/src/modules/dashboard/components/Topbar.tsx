import { Link } from 'react-router-dom'

interface TopbarProps {
  // current, when set, is shown as a last breadcrumb after "Coelbooks",
  // which then links back to the list.
  current?: string
}

export default function Topbar({ current }: TopbarProps) {
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
            <Link to="/dashboard" className="text-decoration-none" style={{ color: 'var(--pb-text-muted)' }}>
              Coelbooks
            </Link>
            <i className="fa-solid fa-chevron-right" style={{ fontSize: '0.55rem', color: 'var(--pb-border)' }}></i>
            <span className="fw-medium text-truncate">{current}</span>
          </>
        ) : (
          <span className="fw-medium">Coelbooks</span>
        )}
      </div>
    </header>
  )
}
