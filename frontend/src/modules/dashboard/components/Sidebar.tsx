import { Link } from 'react-router-dom'

import { clearSession, getUser } from '@/modules/auth/session'

interface SidebarProps {
  // incidentCount is omitted on pages that don't load the incident list;
  // the count badge is then hidden.
  incidentCount?: number
}

// Nav items other than "Coelbooks" don't lead anywhere yet — they're
// rendered as inert buttons (not links) so the sidebar communicates the
// product's intended shape without pretending to navigate somewhere.
export default function Sidebar({ incidentCount }: SidebarProps) {
  const user = getUser()

  function handleSignOut() {
    clearSession()
    window.location.assign('/login')
  }

  return (
    <aside
      className="pb-surface border-end flex-shrink-0 d-none d-md-flex flex-column"
      style={{ width: '15rem', minHeight: '100vh' }}
    >
      <div
        className="d-flex align-items-center px-3 border-bottom flex-shrink-0"
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
      </div>

      <nav className="flex-grow-1 overflow-y-auto py-3 px-2 d-flex flex-column gap-1">
        <p
          className="px-2 mb-1 mt-2 text-uppercase fw-semibold"
          style={{ fontSize: '0.625rem', letterSpacing: '0.08em', color: 'var(--pb-text-muted)' }}
        >
          Connaissances
        </p>

        <button
          type="button"
          className="pb-nav-link btn text-start d-flex align-items-center gap-3 px-3 py-2 rounded-3 small border-0"
        >
          <i className="fa-solid fa-layer-group text-center" style={{ width: '1rem' }}></i>
          <span className="fw-medium">Tableau de bord</span>
        </button>

        <Link
          to="/dashboard"
          className="pb-nav-link active d-flex align-items-center gap-3 px-3 py-2 rounded-3 text-decoration-none small"
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

        <button
          type="button"
          className="pb-nav-link btn text-start d-flex align-items-center gap-3 px-3 py-2 rounded-3 small border-0"
        >
          <i className="fa-solid fa-folder-tree text-center" style={{ width: '1rem' }}></i>
          <span className="fw-medium">Catégories</span>
        </button>

        <button
          type="button"
          className="pb-nav-link btn text-start d-flex align-items-center gap-3 px-3 py-2 rounded-3 small border-0"
        >
          <i className="fa-solid fa-tags text-center" style={{ width: '1rem' }}></i>
          <span className="fw-medium">Tags</span>
        </button>

        <p
          className="px-2 mb-1 mt-4 text-uppercase fw-semibold"
          style={{ fontSize: '0.625rem', letterSpacing: '0.08em', color: 'var(--pb-text-muted)' }}
        >
          Système
        </p>

        <button
          type="button"
          className="pb-nav-link btn text-start d-flex align-items-center gap-3 px-3 py-2 rounded-3 small border-0"
        >
          <i className="fa-solid fa-gear text-center" style={{ width: '1rem' }}></i>
          <span className="fw-medium">Paramètres</span>
        </button>
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
