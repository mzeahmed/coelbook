import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { ApiError } from '@/http/client'
import { clearSession } from '@/modules/auth/session'
import { getIncident, type IncidentDetail } from '../api'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'
import { categoryBadgeClass, STATUS_BADGE, STATUS_LABEL, timeAgo } from '../lib/format'

// Sections are rendered in the order an incident is meant to be read:
// what happened, how it was investigated, why, how it was fixed, and how
// to avoid it next time. Empty sections are skipped.
const SECTIONS: { key: keyof Pick<IncidentDetail, 'problem' | 'diagnosis' | 'root_cause' | 'solution' | 'prevention'>; label: string; icon: string }[] = [
  { key: 'problem', label: 'Problem', icon: 'fa-triangle-exclamation' },
  { key: 'diagnosis', label: 'Diagnosis', icon: 'fa-magnifying-glass' },
  { key: 'root_cause', label: 'Root cause', icon: 'fa-bullseye' },
  { key: 'solution', label: 'Solution', icon: 'fa-circle-check' },
  { key: 'prevention', label: 'Prevention', icon: 'fa-shield-halved' },
]

export default function IncidentView() {
  const navigate = useNavigate()
  const { slug = '' } = useParams()

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

        const error = err instanceof ApiError ? err.message : 'Something went wrong. Please try again.'
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

  return (
    <div className="d-flex" style={{ minHeight: '100vh' }}>
      <Sidebar />

      <main className="flex-grow-1 d-flex flex-column min-w-0" style={{ backgroundColor: 'var(--pb-bg)' }}>
        <Topbar current={incident?.title} />

        <div className="flex-grow-1 overflow-y-auto">
          <div className="mx-auto px-4 px-lg-5 py-4" style={{ maxWidth: '56rem' }}>
            <Link
              to="/dashboard"
              className="small text-decoration-none d-inline-flex align-items-center gap-2 mb-4"
              style={{ color: 'var(--pb-text-muted)' }}
            >
              <i className="fa-solid fa-arrow-left" style={{ fontSize: '0.7rem' }}></i> Back to coelbooks
            </Link>

            {error && (
              <div className="badge-danger-soft rounded-3 small mb-4 py-2 px-3" role="alert">
                {error}
              </div>
            )}

            {loading && (
              <div className="text-center py-5" style={{ color: 'var(--pb-text-muted)' }}>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Loading coelbook…
              </div>
            )}

            {!loading && notFound && (
              <div className="text-center py-5" style={{ color: 'var(--pb-text-muted)' }}>
                <i className="fa-solid fa-book-bookmark mb-3 d-block" style={{ fontSize: '1.5rem' }}></i>
                This coelbook doesn't exist or has been removed.
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
                    <Link
                      to={`/incidents/${incident.slug}/edit`}
                      className="btn btn-sm btn-outline-secondary fw-medium flex-shrink-0 d-flex align-items-center gap-2"
                    >
                      <i className="fa-solid fa-pen" style={{ fontSize: '0.7rem' }}></i> Edit
                    </Link>
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
                      Updated {timeAgo(incident.updated_at)}
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

                {sections.length === 0 && incident.snippets.length === 0 && incident.links.length === 0 && (
                  <div className="pb-card border rounded-4 p-4 small" style={{ color: 'var(--pb-text-muted)' }}>
                    This coelbook has no content yet.
                  </div>
                )}

                <div className="d-flex flex-column gap-3">
                  {sections.map((section) => (
                    <section key={section.key} className="pb-card border rounded-4 p-4">
                      <h2 className="fs-6 fw-semibold d-flex align-items-center gap-2 mb-3">
                        <i className={`fa-solid ${section.icon}`} style={{ fontSize: '0.8rem', color: 'var(--pb-text-muted)' }}></i>
                        {section.label}
                      </h2>
                      <div className="pb-section-body small mb-0">{incident[section.key]}</div>
                    </section>
                  ))}

                  {incident.snippets.length > 0 && (
                    <section className="pb-card border rounded-4 p-4">
                      <h2 className="fs-6 fw-semibold d-flex align-items-center gap-2 mb-3">
                        <i className="fa-solid fa-code" style={{ fontSize: '0.8rem', color: 'var(--pb-text-muted)' }}></i>
                        Snippets
                      </h2>
                      <div className="d-flex flex-column gap-3">
                        {incident.snippets.map((snippet) => (
                          <div key={snippet.id}>
                            <div className="d-flex align-items-center justify-content-between mb-2 small">
                              <span className="fw-medium">{snippet.title}</span>
                              <span className="font-mono" style={{ fontSize: '0.7rem', color: 'var(--pb-text-muted)' }}>
                                {snippet.language}
                              </span>
                            </div>
                            <pre className="pb-code font-mono rounded-3 p-3 mb-0">
                              <code>{snippet.content}</code>
                            </pre>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {incident.links.length > 0 && (
                    <section className="pb-card border rounded-4 p-4">
                      <h2 className="fs-6 fw-semibold d-flex align-items-center gap-2 mb-3">
                        <i className="fa-solid fa-link" style={{ fontSize: '0.8rem', color: 'var(--pb-text-muted)' }}></i>
                        Links
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
        </div>
      </main>
    </div>
  )
}
