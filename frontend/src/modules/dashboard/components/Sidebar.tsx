import { Link, useLocation } from 'react-router-dom'

import { clearSession, getUser } from '@/modules/auth/session'

interface SidebarProps {
  // incidentCount is the total number of incidents, whatever the current
  // filters; pages that don't know it omit it and the badge is hidden.
  incidentCount?: number
  // className positions the sidebar: AppLayout renders it as a sticky
  // column on desktop and inside the mobile menu panel.
  className?: string
  // onClose, when set, adds a close button to the header (mobile menu).
  onClose?: () => void
}

export default function Sidebar({ incidentCount, className = '', onClose }: SidebarProps) {
  const user = getUser()
  const { pathname } = useLocation()

  // Incident pages belong to the "Coelbooks" entry.
  const section =
    ['/categories', '/tags', '/settings', '/overview', '/help'].find((prefix) => pathname.startsWith(prefix))?.slice(1) ??
    'incidents'
  const navClass = (active: boolean) =>
    `pb-nav-link ${active ? 'active' : ''} d-flex align-items-center gap-3 px-3 py-2 rounded-3 text-decoration-none small`

  function handleSignOut() {
    clearSession()
    window.location.assign('/login')
  }

  return (
    <aside className={`pb-surface border-end flex-shrink-0 flex-column ${className}`} style={{ width: '15rem' }}>
      <div
        className="d-flex align-items-center justify-content-between px-3 border-bottom flex-shrink-0"
        style={{ height: '3.5rem' }}
      >
        <div className="d-flex align-items-center gap-2 fw-semibold">
          <div
            className="d-flex align-items-center justify-content-center rounded-2 flex-shrink-0"
            style={{ width: '1.75rem', height: '1.75rem', backgroundColor: 'var(--pb-primary)' }}
          >
            <i className="fa-solid fa-book-bookmark text-white" style={{ fontSize: '0.7rem' }}></i>
          </div>
          Coelbook
        </div>
        {onClose && (
          <button type="button" className="btn-close" onClick={onClose} aria-label="Fermer le menu"></button>
        )}
      </div>

      <nav className="flex-grow-1 overflow-y-auto py-3 px-2 d-flex flex-column gap-1">
        <p
          className="px-2 mb-1 mt-2 text-uppercase fw-semibold"
          style={{ fontSize: '0.625rem', letterSpacing: '0.08em', color: 'var(--pb-text-muted)' }}
        >
          Connaissances
        </p>

        <Link
          to="/overview"
          className={navClass(section === 'overview')}
          aria-current={section === 'overview' ? 'page' : undefined}
        >
          <i className="fa-solid fa-layer-group text-center" style={{ width: '1rem' }}></i>
          <span className="fw-medium">Tableau de bord</span>
        </Link>

        <Link
          to="/dashboard"
          className={navClass(section === 'incidents')}
          aria-current={section === 'incidents' ? 'page' : undefined}
        >
          <i className="fa-solid fa-file-code text-center" style={{ width: '1rem' }}></i>
          <span className="fw-medium">Coelbooks</span>
          {incidentCount !== undefined && (
            <span
              className="font-mono ms-auto rounded-2 border px-2 py-0"
              style={{ fontSize: '0.625rem', backgroundColor: 'var(--pb-bg)', color: 'var(--pb-text-muted)' }}
            >
              {incidentCount}
            </span>
          )}
        </Link>

        <Link
          to="/categories"
          className={navClass(section === 'categories')}
          aria-current={section === 'categories' ? 'page' : undefined}
        >
          <i className="fa-solid fa-folder-tree text-center" style={{ width: '1rem' }}></i>
          <span className="fw-medium">Catégories</span>
        </Link>

        <Link to="/tags" className={navClass(section === 'tags')} aria-current={section === 'tags' ? 'page' : undefined}>
          <i className="fa-solid fa-tags text-center" style={{ width: '1rem' }}></i>
          <span className="fw-medium">Tags</span>
        </Link>

        <p
          className="px-2 mb-1 mt-4 text-uppercase fw-semibold"
          style={{ fontSize: '0.625rem', letterSpacing: '0.08em', color: 'var(--pb-text-muted)' }}
        >
          Système
        </p>

        <Link to="/help" className={navClass(section === 'help')} aria-current={section === 'help' ? 'page' : undefined}>
          <i className="fa-solid fa-circle-question text-center" style={{ width: '1rem' }}></i>
          <span className="fw-medium">Aide</span>
        </Link>

        <Link
          to="/settings"
          className={navClass(section === 'settings')}
          aria-current={section === 'settings' ? 'page' : undefined}
        >
          <i className="fa-solid fa-gear text-center" style={{ width: '1rem' }}></i>
          <span className="fw-medium">Paramètres</span>
        </Link>
      </nav>

      <div className="p-3 border-top flex-shrink-0">
        <div className="d-flex align-items-center gap-2 p-2 rounded-3">
          <div
            className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 fw-semibold"
            style={{ width: '1.75rem', height: '1.75rem', backgroundColor: 'var(--pb-surface-hover)', fontSize: '0.7rem' }}
          >
            {(user?.first_name?.[0] ?? '?').toUpperCase()}
          </div>
          <div className="flex-grow-1 min-w-0">
            <p className="mb-0 small fw-semibold text-truncate">
              {user ? `${user.first_name} ${user.last_name}` : 'Utilisateur inconnu'}
            </p>
            <p className="mb-0 text-truncate" style={{ fontSize: '0.625rem', color: 'var(--pb-text-muted)' }}>
              {user?.email}
            </p>
          </div>
          <button
            type="button"
            className="btn btn-sm p-0 border-0"
            style={{ color: 'var(--pb-text-muted)' }}
            onClick={handleSignOut}
            aria-label="Se déconnecter"
            title="Se déconnecter"
          >
            <i className="fa-solid fa-arrow-right-from-bracket" style={{ fontSize: '0.7rem' }}></i>
          </button>
        </div>
      </div>
    </aside>
  )
}
