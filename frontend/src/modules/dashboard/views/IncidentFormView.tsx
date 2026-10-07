import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { ApiError } from '@/http/client'
import { errorMessage } from '@/http/errors'
import { clearSession } from '@/modules/auth/session'
import {
  createIncident,
  getIncident,
  listCategories,
  updateIncident,
  type IncidentCategory,
  type IncidentStatus,
  type IncidentWriteRequest,
} from '../api'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'
import { STATUS_LABEL } from '../lib/format'

const EMPTY_FORM: IncidentWriteRequest = {
  title: '',
  summary: '',
  problem: '',
  diagnosis: '',
  root_cause: '',
  solution: '',
  prevention: '',
  status: 'draft',
  category: '',
  tags: [],
}

const SECTIONS: { key: 'problem' | 'diagnosis' | 'root_cause' | 'solution' | 'prevention'; label: string; hint: string }[] = [
  { key: 'problem', label: 'Problème', hint: 'Symptômes et comportement observé.' },
  { key: 'diagnosis', label: 'Diagnostic', hint: 'Comment le problème a été analysé.' },
  { key: 'root_cause', label: 'Cause racine', hint: 'Pourquoi c\'est arrivé.' },
  { key: 'solution', label: 'Solution', hint: 'Les étapes qui l\'ont résolu.' },
  { key: 'prevention', label: 'Prévention', hint: 'Comment l\'éviter la prochaine fois.' },
]

const STATUSES: IncidentStatus[] = ['draft', 'published', 'archived']

// parseTags splits the comma-separated tags input; the API trims names and
// drops blanks and duplicates, so this only needs to split.
function parseTags(input: string): string[] {
  return input.split(',').map((t) => t.trim()).filter((t) => t !== '')
}

// IncidentFormView is both the creation form (/incidents/new) and the edit
// form (/incidents/:slug/edit), depending on whether a slug is in the URL.
export default function IncidentFormView() {
  const navigate = useNavigate()
  const { slug } = useParams()
  const editing = slug !== undefined

  const [form, setForm] = useState<IncidentWriteRequest>(EMPTY_FORM)
  // Tags are edited as free text and only parsed on submit, so typing a
  // comma or a trailing space isn't fought by re-formatting.
  const [tagsInput, setTagsInput] = useState('')
  const [categories, setCategories] = useState<IncidentCategory[]>([])

  const [loaded, setLoaded] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [notFound, setNotFound] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    Promise.all([listCategories(), editing ? getIncident(slug) : Promise.resolve(null)])
      .then(([cats, incident]) => {
        if (cancelled) return

        setCategories(cats)

        if (incident) {
          setForm({
            title: incident.title,
            summary: incident.summary,
            problem: incident.problem,
            diagnosis: incident.diagnosis,
            root_cause: incident.root_cause,
            solution: incident.solution,
            prevention: incident.prevention,
            status: incident.status,
            category: incident.category.slug,
            tags: incident.tags,
          })
          setTagsInput(incident.tags.join(', '))
        }

        setLoaded(true)
      })
      .catch((err: unknown) => {
        if (cancelled) return

        if (err instanceof ApiError && err.code === 401) {
          clearSession()
          navigate('/login')

          return
        }

        if (err instanceof ApiError && err.code === 404) {
          setNotFound(true)

          return
        }

        setLoadError(errorMessage(err))
      })

    return () => {
      cancelled = true
    }
  }, [editing, slug, navigate])

  function update<K extends keyof IncidentWriteRequest>(key: K, value: IncidentWriteRequest[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    const payload = { ...form, tags: parseTags(tagsInput) }

    try {
      const saved = editing ? await updateIncident(slug, payload) : await createIncident(payload)
      navigate(`/incidents/${saved.slug}`)
    } catch (err) {
      if (err instanceof ApiError && err.code === 401) {
        clearSession()
        navigate('/login')

        return
      }

      setError(errorMessage(err))
      setSubmitting(false)
    }
  }

  const cancelTo = editing ? `/incidents/${slug}` : '/dashboard'
  const heading = editing ? 'Modifier le coelbook' : 'Nouveau coelbook'

  return (
    <div className="d-flex" style={{ minHeight: '100vh' }}>
      <Sidebar />

      <main className="flex-grow-1 d-flex flex-column min-w-0" style={{ backgroundColor: 'var(--pb-bg)' }}>
        <Topbar current={heading} />

        <div className="flex-grow-1 overflow-y-auto">
          <div className="mx-auto px-4 px-lg-5 py-4" style={{ maxWidth: '56rem' }}>
            <h1 className="h4 fw-bold mb-4">{heading}</h1>

            {loadError && (
              <div className="badge-danger-soft rounded-3 small mb-4 py-2 px-3" role="alert">
                {loadError}
              </div>
            )}

            {notFound && (
              <div className="text-center py-5" style={{ color: 'var(--pb-text-muted)' }}>
                <i className="fa-solid fa-book-bookmark mb-3 d-block" style={{ fontSize: '1.5rem' }}></i>
                Ce coelbook n&apos;existe pas ou a été supprimé.
              </div>
            )}

            {!loaded && !loadError && !notFound && (
              <div className="text-center py-5" style={{ color: 'var(--pb-text-muted)' }}>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Chargement…
              </div>
            )}

            {loaded && (
              <form onSubmit={handleSubmit} className="d-flex flex-column gap-3">
                <section className="pb-card border rounded-4 p-4 d-flex flex-column gap-3">
                  <div>
                    <label className="form-label small fw-medium" htmlFor="incident-title">
                      Titre
                    </label>
                    <input
                      id="incident-title"
                      className="form-control"
                      value={form.title}
                      onChange={(e) => update('title', e.target.value)}
                      maxLength={200}
                      required
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="form-label small fw-medium" htmlFor="incident-summary">
                      Résumé
                    </label>
                    <textarea
                      id="incident-summary"
                      className="form-control"
                      rows={2}
                      value={form.summary}
                      onChange={(e) => update('summary', e.target.value)}
                    />
                  </div>

                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-medium" htmlFor="incident-category">
                        Catégorie
                      </label>
                      <select
                        id="incident-category"
                        className="form-select"
                        value={form.category}
                        onChange={(e) => update('category', e.target.value)}
                        required
                      >
                        <option value="" disabled>
                          Choisir une catégorie
                        </option>
                        {categories.map((c) => (
                          <option key={c.slug} value={c.slug}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-medium" htmlFor="incident-status">
                        Statut
                      </label>
                      <select
                        id="incident-status"
                        className="form-select"
                        value={form.status}
                        onChange={(e) => update('status', e.target.value as IncidentStatus)}
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {STATUS_LABEL[s]}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="form-label small fw-medium" htmlFor="incident-tags">
                      Tags
                    </label>
                    <input
                      id="incident-tags"
                      className="form-control"
                      value={tagsInput}
                      onChange={(e) => setTagsInput(e.target.value)}
                      placeholder="docker, postgres, ci"
                    />
                    <div className="form-text small">Séparés par des virgules. Les nouveaux tags sont créés automatiquement.</div>
                  </div>
                </section>

                {SECTIONS.map((section) => (
                  <section key={section.key} className="pb-card border rounded-4 p-4">
                    <label className="form-label fw-semibold mb-1" htmlFor={`incident-${section.key}`}>
                      {section.label}
                    </label>
                    <div className="small mb-2" style={{ color: 'var(--pb-text-muted)' }}>
                      {section.hint}
                    </div>
                    <textarea
                      id={`incident-${section.key}`}
                      className="form-control"
                      rows={5}
                      value={form[section.key]}
                      onChange={(e) => update(section.key, e.target.value)}
                    />
                  </section>
                ))}

                {error && (
                  <div className="badge-danger-soft rounded-3 small py-2 px-3" role="alert">
                    {error}
                  </div>
                )}

                <div className="d-flex justify-content-end gap-2 pb-4">
                  <Link to={cancelTo} className="btn btn-outline-secondary fw-medium">
                    Annuler
                  </Link>
                  <button type="submit" className="btn btn-primary fw-medium" disabled={submitting}>
                    {submitting && (
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    )}
                    {editing ? 'Enregistrer' : 'Créer le coelbook'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
