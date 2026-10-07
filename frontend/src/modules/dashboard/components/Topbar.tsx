import { Link } from 'react-router-dom'

interface TopbarProps {
  // section is the breadcrumb after "Coelbook" (default: the incident
  // list). current, when set, is shown as a last breadcrumb after it,
  // and section then links back to its page.
  section?: { label: string; to: string }
  current?: string
  // onOpenMenu shows the menu button (below the md breakpoint, where the
  // sidebar is hidden) and is called when it's pressed.
  onOpenMenu?: () => void
  menuOpen?: boolean
  // onOpenSearch shows the quick-search button and is called when it's
  // pressed.
  onOpenSearch?: () => void
}

// Shortcut label for the quick search, in the platform's convention.
const SEARCH_SHORTCUT = /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘K' : 'Ctrl K'

const INCIDENTS = { label: 'Coelbooks', to: '/dashboard' }

export default function Topbar({ section = INCIDENTS, current, onOpenMenu, menuOpen = false, onOpenSearch }: TopbarProps) {
  return (
    <header
      className="pb-header d-flex align-items-center gap-3 px-3 px-md-4 px-lg-5 border-bottom sticky-top flex-shrink-0"
      style={{ height: '3.5rem', zIndex: 10 }}
    >
      {onOpenMenu && (
        <button
          type="button"
          className="btn btn-sm border-0 d-md-none px-1"
          onClick={onOpenMenu}
          aria-label="Ouvrir le menu"
          aria-expanded={menuOpen}
          aria-controls="pb-mobile-menu"
        >
          <i className="fa-solid fa-bars"></i>
        </button>
      )}

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

      {onOpenSearch && (
        <button
          type="button"
          className="pb-search-button btn btn-sm d-flex align-items-center gap-2 ms-auto flex-shrink-0"
          onClick={onOpenSearch}
          aria-label="Recherche rapide"
          aria-keyshortcuts="Control+K Meta+K"
        >
          <i className="fa-solid fa-magnifying-glass" style={{ fontSize: '0.75rem' }}></i>
          <span className="d-none d-sm-inline small">Rechercher…</span>
          <kbd className="d-none d-lg-inline">{SEARCH_SHORTCUT}</kbd>
        </button>
      )}
    </header>
  )
}
