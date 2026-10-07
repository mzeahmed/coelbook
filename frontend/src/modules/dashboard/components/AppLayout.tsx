import { useEffect, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'

import Sidebar from './Sidebar'
import Topbar from './Topbar'

interface AppLayoutProps {
  // Breadcrumb of the page (see Topbar).
  section?: { label: string; to: string }
  current?: string
  // Total number of incidents for the sidebar badge (see Sidebar).
  incidentCount?: number
  children: ReactNode
}

// AppLayout is the shell of every signed-in page: the sidebar, the top bar
// with the breadcrumb, and the page content.
//
// The window scrolls (anchors and the incident table of contents rely on
// it); the sidebar is a sticky, full-height column so it stays in view.
// Below the md breakpoint the sidebar is hidden and the top bar's menu
// button opens it as a slide-in panel instead.
export default function AppLayout({ section, current, incidentCount, children }: AppLayoutProps) {
  const { pathname } = useLocation()

  // The menu is open for the page it was opened on: following a link
  // changes the pathname, which closes it without an effect.
  const [menuOpenOn, setMenuOpenOn] = useState<string | null>(null)
  const menuOpen = menuOpenOn === pathname
  const closeMenu = () => setMenuOpenOn(null)

  useEffect(() => {
    if (!menuOpen) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpenOn(null)
    }

    // The page behind the open panel shouldn't scroll.
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = overflow
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [menuOpen])

  return (
    <div className="d-flex" style={{ minHeight: '100vh' }}>
      <Sidebar incidentCount={incidentCount} className="pb-sidebar d-none d-md-flex" />

      {menuOpen && (
        <>
          <div
            id="pb-mobile-menu"
            className="offcanvas offcanvas-start show d-md-none"
            style={{ width: '15rem', visibility: 'visible' }}
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
          >
            <Sidebar incidentCount={incidentCount} className="d-flex h-100 border-0" onClose={closeMenu} />
          </div>
          <div className="offcanvas-backdrop fade show d-md-none" onClick={closeMenu}></div>
        </>
      )}

      <main className="flex-grow-1 d-flex flex-column min-w-0" style={{ backgroundColor: 'var(--pb-bg)' }}>
        <Topbar
          section={section}
          current={current}
          onOpenMenu={() => setMenuOpenOn(pathname)}
          menuOpen={menuOpen}
        />

        <div className="flex-grow-1">{children}</div>
      </main>
    </div>
  )
}
