import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { ApiError } from '@/http/client'
import { clearSession } from '@/modules/auth/session'
import { listIncidents, type IncidentCategory, type IncidentSummary } from '../api'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'
import FiltersBar from '../components/FiltersBar'
import IncidentCard from '../components/IncidentCard'
import Pagination from '../components/Pagination'

const PER_PAGE = 9

export default function DashboardView() {
  const navigate = useNavigate()

  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [status, setStatus] = useState('')
  const [tag, setTag] = useState('')
  const [page, setPage] = useState(1)

  const [incidents, setIncidents] = useState<IncidentSummary[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Facet options for the category/tag filters, derived from a broad,
  // unfiltered fetch so they don't shrink as the user narrows their
  // search — there's no dedicated /api/categories or /api/tags endpoint
  // yet, so this is the best available source for "what exists".
  const [categoryOptions, setCategoryOptions] = useState<IncidentCategory[]>([])
  const [tagOptions, setTagOptions] = useState<string[]>([])

  useEffect(() => {
    listIncidents({ perPage: 200 })
      .then((res) => {
        const categories = new Map(res.incidents.map((i) => [i.category.slug, i.category]))
        const tags = new Set(res.incidents.flatMap((i) => i.tags))

        setCategoryOptions([...categories.values()].sort((a, b) => a.name.localeCompare(b.name)))
        setTagOptions([...tags].sort())
      })
      .catch(() => {
        // Facet options are a nice-to-have for the filter dropdowns; if
        // this fails, the filters below just start out empty.
      })
  }, [])

  useEffect(() => {
    const timeout = setTimeout(() => {
      setLoading(true)
      setError('')

      listIncidents({ category, status, tag, q: search, page, perPage: PER_PAGE })
        .then((res) => {
          setIncidents(res.incidents)
          setTotal(res.total)
        })
        .catch((err: unknown) => {
          if (err instanceof ApiError && err.code === 401) {
            clearSession()
            navigate('/login')

            return
          }

          setError(err instanceof ApiError ? err.message : 'Une erreur est survenue. Veuillez réessayer.')
        })
        .finally(() => setLoading(false))
    }, 250)

    return () => clearTimeout(timeout)
  }, [search, category, status, tag, page, navigate])

  function handleFilterChange(setter: (value: string) => void) {
    return (value: string) => {
      setter(value)
      setPage(1)
    }
  }

  function handleClear() {
    setSearch('')
    setCategory('')
    setStatus('')
    setTag('')
    setPage(1)
  }

  return (
    <div className="d-flex" style={{ minHeight: '100vh' }}>
      <Sidebar incidentCount={total} />

      <main className="flex-grow-1 d-flex flex-column min-w-0" style={{ backgroundColor: 'var(--pb-bg)' }}>
        <Topbar />

        <div className="flex-grow-1 overflow-y-auto">
          <div className="pb-max-w mx-auto px-4 px-lg-5 py-4">
            <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 mb-4">
              <div>
                <h1 className="h4 fw-bold mb-1">Coelbooks</h1>
                <p className="small mb-0" style={{ color: 'var(--pb-text-muted)' }}>
                  {total} solution{total > 1 ? 's' : ''} documentée{total > 1 ? 's' : ''} · Parcourez, cherchez, apprenez.
                </p>
              </div>
              <Link to="/incidents/new" className="btn btn-primary btn-sm fw-medium d-flex align-items-center gap-2 align-self-start align-self-sm-center">
                <i className="fa-solid fa-plus" style={{ fontSize: '0.7rem' }}></i> Nouveau coelbook
              </Link>
            </div>

            <FiltersBar
              search={search}
              onSearchChange={handleFilterChange(setSearch)}
              category={category}
              onCategoryChange={handleFilterChange(setCategory)}
              categoryOptions={categoryOptions}
              status={status}
              onStatusChange={handleFilterChange(setStatus)}
              tag={tag}
              onTagChange={handleFilterChange(setTag)}
              tagOptions={tagOptions}
              onClear={handleClear}
            />

            {error && (
              <div className="badge-danger-soft rounded-3 small mb-4 py-2 px-3" role="alert">
                {error}
              </div>
            )}

            {!error && loading && (
              <div className="text-center py-5" style={{ color: 'var(--pb-text-muted)' }}>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Chargement des coelbooks…
              </div>
            )}

            {!error && !loading && incidents.length === 0 && (
              <div className="text-center py-5" style={{ color: 'var(--pb-text-muted)' }}>
                <i className="fa-solid fa-book-bookmark mb-3 d-block" style={{ fontSize: '1.5rem' }}></i>
                {total === 0 ? 'Aucun coelbook pour l\'instant.' : 'Aucun coelbook ne correspond à ces filtres.'}
              </div>
            )}

            {!error && !loading && incidents.length > 0 && (
              <>
                <div className="pb-grid row row-cols-1 row-cols-md-2 row-cols-xl-3 g-3">
                  {incidents.map((incident) => (
                    <IncidentCard key={incident.id} incident={incident} />
                  ))}
                </div>

                <Pagination page={page} perPage={PER_PAGE} total={total} onPageChange={setPage} />
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
