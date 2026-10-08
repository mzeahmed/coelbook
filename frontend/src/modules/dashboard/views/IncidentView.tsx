import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'

import { ApiError } from '@/http/client'
import { errorMessage } from '@/http/errors'
import { clearSession } from '@/modules/auth/session'
import { getIncident, type IncidentDetail } from '../api'
import AppLayout from '../components/AppLayout'
import CodeBlock from '../components/CodeBlock'
import Markdown from '../components/Markdown'
import TableOfContents, { type TocEntry } from '../components/TableOfContents'
import { categoryBadgeClass, STATUS_BADGE, STATUS_LABEL, timeAgo } from '../lib/format'
import { markdownHeadings } from '../lib/headings'
import { slugify } from '../lib/slug'

// Sections are rendered in the order an incident is meant to be read:
// what happened, how it was investigated, why, how it was fixed, and how
// to avoid it next time. Empty sections are skipped.
const SECTIONS: { key: keyof Pick<IncidentDetail, 'problem' | 'diagnosis' | 'root_cause' | 'solution' | 'prevention'>; label: string; icon: string }[] = [
  { key: 'problem', label: 'Problème', icon: 'fa-triangle-exclamation' },
  { key: 'diagnosis', label: 'Diagnostic', icon: 'fa-magnifying-glass' },
  { key: 'root_cause', label: 'Cause racine', icon: 'fa-bullseye' },
  { key: 'solution', label: 'Solution', icon: 'fa-circle-check' },
  { key: 'prevention', label: 'Prévention', icon: 'fa-shield-halved' },
]

// Anchors are the French section names ("#solution", "#cause-racine"),
// since they show up in shared URLs.
const sectionId = (label: string) => slugify(label)
const SNIPPETS_ID = 'snippets'
const LINKS_ID = 'liens'

// A table of contents is only worth its space past this many entries.
const MIN_TOC_ENTRIES = 3

// How far below the top of the viewport (under the sticky top bar) a
// heading counts as "being read" for the table of contents highlight.
const ACTIVE_OFFSET_PX = 120

// tocEntries lists the filled sections in page order, each followed by its
// Markdown headings: the shallowest heading level found becomes level 1,
// the next one level 2, deeper ones are left out.
function tocEntries(incident: IncidentDetail): TocEntry[] {
  const entries: TocEntry[] = []

  for (const section of SECTIONS) {
    const markdown = incident[section.key]
    if (markdown.trim() === '') continue

    const id = sectionId(section.label)
    entries.push({ id, label: section.label, level: 0 })

    const headings = markdownHeadings(markdown, id)
    const top = Math.min(...headings.map((h) => h.depth))

    for (const h of headings) {
      const level = h.depth - top + 1
      if (level <= 2) entries.push({ id: h.id, label: h.text, level: level as 1 | 2 })
    }
  }

  if (incident.snippets.length > 0) entries.push({ id: SNIPPETS_ID, label: 'Snippets', level: 0 })
  if (incident.links.length > 0) entries.push({ id: LINKS_ID, label: 'Liens', level: 0 })

  return entries
}

export default function IncidentView() {
  const navigate = useNavigate()
  const { slug = '' } = useParams()
  const { hash } = useLocation()

  // The result is tagged with the slug it was fetched for, so loading is
  // derived (the result doesn't match the current slug yet) instead of
  // being reset synchronously inside the effect.
  const [result, setResult] = useState<{
    slug: string
    incident: IncidentDetail | null
    error: string
    notFound: boolean
  } | null>(null)

  useEffect(() => {
    let cancelled = false

    getIncident(slug)
      .then((incident) => {
        if (!cancelled) setResult({ slug, incident, error: '', notFound: false })
      })
      .catch((err: unknown) => {
        if (cancelled) return

        if (err instanceof ApiError && err.code === 401) {
          clearSession()
          navigate('/login')

          return
        }

        if (err instanceof ApiError && err.code === 404) {
          setResult({ slug, incident: null, error: '', notFound: true })

          return
        }

        const error = errorMessage(err)
        setResult({ slug, incident: null, error, notFound: false })
      })

    return () => {
      cancelled = true
    }
  }, [slug, navigate])

  const loading = result?.slug !== slug
  const incident = loading ? null : result.incident
  const error = loading ? '' : result.error
  const notFound = !loading && result.notFound

  const sections = incident ? SECTIONS.filter((s) => incident[s.key].trim() !== '') : []

  const toc = useMemo(() => (incident ? tocEntries(incident) : []), [incident])
  const showToc = toc.length >= MIN_TOC_ENTRIES
  const [activeId, setActiveId] = useState('')

  // The content arrives after the page has loaded, so the browser can't
  // honor a "#solution" in the URL on its own: scroll to it once rendered.
  useEffect(() => {
    if (!incident || !hash) return

    document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView()
  }, [incident, hash])

  // Highlight the last entry whose anchor has scrolled past the top of the
  // viewport. The whole window scrolls (the layout grows with its content).
  useEffect(() => {
    if (!showToc) return

    // Cheap enough (a handful of rect reads) to run on every scroll event,
    // and unlike requestAnimationFrame it also runs in a background tab.
    const update = () => {
      let current = toc[0]?.id ?? ''

      for (const entry of toc) {
        const el = document.getElementById(entry.id)
        if (!el || el.getBoundingClientRect().top > ACTIVE_OFFSET_PX) break
        current = entry.id
      }

      // At the very bottom the last entries may never reach the top: the
      // last one is the one being read. Only when the page does scroll.
      const page = document.scrollingElement ?? document.documentElement
      if (page.scrollHeight > window.innerHeight && window.scrollY + window.innerHeight >= page.scrollHeight - 2) {
        current = toc[toc.length - 1]?.id ?? current
      }

      setActiveId(current)
    }

    update()
    window.addEventListener('scroll', update, { passive: true })

    return () => window.removeEventListener('scroll', update)
  }, [toc, showToc])

  return (
    <AppLayout current={incident?.title}>
      <div className="mx-auto px-4 px-lg-5 py-4" style={{ maxWidth: showToc ? '74rem' : '56rem' }}>
        <div className={showToc ? 'pb-incident-layout' : ''}>
          <div className="min-w-0">
            <Link
              to="/dashboard"
              className="small text-decoration-none d-inline-flex align-items-center gap-2 mb-4"
              style={{ color: 'var(--pb-text-muted)' }}
            >
              <i className="fa-solid fa-arrow-left" style={{ fontSize: '0.7rem' }}></i> Retour aux coelbooks
            </Link>

            {error && (
              <div className="badge-danger-soft rounded-3 small mb-4 py-2 px-3" role="alert">
                {error}
              </div>
            )}

            {loading && (
              <div className="text-center py-5" style={{ color: 'var(--pb-text-muted)' }}>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Chargement du coelbook…
              </div>
            )}

            {!loading && notFound && (
              <div className="text-center py-5" style={{ color: 'var(--pb-text-muted)' }}>
                <i className="fa-solid fa-book-bookmark mb-3 d-block" style={{ fontSize: '1.5rem' }}></i>
                Ce coelbook n&apos;existe pas ou a été supprimé.
              </div>
            )}

            {!loading && incident && (
              <article>
                <header className="mb-4">
                  <div className="d-flex align-items-center gap-2 mb-3 flex-wrap">
                    <span className={`badge-soft ${categoryBadgeClass(incident.category.slug)}`}>
                      {incident.category.name}
                    </span>
                    <span className={`badge-soft ${STATUS_BADGE[incident.status]}`}>
                      <span className="badge-dot"></span> {STATUS_LABEL[incident.status]}
                    </span>
                  </div>

                  <div className="d-flex align-items-start justify-content-between gap-3 mb-2">
                    <h1 className="h3 fw-bold mb-0">{incident.title}</h1>
                    <div className="d-flex gap-2 flex-shrink-0">
                      <Link
                        to={`/incidents/${incident.slug}/history`}
                        className="btn btn-sm btn-outline-secondary fw-medium d-flex align-items-center gap-2"
                      >
                        <i className="fa-solid fa-clock-rotate-left" style={{ fontSize: '0.7rem' }}></i> Historique
                      </Link>
                      <Link
                        to={`/incidents/${incident.slug}/edit`}
                        className="btn btn-sm btn-outline-secondary fw-medium d-flex align-items-center gap-2"
                      >
                        <i className="fa-solid fa-pen" style={{ fontSize: '0.7rem' }}></i> Modifier
                      </Link>
                    </div>
                  </div>

                  {incident.summary && (
                    <p className="mb-3" style={{ color: 'var(--pb-text-muted)', lineHeight: 1.6 }}>
                      {incident.summary}
                    </p>
                  )}

                  <div className="d-flex align-items-center gap-3 flex-wrap small" style={{ color: 'var(--pb-text-muted)' }}>
                    <span className="fw-medium">
                      {incident.author.first_name} {incident.author.last_name}
                    </span>
                    <span className="d-flex align-items-center gap-1">
                      <i className="fa-regular fa-clock" style={{ fontSize: '0.65rem' }}></i>
                      Mis à jour {timeAgo(incident.updated_at)}
                    </span>
                  </div>

                  {incident.tags.length > 0 && (
                    <div className="d-flex flex-wrap gap-2 mt-3">
                      {incident.tags.map((tag) => (
                        <span key={tag} className="tag-pill px-2 py-1 rounded-2" style={{ fontSize: '0.7rem' }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </header>

                {showToc && (
                  <details className="pb-toc-mobile pb-card border rounded-4 p-3 mb-3 d-xl-none">
                    <summary className="small fw-semibold d-flex align-items-center gap-2">
                      <i className="fa-solid fa-chevron-right pb-toc-chevron" style={{ fontSize: '0.6rem' }}></i>
                      Sommaire
                    </summary>
                    <nav className="mt-2" aria-label="Sommaire">
                      <TableOfContents entries={toc} activeId={activeId} />
                    </nav>
                  </details>
                )}

                {sections.length === 0 && incident.snippets.length === 0 && incident.links.length === 0 && (
                  <div className="pb-card border rounded-4 p-4 small" style={{ color: 'var(--pb-text-muted)' }}>
                    Ce coelbook n&apos;a pas encore de contenu.
                  </div>
                )}

                <div className="d-flex flex-column gap-3">
                  {sections.map((section) => (
                    <section key={section.key} id={sectionId(section.label)} className="pb-card pb-anchor border rounded-4 p-4">
                      <h2 className="fs-6 fw-semibold d-flex align-items-center gap-2 mb-3">
                        <i className={`fa-solid ${section.icon}`} style={{ fontSize: '0.8rem', color: 'var(--pb-text-muted)' }}></i>
                        {section.label}
                      </h2>
                      <div className="small">
                        <Markdown headingIdPrefix={sectionId(section.label)}>{incident[section.key]}</Markdown>
                      </div>
                    </section>
                  ))}

                  {incident.snippets.length > 0 && (
                    <section id={SNIPPETS_ID} className="pb-card pb-anchor border rounded-4 p-4">
                      <h2 className="fs-6 fw-semibold d-flex align-items-center gap-2 mb-3">
                        <i className="fa-solid fa-code" style={{ fontSize: '0.8rem', color: 'var(--pb-text-muted)' }}></i>
                        Snippets
                      </h2>
                      <div className="d-flex flex-column gap-3">
                        {incident.snippets.map((snippet) => (
                          <CodeBlock key={snippet.id} title={snippet.title} language={snippet.language} code={snippet.content} />
                        ))}
                      </div>
                    </section>
                  )}

                  {incident.links.length > 0 && (
                    <section id={LINKS_ID} className="pb-card pb-anchor border rounded-4 p-4">
                      <h2 className="fs-6 fw-semibold d-flex align-items-center gap-2 mb-3">
                        <i className="fa-solid fa-link" style={{ fontSize: '0.8rem', color: 'var(--pb-text-muted)' }}></i>
                        Liens
                      </h2>
                      <ul className="list-unstyled d-flex flex-column gap-2 mb-0 small">
                        {incident.links.map((link) => (
                          <li key={link.id}>
                            <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-decoration-none">
                              {link.title}
                              <i className="fa-solid fa-arrow-up-right-from-square ms-2" style={{ fontSize: '0.6rem' }}></i>
                            </a>
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}
                </div>
              </article>
            )}
          </div>

          {showToc && (
            <aside className="d-none d-xl-block">
              <nav className="pb-toc-aside" aria-label="Sommaire">
                <div className="text-uppercase fw-semibold mb-2 px-2" style={{ fontSize: '0.625rem', letterSpacing: '0.08em', color: 'var(--pb-text-muted)' }}>
                  Sommaire
                </div>
                <TableOfContents entries={toc} activeId={activeId} />
              </nav>
            </aside>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
