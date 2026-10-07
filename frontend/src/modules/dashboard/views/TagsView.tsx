import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { ApiError } from '@/http/client'
import { errorMessage } from '@/http/errors'
import { clearSession } from '@/modules/auth/session'
import { deleteTag, listTags, mergeTag, purgeUnusedTags, renameTag, type IncidentTag } from '../api'
import AppLayout from '../components/AppLayout'
import { slugify } from '../lib/slug'

const SECTION = { label: 'Tags', to: '/tags' }

function coelbookCount(n: number): string {
  return `${n} coelbook${n > 1 ? 's' : ''}`
}

const byName = (a: IncidentTag, b: IncidentTag) => a.name.localeCompare(b.name, 'fr')

export default function TagsView() {
  const navigate = useNavigate()

  const [tags, setTags] = useState<IncidentTag[] | null>(null)
  const [loadError, setLoadError] = useState('')
  const [filter, setFilter] = useState('')
  const [confirmPurge, setConfirmPurge] = useState(false)
  const [purging, setPurging] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  // Every API failure goes through here so an expired session always sends
  // the user back to the login page.
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

    listTags(true)
      .then((list) => {
        if (!cancelled) setTags(list)
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

  function replace(previousSlug: string, tag: IncidentTag) {
    setTags((list) => [...(list ?? []).filter((t) => t.slug !== previousSlug && t.slug !== tag.slug), tag].sort(byName))
  }

  function remove(slug: string) {
    setTags((list) => (list ?? []).filter((t) => t.slug !== slug))
  }

  async function handlePurge() {
    setError('')
    setNotice('')
    setPurging(true)

    try {
      const { deleted } = await purgeUnusedTags()
      setTags((list) => (list ?? []).filter((t) => t.incident_count > 0))
      setNotice(`${deleted} tag${deleted > 1 ? 's' : ''} inutilisé${deleted > 1 ? 's' : ''} supprimé${deleted > 1 ? 's' : ''}.`)
    } catch (err) {
      if (!handleAuth(err)) setError(errorMessage(err))
    } finally {
      setPurging(false)
      setConfirmPurge(false)
    }
  }

  const unused = tags?.filter((t) => t.incident_count === 0).length ?? 0
  const visible = tags?.filter((t) => !filter.trim() || slugify(t.name).includes(slugify(filter))) ?? []

  return (
    <AppLayout section={SECTION}>
      <div className="mx-auto px-4 px-lg-5 py-4" style={{ maxWidth: '56rem' }}>
        <div className="mb-4">
          <h1 className="h4 fw-bold mb-1">Tags</h1>
          <p className="small mb-0" style={{ color: 'var(--pb-text-muted)' }}>
            Les mots-clés des coelbooks. Renommez-les, fusionnez les doublons (« postgres » et « postgresql »), ou
            supprimez ceux qui ne servent plus.
          </p>
        </div>

        {loadError && (
          <div className="badge-danger-soft rounded-3 small mb-4 py-2 px-3" role="alert">
            {loadError}
          </div>
        )}

        {!loadError && tags === null && (
          <div className="text-center py-5" style={{ color: 'var(--pb-text-muted)' }}>
            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
            Chargement des tags…
          </div>
        )}

        {tags !== null && (
          <div className="d-flex flex-column gap-3">
            <div className="d-flex flex-wrap align-items-center gap-2">
              <input
                className="form-control form-control-sm"
                style={{ maxWidth: '18rem' }}
                placeholder="Filtrer les tags…"
                aria-label="Filtrer les tags"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />

              {unused > 0 &&
                (confirmPurge ? (
                  <div className="d-flex align-items-center gap-2 ms-auto">
                    <span className="small">
                      Supprimer {unused} tag{unused > 1 ? 's' : ''} inutilisé{unused > 1 ? 's' : ''} ?
                    </span>
                    <button type="button" className="btn btn-sm btn-danger fw-medium" onClick={handlePurge} disabled={purging}>
                      Supprimer
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary fw-medium"
                      onClick={() => setConfirmPurge(false)}
                      disabled={purging}
                    >
                      Annuler
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary fw-medium ms-auto d-flex align-items-center gap-2"
                    onClick={() => setConfirmPurge(true)}
                  >
                    <i className="fa-solid fa-broom" style={{ fontSize: '0.7rem' }}></i>
                    Nettoyer les tags inutilisés ({unused})
                  </button>
                ))}
            </div>

            {notice && (
              <div className="badge-success-soft rounded-3 small py-2 px-3" role="status">
                {notice}
              </div>
            )}

            {error && (
              <div className="badge-danger-soft rounded-3 small py-2 px-3" role="alert">
                {error}
              </div>
            )}

            {tags.length === 0 ? (
              <div className="pb-card border rounded-4 p-4 small text-center" style={{ color: 'var(--pb-text-muted)' }}>
                Aucun tag pour l&apos;instant. Ils se créent depuis le formulaire d&apos;un coelbook.
              </div>
            ) : visible.length === 0 ? (
              <div className="pb-card border rounded-4 p-4 small text-center" style={{ color: 'var(--pb-text-muted)' }}>
                Aucun tag ne correspond à « {filter.trim()} ».
              </div>
            ) : (
              <ul className="pb-card border rounded-4 list-unstyled mb-0">
                {visible.map((tag, i) => (
                  <TagRow
                    key={tag.slug}
                    tag={tag}
                    allTags={tags}
                    isLast={i === visible.length - 1}
                    onReplaced={(t) => replace(tag.slug, t)}
                    onDeleted={() => remove(tag.slug)}
                    onAuthError={handleAuth}
                  />
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  )
}

interface TagRowProps {
  tag: IncidentTag
  allTags: IncidentTag[]
  isLast: boolean
  // Called with the tag that now stands for this row: the renamed tag, or
  // the merge target (this row's tag is gone then).
  onReplaced: (tag: IncidentTag) => void
  onDeleted: () => void
  onAuthError: (err: unknown) => boolean
}

type RowMode = 'view' | 'edit' | 'confirm-merge' | 'confirm-delete'

function TagRow({ tag, allTags, isLast, onReplaced, onDeleted, onAuthError }: TagRowProps) {
  const [mode, setMode] = useState<RowMode>('view')
  const [name, setName] = useState(tag.name)
  const [busy, setBusy] = useState(false)
  const [nameError, setNameError] = useState('')
  const [error, setError] = useState('')

  // When a rename collides with an existing tag, that tag is the one the
  // API resolved the new name to — same slug rule on both sides.
  const mergeTarget = allTags.find((t) => t.slug === slugify(name) && t.slug !== tag.slug)

  function reset(next: RowMode) {
    setNameError('')
    setError('')
    setMode(next)
  }

  async function handleRename(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    reset('edit')
    setBusy(true)

    try {
      onReplaced(await renameTag(tag.slug, name))
      setMode('view')
    } catch (err) {
      if (onAuthError(err)) return

      if (err instanceof ApiError && err.errorCode === 'tag_exists' && mergeTarget) {
        setMode('confirm-merge')
      } else if (err instanceof ApiError && err.field === 'name') {
        setNameError(errorMessage(err))
      } else {
        setError(errorMessage(err))
      }
    } finally {
      setBusy(false)
    }
  }

  async function handleMerge() {
    if (!mergeTarget) return

    setBusy(true)

    try {
      onReplaced(await mergeTag(tag.slug, mergeTarget.slug))
    } catch (err) {
      if (!onAuthError(err)) {
        setError(errorMessage(err))
        setMode('edit')
      }
      setBusy(false)
    }
  }

  async function handleDelete() {
    setBusy(true)

    try {
      await deleteTag(tag.slug)
      onDeleted()
    } catch (err) {
      if (!onAuthError(err)) setError(errorMessage(err))
      setBusy(false)
      setMode('view')
    }
  }

  return (
    <li className={`p-3 px-4 ${isLast ? '' : 'border-bottom'}`}>
      {mode === 'edit' || mode === 'confirm-merge' ? (
        <>
          <form onSubmit={handleRename} noValidate className="d-flex flex-wrap gap-2 align-items-start">
            <div className="flex-grow-1" style={{ minWidth: '12rem' }}>
              <input
                className={`form-control form-control-sm ${nameError ? 'is-invalid' : ''}`}
                aria-label={`Nouveau nom du tag ${tag.name}`}
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  if (mode === 'confirm-merge') reset('edit')
                }}
                maxLength={50}
                autoFocus
              />
              {nameError && <div className="invalid-feedback d-block small">{nameError}</div>}
            </div>
            <button type="button" className="btn btn-sm btn-outline-secondary fw-medium" onClick={() => reset('view')} disabled={busy}>
              Annuler
            </button>
            <button type="submit" className="btn btn-sm btn-primary fw-medium" disabled={busy || mode === 'confirm-merge'}>
              Renommer
            </button>
          </form>

          {mode === 'confirm-merge' && mergeTarget && (
            <div className="pb-merge-prompt rounded-3 small mt-2 p-2 px-3 d-flex flex-wrap align-items-center gap-2">
              <span className="flex-grow-1">
                Le tag « {mergeTarget.name} » existe déjà. Fusionner « {tag.name} » dans « {mergeTarget.name} » ?
                {tag.incident_count === 1 && <> Son coelbook prendra le tag « {mergeTarget.name} ».</>}
                {tag.incident_count > 1 && <> Ses {tag.incident_count} coelbooks prendront le tag « {mergeTarget.name} ».</>}
              </span>
              <button type="button" className="btn btn-sm btn-primary fw-medium" onClick={handleMerge} disabled={busy}>
                Fusionner
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="d-flex align-items-center gap-3 flex-wrap">
          <div className="flex-grow-1 min-w-0 d-flex align-items-center gap-2">
            <i className="fa-solid fa-tag" style={{ fontSize: '0.65rem', color: 'var(--pb-text-muted)' }}></i>
            <span className="fw-semibold small text-truncate">{tag.name}</span>
          </div>

          {tag.incident_count > 0 ? (
            <Link
              to={`/dashboard?tag=${encodeURIComponent(tag.slug)}`}
              className="font-mono rounded-2 border px-2 py-0 flex-shrink-0 text-decoration-none"
              style={{ fontSize: '0.7rem', backgroundColor: 'var(--pb-bg)', color: 'var(--pb-text-muted)' }}
              title="Voir les coelbooks avec ce tag"
            >
              {coelbookCount(tag.incident_count)}
            </Link>
          ) : (
            <span className="badge-soft badge-muted-soft flex-shrink-0">Inutilisé</span>
          )}

          {mode === 'confirm-delete' ? (
            <div className="d-flex align-items-center gap-2 flex-shrink-0 flex-wrap">
              <span className="small">
                {tag.incident_count > 0
                  ? `Retirer « ${tag.name} » de ${coelbookCount(tag.incident_count)} et le supprimer ?`
                  : `Supprimer « ${tag.name} » ?`}
              </span>
              <button type="button" className="btn btn-sm btn-danger fw-medium" onClick={handleDelete} disabled={busy}>
                Supprimer
              </button>
              <button type="button" className="btn btn-sm btn-outline-secondary fw-medium" onClick={() => reset('view')} disabled={busy}>
                Annuler
              </button>
            </div>
          ) : (
            <div className="d-flex gap-1 flex-shrink-0">
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary border-0"
                onClick={() => {
                  setName(tag.name)
                  reset('edit')
                }}
                aria-label={`Renommer le tag ${tag.name}`}
                title="Renommer ou fusionner"
              >
                <i className="fa-solid fa-pen" style={{ fontSize: '0.75rem' }}></i>
              </button>
              <button
                type="button"
                className="btn btn-sm btn-outline-danger border-0"
                onClick={() => reset('confirm-delete')}
                aria-label={`Supprimer le tag ${tag.name}`}
                title="Supprimer"
              >
                <i className="fa-solid fa-trash-can" style={{ fontSize: '0.75rem' }}></i>
              </button>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="badge-danger-soft rounded-3 small mt-2 py-2 px-3" role="alert">
          {error}
        </div>
      )}
    </li>
  )
}
