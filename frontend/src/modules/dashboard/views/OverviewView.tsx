import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { ApiError } from '@/http/client'
import { errorMessage } from '@/http/errors'
import { clearSession, getUser } from '@/modules/auth/session'
import { getStats, type Stats } from '../api'
import ActivityChart from '../components/ActivityChart'
import CategoryBars from '../components/CategoryBars'
import Sidebar from '../components/Sidebar'
import StatTile from '../components/StatTile'
import Topbar from '../components/Topbar'
import { categoryBadgeClass, STATUS_BADGE, STATUS_LABEL, timeAgo } from '../lib/format'

const SECTION = { label: 'Tableau de bord', to: '/overview' }

function Panel({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="pb-card border rounded-4 p-4 h-100">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h2 className="fs-6 fw-semibold mb-0">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="small" style={{ color: 'var(--pb-text-muted)' }}>
      {children}
    </div>
  )
}

// OverviewView is the landing page after sign-in: headline figures, recent
// activity and how the knowledge base is spread across categories and tags.
export default function OverviewView() {
  const navigate = useNavigate()
  const user = getUser()

  const [stats, setStats] = useState<Stats | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    getStats()
      .then((s) => {
        if (!cancelled) setStats(s)
      })
      .catch((err: unknown) => {
        if (cancelled) return

        if (err instanceof ApiError && err.code === 401) {
          clearSession()
          navigate('/login')

          return
        }

        setError(errorMessage(err))
      })

    return () => {
      cancelled = true
    }
  }, [navigate])

  const createdThisPeriod = stats?.activity.reduce((sum, w) => sum + w.total, 0) ?? 0

  return (
    <div className="d-flex" style={{ minHeight: '100vh' }}>
      <Sidebar incidentCount={stats?.total} />

      <main className="flex-grow-1 d-flex flex-column min-w-0" style={{ backgroundColor: 'var(--pb-bg)' }}>
        <Topbar section={SECTION} />

        <div className="flex-grow-1 overflow-y-auto">
          <div className="pb-max-w mx-auto px-4 px-lg-5 py-4">
            <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 mb-4">
              <div>
                <h1 className="h4 fw-bold mb-1">Bonjour{user?.first_name ? ` ${user.first_name}` : ''}</h1>
                <p className="small mb-0" style={{ color: 'var(--pb-text-muted)' }}>
                  Voici l&apos;état de votre base de connaissances.
                </p>
              </div>
              <Link
                to="/incidents/new"
                className="btn btn-primary btn-sm fw-medium d-flex align-items-center gap-2 align-self-start align-self-sm-center"
              >
                <i className="fa-solid fa-plus" style={{ fontSize: '0.7rem' }}></i> Nouveau coelbook
              </Link>
            </div>

            {error && (
              <div className="badge-danger-soft rounded-3 small mb-4 py-2 px-3" role="alert">
                {error}
              </div>
            )}

            {!error && !stats && (
              <div className="text-center py-5" style={{ color: 'var(--pb-text-muted)' }}>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Chargement du tableau de bord…
              </div>
            )}

            {stats && (
              <div className="d-flex flex-column gap-3">
                <div className="row g-3">
                  <div className="col-6 col-lg-3">
                    <StatTile label="Coelbooks" value={stats.total} to="/dashboard" />
                  </div>
                  {(['published', 'draft', 'archived'] as const).map((status) => (
                    <div key={status} className="col-6 col-lg-3">
                      <StatTile
                        label={`${STATUS_LABEL[status]}s`}
                        value={stats.by_status[status]}
                        dotClass={STATUS_BADGE[status]}
                        to={`/dashboard?status=${status}`}
                      />
                    </div>
                  ))}
                </div>

                <div className="row g-3">
                  <div className="col-lg-7">
                    <Panel
                      title="Récemment modifiés"
                      action={
                        <Link to="/dashboard" className="small text-decoration-none">
                          Tout voir
                        </Link>
                      }
                    >
                      {stats.recent.length === 0 ? (
                        <Empty>
                          Aucun coelbook pour l&apos;instant. <Link to="/incidents/new">Documentez votre premier problème résolu</Link>.
                        </Empty>
                      ) : (
                        <ul className="list-unstyled mb-0">
                          {stats.recent.map((incident, i) => (
                            <li key={incident.slug} className={i < stats.recent.length - 1 ? 'border-bottom' : ''}>
                              <Link
                                to={`/incidents/${incident.slug}`}
                                className="pb-bar-row d-flex align-items-center gap-3 rounded-2 px-2 py-2 text-decoration-none"
                                style={{ color: 'inherit' }}
                              >
                                <div className="flex-grow-1 min-w-0">
                                  <div className="small fw-medium text-truncate">{incident.title}</div>
                                  <div className="d-flex align-items-center gap-2 mt-1 flex-wrap">
                                    <span className={`badge-soft ${categoryBadgeClass(incident.category.slug)}`}>
                                      {incident.category.name}
                                    </span>
                                    <span className={`badge-soft ${STATUS_BADGE[incident.status]}`}>
                                      <span className="badge-dot"></span> {STATUS_LABEL[incident.status]}
                                    </span>
                                  </div>
                                </div>
                                <span className="flex-shrink-0" style={{ fontSize: '0.7rem', color: 'var(--pb-text-muted)' }}>
                                  {timeAgo(incident.updated_at)}
                                </span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </Panel>
                  </div>

                  <div className="col-lg-5">
                    <Panel title="Activité">
                      <p className="small mb-3" style={{ color: 'var(--pb-text-muted)' }}>
                        {createdThisPeriod === 0
                          ? 'Aucun coelbook créé ces 12 dernières semaines.'
                          : `${createdThisPeriod} coelbook${createdThisPeriod > 1 ? 's' : ''} créé${createdThisPeriod > 1 ? 's' : ''} ces 12 dernières semaines.`}
                      </p>
                      <ActivityChart weeks={stats.activity} />
                    </Panel>
                  </div>
                </div>

                <div className="row g-3">
                  <div className="col-lg-7">
                    <Panel
                      title="Par catégorie"
                      action={
                        <Link to="/categories" className="small text-decoration-none">
                          Gérer
                        </Link>
                      }
                    >
                      {stats.categories.length === 0 ? (
                        <Empty>
                          Aucune catégorie. <Link to="/categories">Créez-en une</Link>.
                        </Empty>
                      ) : (
                        <CategoryBars categories={stats.categories} />
                      )}
                    </Panel>
                  </div>

                  <div className="col-lg-5">
                    <Panel title="Tags les plus utilisés">
                      {stats.top_tags.length === 0 ? (
                        <Empty>Aucun tag utilisé pour l&apos;instant.</Empty>
                      ) : (
                        <div className="d-flex flex-wrap gap-2">
                          {stats.top_tags.map((t) => (
                            <Link
                              key={t.slug}
                              to={`/dashboard?tag=${encodeURIComponent(t.slug)}`}
                              className="tag-pill d-inline-flex align-items-center gap-2 px-2 py-1 rounded-2 small text-decoration-none"
                            >
                              <i className="fa-solid fa-tag" style={{ fontSize: '0.55rem' }}></i>
                              {t.name}
                              <span className="font-mono" style={{ fontSize: '0.65rem' }}>
                                {t.incident_count}
                              </span>
                            </Link>
                          ))}
                        </div>
                      )}
                    </Panel>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
