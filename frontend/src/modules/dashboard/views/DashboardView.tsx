import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

import { ApiError } from '@/http/client'
import { errorMessage } from '@/http/errors'
import { clearSession } from '@/modules/auth/session'
import { listCategories, listIncidents, listTags, type IncidentCategory, type IncidentSummary, type IncidentTag } from '../api'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'
import FiltersBar from '../components/FiltersBar'
import IncidentCard from '../components/IncidentCard'
import Pagination from '../components/Pagination'

const PER_PAGE = 9

export default function DashboardView() {
  const navigate = useNavigate()

  // Filters live in the URL (?q=&category=&status=&tag=&page=) so a
  // filtered list can be linked to — the overview's category and tag links
  // land here — shared, and survives a reload. They're read once on mount
  // and written back on every change.
  const [params, setParams] = useSearchParams()
  const [search, setSearch] = useState(() => params.get('q') ?? '')
  const [category, setCategory] = useState(() => params.get('category') ?? '')
  const [status, setStatus] = useState(() => params.get('status') ?? '')
  const [tag, setTag] = useState(() => params.get('tag') ?? '')
  const [page, setPage] = useState(() => Math.max(1, Number(params.get('page')) || 1))

  useEffect(() => {
    const next = new URLSearchParams()
    if (search) next.set('q', search)
    if (category) next.set('category', category)
    if (status) next.set('status', status)
    if (tag) next.set('tag', tag)
    if (page > 1) next.set('page', String(page))

    // replace: typing in the search box shouldn't fill the history.
    setParams(next, { replace: true })
  }, [search, category, status, tag, page, setParams])

  const [incidents, setIncidents] = useState<IncidentSummary[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Facet options for the category/tag filters. They come from dedicated
  // endpoints rather than from the incident list, so they don't shrink as
  // the user narrows their search.
  const [categoryOptions, setCategoryOptions] = useState<IncidentCategory[]>([])
  const [tagOptions, setTagOptions] = useState<IncidentTag[]>([])

  useEffect(() => {
    Promise.all([listCategories(), listTags()])
      .then(([categories, tags]) => {
        setCategoryOptions(categories)
        setTagOptions(tags)
      })
      .catch(() => {
        // Facet options are a nice-to-have for the filter dropdowns; if
        // this fails, the filters below just start out empty. A 401 is
        // handled by the incident list request below.
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

          setError(errorMessage(err))
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
