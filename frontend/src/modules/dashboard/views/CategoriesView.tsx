import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'

import { ApiError } from '@/http/client'
import { errorMessage } from '@/http/errors'
import { clearSession } from '@/modules/auth/session'
import {
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
  type Category,
  type CategoryWriteRequest,
} from '../api'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'

const SECTION = { label: 'Catégories', to: '/categories' }

// A failed write: shown next to the name or description input when the
// API points at one of them, above the form otherwise.
interface WriteError {
  field: string
  message: string
}

function toWriteError(err: unknown): WriteError {
  return { field: err instanceof ApiError ? err.field : '', message: errorMessage(err) }
}

function coelbookCount(n: number): string {
  return `${n} coelbook${n > 1 ? 's' : ''}`
}

export default function CategoriesView() {
  const navigate = useNavigate()

  const [categories, setCategories] = useState<Category[] | null>(null)
  const [loadError, setLoadError] = useState('')

  // Every API failure goes through here so an expired session always
  // sends the user back to the login page.
  function handleAuth(err: unknown): boolean {
    if (err instanceof ApiError && err.code === 401) {
      clearSession()
      navigate('/login')

      return true
    }

    return false
  }

  useEffect(() => {
    let cancelled = false

    listCategories()
      .then((list) => {
        if (!cancelled) setCategories(list)
      })
      .catch((err: unknown) => {
        if (cancelled) return

        if (err instanceof ApiError && err.code === 401) {
          clearSession()
          navigate('/login')

          return
        }

        setLoadError(errorMessage(err))
      })

    return () => {
      cancelled = true
    }
  }, [navigate])

  // Keeps the list sorted by name like the API returns it, so a created or
  // renamed category lands where a reload would put it.
  function upsert(category: Category, previousSlug?: string) {
    setCategories((list) =>
      [...(list ?? []).filter((c) => c.slug !== (previousSlug ?? category.slug)), category].sort((a, b) =>
        a.name.localeCompare(b.name, 'fr'),
      ),
    )
  }

  function remove(slug: string) {
    setCategories((list) => (list ?? []).filter((c) => c.slug !== slug))
  }

  return (
    <div className="d-flex" style={{ minHeight: '100vh' }}>
      <Sidebar />

      <main className="flex-grow-1 d-flex flex-column min-w-0" style={{ backgroundColor: 'var(--pb-bg)' }}>
        <Topbar section={SECTION} />

        <div className="flex-grow-1 overflow-y-auto">
          <div className="mx-auto px-4 px-lg-5 py-4" style={{ maxWidth: '56rem' }}>
            <div className="mb-4">
              <h1 className="h4 fw-bold mb-1">Catégories</h1>
              <p className="small mb-0" style={{ color: 'var(--pb-text-muted)' }}>
                Les grands domaines techniques qui regroupent vos coelbooks.
              </p>
            </div>

            {loadError && (
              <div className="badge-danger-soft rounded-3 small mb-4 py-2 px-3" role="alert">
                {loadError}
              </div>
            )}

            {!loadError && categories === null && (
              <div className="text-center py-5" style={{ color: 'var(--pb-text-muted)' }}>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Chargement des catégories…
              </div>
            )}

            {categories !== null && (
              <div className="d-flex flex-column gap-3">
                <CreateCategoryForm onCreated={(c) => upsert(c)} onAuthError={handleAuth} />

                {categories.length === 0 ? (
                  <div className="pb-card border rounded-4 p-4 small text-center" style={{ color: 'var(--pb-text-muted)' }}>
                    Aucune catégorie pour l&apos;instant. Créez-en une pour pouvoir rédiger votre premier coelbook.
                  </div>
                ) : (
                  <ul className="pb-card border rounded-4 list-unstyled mb-0">
                    {categories.map((category, i) => (
                      <CategoryRow
                        key={category.slug}
                        category={category}
                        isLast={i === categories.length - 1}
                        onUpdated={(c) => upsert(c, category.slug)}
                        onDeleted={() => remove(category.slug)}
                        onAuthError={handleAuth}
                      />
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

interface CreateCategoryFormProps {
  onCreated: (category: Category) => void
  onAuthError: (err: unknown) => boolean
}

function CreateCategoryForm({ onCreated, onAuthError }: CreateCategoryFormProps) {
  const [form, setForm] = useState<CategoryWriteRequest>({ name: '', description: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<WriteError | null>(null)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      onCreated(await createCategory(form))
      setForm({ name: '', description: '' })
    } catch (err) {
      if (!onAuthError(err)) setError(toWriteError(err))
    } finally {
      setSubmitting(false)
    }
  }

  const nameError = error?.field === 'name' ? error.message : ''
  const descriptionError = error?.field === 'description' ? error.message : ''

  return (
    <form onSubmit={handleSubmit} noValidate className="pb-card border rounded-4 p-4">
      <h2 className="fs-6 fw-semibold mb-3">Nouvelle catégorie</h2>

      <div className="row g-2 align-items-start">
        <div className="col-md-4">
          <input
            className={`form-control form-control-sm ${nameError ? 'is-invalid' : ''}`}
            placeholder="Nom"
            aria-label="Nom de la nouvelle catégorie"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            maxLength={100}
          />
          {nameError && <div className="invalid-feedback d-block small">{nameError}</div>}
        </div>
        <div className="col-md">
          <input
            className={`form-control form-control-sm ${descriptionError ? 'is-invalid' : ''}`}
            placeholder="Description (facultative)"
            aria-label="Description de la nouvelle catégorie"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            maxLength={500}
          />
          {descriptionError && <div className="invalid-feedback d-block small">{descriptionError}</div>}
        </div>
        <div className="col-md-auto">
          <button type="submit" className="btn btn-primary btn-sm fw-medium w-100" disabled={submitting}>
            {submitting && <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>}
            Ajouter
          </button>
        </div>
      </div>

      {error && !nameError && !descriptionError && (
        <div className="badge-danger-soft rounded-3 small mt-3 py-2 px-3" role="alert">
          {error.message}
        </div>
      )}
    </form>
  )
}

interface CategoryRowProps {
  category: Category
  isLast: boolean
  onUpdated: (category: Category) => void
  onDeleted: () => void
  onAuthError: (err: unknown) => boolean
}

type RowMode = 'view' | 'edit' | 'confirm-delete'

function CategoryRow({ category, isLast, onUpdated, onDeleted, onAuthError }: CategoryRowProps) {
  const [mode, setMode] = useState<RowMode>('view')
  const [form, setForm] = useState<CategoryWriteRequest>({ name: category.name, description: category.description })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<WriteError | null>(null)

  const inUse = category.incident_count > 0

  function startEdit() {
    setForm({ name: category.name, description: category.description })
    setError(null)
    setMode('edit')
  }

  function cancel() {
    setError(null)
    setMode('view')
  }

  async function handleSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setBusy(true)

    try {
      onUpdated(await updateCategory(category.slug, form))
      setMode('view')
    } catch (err) {
      if (!onAuthError(err)) setError(toWriteError(err))
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete() {
    setError(null)
    setBusy(true)

    try {
      await deleteCategory(category.slug)
      onDeleted()
    } catch (err) {
      if (!onAuthError(err)) setError(toWriteError(err))
      setBusy(false)
      setMode('view')
    }
  }

  const nameError = error?.field === 'name' ? error.message : ''
  const descriptionError = error?.field === 'description' ? error.message : ''

  return (
    <li className={`p-3 px-4 ${isLast ? '' : 'border-bottom'}`}>
      {mode === 'edit' ? (
        <form onSubmit={handleSave} noValidate className="row g-2 align-items-start">
          <div className="col-md-4">
            <input
              className={`form-control form-control-sm ${nameError ? 'is-invalid' : ''}`}
              aria-label={`Nom de la catégorie ${category.name}`}
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              maxLength={100}
              autoFocus
            />
            {nameError && <div className="invalid-feedback d-block small">{nameError}</div>}
          </div>
          <div className="col-md">
            <input
              className={`form-control form-control-sm ${descriptionError ? 'is-invalid' : ''}`}
              placeholder="Description (facultative)"
              aria-label={`Description de la catégorie ${category.name}`}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              maxLength={500}
            />
            {descriptionError && <div className="invalid-feedback d-block small">{descriptionError}</div>}
          </div>
          <div className="col-md-auto d-flex gap-2">
            <button type="button" className="btn btn-sm btn-outline-secondary fw-medium" onClick={cancel} disabled={busy}>
              Annuler
            </button>
            <button type="submit" className="btn btn-sm btn-primary fw-medium" disabled={busy}>
              Enregistrer
            </button>
          </div>
        </form>
      ) : (
        <div className="d-flex align-items-center gap-3 flex-wrap">
          <div className="flex-grow-1 min-w-0">
            <div className="fw-semibold small">{category.name}</div>
            {category.description && (
              <div className="small text-truncate" style={{ color: 'var(--pb-text-muted)' }}>
                {category.description}
              </div>
            )}
          </div>

          <span
            className="font-mono rounded-2 border px-2 py-0 flex-shrink-0"
            style={{ fontSize: '0.7rem', backgroundColor: 'var(--pb-bg)', color: 'var(--pb-text-muted)' }}
          >
            {coelbookCount(category.incident_count)}
          </span>

          {mode === 'confirm-delete' ? (
            <div className="d-flex align-items-center gap-2 flex-shrink-0">
              <span className="small">Supprimer « {category.name} » ?</span>
              <button type="button" className="btn btn-sm btn-danger fw-medium" onClick={handleDelete} disabled={busy}>
                Supprimer
              </button>
              <button type="button" className="btn btn-sm btn-outline-secondary fw-medium" onClick={cancel} disabled={busy}>
                Annuler
              </button>
            </div>
          ) : (
            <div className="d-flex gap-1 flex-shrink-0">
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary border-0"
                onClick={startEdit}
                aria-label={`Modifier la catégorie ${category.name}`}
                title="Modifier"
              >
                <i className="fa-solid fa-pen" style={{ fontSize: '0.75rem' }}></i>
              </button>
              {/* A wrapper carries the tooltip: disabled buttons don't show one. */}
              <span title={inUse ? `Utilisée par ${coelbookCount(category.incident_count)}` : 'Supprimer'}>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger border-0"
                  onClick={() => setMode('confirm-delete')}
                  disabled={inUse}
                  aria-label={
                    inUse
                      ? `Impossible de supprimer ${category.name} : utilisée par ${coelbookCount(category.incident_count)}`
                      : `Supprimer la catégorie ${category.name}`
                  }
                >
                  <i className="fa-solid fa-trash-can" style={{ fontSize: '0.75rem' }}></i>
                </button>
              </span>
            </div>
          )}
        </div>
      )}

      {error && !nameError && !descriptionError && (
        <div className="badge-danger-soft rounded-3 small mt-2 py-2 px-3" role="alert">
          {error.message}
        </div>
      )}
    </li>
  )
}
